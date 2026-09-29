(() => {
 const form=document.getElementById('setupForm'),button=form.querySelector('button'),message=document.getElementById('message');
 const params=new URLSearchParams(location.hash.slice(1));history.replaceState(null,'',location.pathname);
 let token;
 async function verify(){
  if(!params.get('token_hash')||!['invite','recovery'].includes(params.get('type')))throw Error('This invitation link is missing or invalid. Ask your administrator for a new one.');
  const r=await AnvilAPI.fetch('/api/auth/config');const config=await r.json();if(!r.ok)throw Error(config.error);
  const auth=supabase.createClient(config.url,config.anonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const {data,error}=await auth.auth.verifyOtp({token_hash:params.get('token_hash'),type:params.get('type')});
  if(error||!data.session)throw Error('This invitation has expired or was already used. Ask for a new invitation.');
  token=data.session.access_token;button.disabled=false;button.textContent='Set password and continue';
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(button.disabled)return;
  if(form.password.value!==form.confirm.value){message.textContent='Passwords do not match.';return;}
  button.disabled=true;button.setAttribute('aria-busy','true');button.textContent='Setting password…';
  try{
   const r=await AnvilAPI.fetch('/api/admin/setup-password',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({password:form.password.value})});const data=await r.json();if(!r.ok)throw Error(data.error);
   if(data.signInRequired){location.replace('/admin-panel/login.html');return;}
   if(!data.admin){form.hidden=true;message.textContent='Password set. An administrator must grant workspace access to this member account.';return;}
   AnvilAPI.setSession(data);location.replace('/admin-panel/index.html');
  }catch(e){message.textContent=e.message;message.classList.add('error');}
  finally{button.disabled=false;button.removeAttribute('aria-busy');button.textContent='Set password and continue';}
 });
 verify().catch(e=>{message.textContent=e.message;message.classList.add('error');button.textContent='Invitation unavailable';});
})();
