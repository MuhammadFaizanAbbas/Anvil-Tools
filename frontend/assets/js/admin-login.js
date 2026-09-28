(() => {
 const form=document.getElementById('loginForm'), message=document.getElementById('message'), google=document.getElementById('googleLogin');
 const report=text=>{message.textContent=text;message.classList.add('error');};
 let clientPromise;
 async function client(){
  if(!clientPromise)clientPromise=(async()=>{
   const response=await AnvilAPI.fetch('/api/auth/config');const data=await response.json();
   if(!response.ok)throw Error(data.error||'Sign-in configuration is unavailable.');
   return supabase.createClient(data.url,data.anonKey,{auth:{flowType:'pkce',storage:sessionStorage,persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'anvil_oauth'}});
  })().catch(error=>{clientPromise=null;throw error;});
  return clientPromise;
 }
 async function finish(session){
  AnvilAPI.setSession({accessToken:session.access_token,expiresAt:session.expires_at});
  const response=await AnvilAPI.fetch('/api/admin/me');
  if(!response.ok){AnvilAPI.clearSession();throw Error(response.status===403?'Your account does not have admin access. Ask an administrator to grant access.':'Unable to verify admin access. Please try again.');}
  sessionStorage.removeItem('anvil_oauth');
  location.replace('/admin-panel/index.html');
 }
 google.addEventListener('click',async()=>{
  google.disabled=true;message.textContent='Opening Google sign-in…';
  try{const auth=await client();const {error}=await auth.auth.signInWithOAuth({provider:'google',options:{redirectTo:new URL('login.html',location.href).href.split('?')[0].split('#')[0]}});if(error)throw error;}
  catch(error){report(error.message);google.disabled=false;}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;message.classList.remove('error');message.textContent='Signing in…';
  try{const response=await AnvilAPI.fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.email.value,password:form.password.value})});const data=await response.json();if(!response.ok)throw Error(data.error||'Sign-in failed.');AnvilAPI.setSession(data);location.replace('/admin-panel/index.html');}
  catch(error){report(error.message);}finally{button.disabled=false;}
 });
 document.getElementById('togglePassword').addEventListener('click',event=>{const input=form.password;input.type=input.type==='password'?'text':'password';event.currentTarget.textContent=input.type==='password'?'Show':'Hide';});
 const params=new URLSearchParams(location.search);
 const fragment=new URLSearchParams(location.hash.slice(1));
 if(params.has('error')||fragment.has('error')){history.replaceState(null,'',location.pathname);report('Sign-in was cancelled or could not be completed. Please try again.');}
 else if(params.has('code')){
  const code=params.get('code');history.replaceState(null,'',location.pathname);google.disabled=true;message.textContent='Verifying your account…';
  client().then(auth=>auth.auth.exchangeCodeForSession(code)).then(({data,error})=>{if(error)throw error;return finish(data.session);}).catch(error=>{report(error.message);google.disabled=false;});
 }else if(fragment.has('access_token')){
  // Invite links use implicit tokens. Verify them server-side; never trust URL user metadata.
  const accessToken=fragment.get('access_token');const expiresAt=Math.floor(Date.now()/1000)+Number(fragment.get('expires_in')||0);
  history.replaceState(null,'',location.pathname);
  finish({access_token:accessToken,expires_at:expiresAt}).catch(error=>report(error.message));
 }
})();
