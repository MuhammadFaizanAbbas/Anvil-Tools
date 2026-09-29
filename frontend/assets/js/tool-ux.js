document.addEventListener('DOMContentLoaded',()=>{
 // Reflect actual async disabled state rather than show an arbitrary loading overlay.
 const track=button=>{
  if(button.dataset.busyLabel)return;
  button.dataset.busyLabel=button.textContent;
  new MutationObserver(()=>{
   if(button.disabled&&button.dataset.operation==='true'){button.setAttribute('aria-busy','true');button.textContent=button.dataset.busyText||'Working…';}
   else if(!button.disabled&&button.hasAttribute('aria-busy')){button.removeAttribute('aria-busy');button.textContent=button.dataset.busyLabel;button.dataset.operation='false';}
  }).observe(button,{attributes:true,attributeFilter:['disabled']});
  button.addEventListener('click',()=>{button.dataset.operation='true';},true);
 };
 document.querySelectorAll('.tool-app button').forEach(track);
 document.querySelectorAll('.tool-app .status-msg,[id$="-status"]').forEach(el=>{el.setAttribute('role','status');el.setAttribute('aria-live','polite');});
});
