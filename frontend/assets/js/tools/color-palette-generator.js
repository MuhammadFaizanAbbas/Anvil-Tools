document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('cp-generate');
  const row = document.getElementById('cp-row');
  const status = document.getElementById('cp-status');

  if (!generateBtn || !row || !status) return;

  const locked = new Set();

  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };


  let colors=[];
  const luminance=hex=>{const rgb=hex.match(/[a-f0-9]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
  const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
  const controls=document.createElement('div');controls.className='palette-controls';controls.innerHTML='<label>Starting color<input type="color" id="cp-base" value="#4263eb"></label><label>Harmony<select id="cp-mode"><option value="analogous">Analogous</option><option value="complementary">Complementary</option><option value="mono">Monochrome</option></select></label><button type="button" class="btn secondary" id="cp-export">Copy CSS variables</button>';
  row.before(controls);
  const preview=document.createElement('div');preview.className='palette-preview';row.after(preview);
  function render(){
    row.replaceChildren();
    colors.forEach((color,index)=>{
      const swatch=document.createElement('div');swatch.className='swatch';swatch.style.background=color;
      const lock=document.createElement('button');lock.type='button';lock.textContent=locked.has(index)?'Unlock':'Lock';lock.setAttribute('aria-pressed',String(locked.has(index)));lock.setAttribute('aria-label',`${locked.has(index)?'Unlock':'Lock'} color ${index+1}`);
      lock.onclick=()=>{locked.has(index)?locked.delete(index):locked.add(index);render();};
      const copy=document.createElement('button');copy.type='button';copy.textContent=color;copy.setAttribute('aria-label',`Copy ${color}`);copy.onclick=async()=>{try{await navigator.clipboard.writeText(color);status.textContent=`Copied ${color}`;}catch(_){status.textContent=`Copy this color: ${color}`;}};
      swatch.append(lock,copy);row.append(swatch);
    });
    const white=contrast(colors[0],'#FFFFFF'),black=contrast(colors[0],'#000000');const text=white>black?'#FFFFFF':'#000000';
    preview.style.background=colors[0];preview.style.color=text;preview.textContent=`Preview: readable text on your primary color. Contrast ${(Math.max(white,black)).toFixed(2)}:1 with ${text}. Test other color pairs before using them for text.`;
  }
  const buildPalette=()=>{
    const hex=document.getElementById('cp-base').value;const rgb=hex.match(/[a-f0-9]{2}/gi).map(v=>parseInt(v,16)/255),max=Math.max(...rgb),min=Math.min(...rgb),d=max-min;
    let hue=d===0?0:max===rgb[0]?60*((rgb[1]-rgb[2])/d%6):max===rgb[1]?60*((rgb[2]-rgb[0])/d+2):60*((rgb[0]-rgb[1])/d+4);hue=(hue+360)%360;
    const mode=document.getElementById('cp-mode').value;
    colors=Array.from({length:5},(_,i)=>locked.has(i)&&colors[i]?colors[i]:i===0?hex.toUpperCase():hslToHex((hue+(mode==='mono'?0:mode==='complementary'?(i%2)*180:i*24-48)+360)%360,mode==='mono'?55:65,30+i*12));
    render();status.textContent='Palette ready. Lock colors to keep them, copy a swatch, or export CSS.';
  };
  generateBtn.addEventListener('click',()=>{const bytes=crypto.getRandomValues(new Uint8Array(3));document.getElementById('cp-base').value='#'+Array.from(bytes,v=>v.toString(16).padStart(2,'0')).join('');buildPalette();});
  document.getElementById('cp-base').addEventListener('input',buildPalette);document.getElementById('cp-mode').addEventListener('change',buildPalette);
  document.getElementById('cp-export').onclick=async()=>{const css=':root {\n'+colors.map((c,i)=>`  --color-${i+1}: ${c};`).join('\n')+'\n}';try{await navigator.clipboard.writeText(css);status.textContent='CSS variables copied.';}catch(_){status.textContent=css;}};
  buildPalette();
});
