// Layout check using installed Edge and local fixtures; never connects to the API.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {spawn} = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve('frontend');
const browserPath = process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const profile = fs.mkdtempSync(path.join(os.tmpdir(),'anvil-mobile-'));
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + new URL(req.url,'http://localhost').pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.svg')?'image/svg+xml':'text/html');
  let content = fs.readFileSync(file);
  if (file.endsWith('admin-panel'+path.sep+'index.html')) {
    content = content.toString().replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
    const navigation = fs.readFileSync(path.join(root,'assets/js/admin-navigation.js'),'utf8');
    const dashboard = fs.readFileSync(path.join(root,'assets/js/admin.js'),'utf8').replace(/    refresh\(\);\s*$/,'');
    content = content.replace('</body>',`<script>${navigation}\n${dashboard}</script></body>`);
  }
  res.end(content);
});
let browser, socket;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser = spawn(browserPath,['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
  browser.on('error',error=>{console.error(error.message);process.exitCode=1;});
  const portFile=path.join(profile,'DevToolsActivePort');
  for(let i=0;i<100&&!fs.existsSync(portFile);i++) await new Promise(resolve=>setTimeout(resolve,100));
  const port=fs.readFileSync(portFile,'utf8').split('\n')[0];
  const targets=await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket=new WebSocket(targets.find(target=>target.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
  let id=0;const pending=new Map();
  socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(pending.has(message.id)){const {resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(Error(message.error.message)):resolve(message.result);}});
  const call=(method,params={})=>new Promise((resolve,reject)=>{const next=++id;pending.set(next,{resolve,reject});socket.send(JSON.stringify({id:next,method,params}));});
  const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
  await call('Page.enable');
  await call('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/admin-panel/index.html`});
  for(let i=0;i<100;i++){if(await evaluate('document.readyState === "complete"'))break;await new Promise(resolve=>setTimeout(resolve,50));}
  await evaluate(`renderTools([{slug:'test',name:'Example tool with a long name',category:'Developer tools',views:15,status:'active'}]);renderStats({totalVisitors:15,publishedPosts:2,draftPosts:1},[{status:'active'}]);renderAnalytics([{name:'Example tool',category:'Developer tools',views:15}]);`);
  for(const width of [320,375,390,768,800,1024,1440]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});
    await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    const mobile=width<=800;
    assert.equal(await evaluate('adminSidebar.hidden'),mobile,`sidebar at ${width}`);
    assert.equal(await evaluate('adminMenuToggle.hidden'),!mobile,`toggle at ${width}`);
    if(mobile){
      await evaluate('adminMenuToggle.click()');
      assert.equal(await evaluate('adminSidebar.hidden'),false);
      assert.equal(await evaluate('adminMenuToggle.getAttribute("aria-expanded")'),'true');
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'),`menu overflow at ${width}`);
      await evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"}))');
      assert.equal(await evaluate('adminSidebar.hidden'),true);
      await evaluate('adminMenuToggle.click();adminSidebar.querySelectorAll(".nav-item")[1].click()');
      assert.equal(await evaluate('adminSidebar.hidden'),true);
    }
    for(const panel of ['overview','tools','posts','analytics','contacts','users','categories','audit','settings']) {
      await evaluate(`location.hash='#${panel}';selectPanel();document.getElementById('postForm').hidden=${panel!=='posts'};`);
      const overflow=await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth,items:[...document.querySelectorAll('main *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1&&getComputedStyle(el).position!=='absolute').slice(0,6).map(el=>el.id||el.className||el.tagName)})`);
      assert.ok(overflow.scroll<=width,`${panel} at ${width}: ${JSON.stringify(overflow)}`);
    }
    console.log(`Passed ${width}px: navigation and all nine panels.`);
  }
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{socket?.close();browser?.kill();server.close();});
