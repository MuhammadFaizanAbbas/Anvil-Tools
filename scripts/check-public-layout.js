// Public layout and semantic checks in Edge. Tool scripts are omitted: this does not test tool outputs.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {spawn} = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve('frontend');
const browserPath = process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const profile = fs.mkdtempSync(path.join(os.tmpdir(),'anvil-public-'));
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + new URL(req.url,'http://localhost').pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.svg')?'image/svg+xml':'text/html');
  let content = fs.readFileSync(file);
  if (file.endsWith('.html')) {
    content = content.toString().replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
    const main = fs.readFileSync(path.join(root,'assets/js/main.js'),'utf8');
    content = content.replace('</body>',`<script>${main}</script></body>`);
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
  const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);
  const pages=walk(root).filter(file=>file.endsWith('.html')&&!file.includes('admin-panel')).map(file=>'/'+path.relative(root,file).replace(/\\/g,'/'));
  const findings=[];
  for(const url of pages) {
    await call('Page.navigate',{url:`http://127.0.0.1:${server.address().port}${url}`});
    for(let i=0;i<100;i++){if(await evaluate('document.readyState === "complete"'))break;await new Promise(resolve=>setTimeout(resolve,30));}
    for(const width of [320,768,1440]) {
      await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
      await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
      const result=await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,
        missingLabels:[...document.querySelectorAll('input:not([type=hidden]),textarea,select')].filter(el=>!el.labels?.length&&!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby')).map(el=>el.id),
        missingAlt:[...document.querySelectorAll('img:not([alt])')].length,
        overflow:[...document.querySelectorAll('main *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,5).map(el=>el.id||el.className||el.tagName)})`);
      findings.push({url,...result});
      if(url==='/about.html' && [320,1440].includes(width)) {
        const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        fs.mkdirSync('docs/audits',{recursive:true});fs.writeFileSync(`docs/audits/about-${width}.png`,Buffer.from(shot.data,'base64'));
      }
    }
  }
  fs.mkdirSync('docs/audits',{recursive:true});fs.writeFileSync('docs/audits/public-layout.json',JSON.stringify(findings,null,2)+'\n');
  const issues=findings.filter(r=>r.scroll>r.width||r.h1!==1||r.missingLabels.length||r.missingAlt);
  console.log(JSON.stringify({pages:pages.length,viewports:findings.length,issues},null,2));
  if(issues.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{socket?.close();browser?.kill();server.close();});
