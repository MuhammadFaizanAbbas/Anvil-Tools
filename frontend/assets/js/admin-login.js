(() => {
 const form=document.getElementById('loginForm'), message=document.getElementById('message');
 const report=text=>{message.textContent=text;message.classList.add('error');};
 form.addEventListener('submit',async event=>{
  event.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;button.textContent='Signing in...';button.setAttribute('aria-busy','true');message.classList.remove('error');message.textContent='Signing in…';
  try{const response=await AnvilAPI.fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.email.value,password:form.password.value})});const data=await response.json();if(!response.ok)throw Error(data.error||'Sign-in failed.');AnvilAPI.setSession(data);location.replace('/admin-panel/index.html');}
  catch(error){report(error instanceof TypeError?'Cannot reach the sign-in server. Check your connection and try again.':error.message);}finally{button.disabled=false;button.textContent='Sign in';button.removeAttribute('aria-busy');}
 });
 document.getElementById('togglePassword').addEventListener('click',event=>{const input=form.password;input.type=input.type==='password'?'text':'password';event.currentTarget.textContent=input.type==='password'?'Show':'Hide';});
})();
