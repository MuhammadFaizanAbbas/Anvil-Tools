(() => {
 const $=id=>document.getElementById(id);
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let usersPage=0,usersTotal=0;
 async function api(path,options){const response=await AnvilAPI.fetch(path,options);const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||'Could not load workspace data.');return data;}
 const send=(path,method,body)=>api(path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 async function task(button,fn){if(button.disabled)return;const label=button.textContent;button.disabled=true;button.setAttribute('aria-busy','true');button.textContent=button.dataset.busyText||'Working…';try{await fn();}catch(error){showNotice(error.message,true);}finally{button.disabled=false;button.removeAttribute('aria-busy');button.textContent=label;if(button===saveButton)updateDirty();}}
 async function users(){const data=await api(`/api/admin/users?page=${usersPage}`);usersTotal=data.total;$('usersTable').innerHTML=data.items.length?`<div class="table-scroll"><table><thead><tr><th>Person</th><th>Role</th><th>Access</th><th>Action</th></tr></thead><tbody>${data.items.map(u=>`<tr data-user="${esc(u.id)}"><td><strong>${esc(u.display_name||u.email)}</strong><small class="user-email">${esc(u.email)}</small></td><td><select aria-label="Role for ${esc(u.email)}" ${u.protected?'disabled':''}><option value="member" ${u.role==='member'?'selected':''}>Member</option><option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>${u.role==='owner'?'<option selected value="owner">Owner</option>':''}</select></td><td><label><input type="checkbox" ${u.is_active?'checked':''} ${u.protected?'disabled':''}> Enabled</label></td><td><button class="btn secondary small" ${u.protected?'disabled':''}>${u.protected?'Protected':'Save access'}</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="empty-state">No user profiles yet. Create your first team account.</p>';
 $('usersPrev').disabled=usersPage===0;$('usersNext').disabled=(usersPage+1)*25>=usersTotal;$('usersPage').textContent=`Page ${usersPage+1} · ${usersTotal} users`;
 $('usersTable').querySelectorAll('[data-user]').forEach(row=>row.querySelector('td:last-child button').addEventListener('click',event=>task(event.currentTarget,async()=>{await send(`/api/admin/users/${row.dataset.user}`,'PUT',{role:row.querySelector('select').value,is_active:row.querySelector('input').checked});showNotice('Access updated.');await users();})));
 }
 $('usersPrev').addEventListener('click',()=>{usersPage=Math.max(0,usersPage-1);users().catch(e=>showNotice(e.message,true));});$('usersNext').addEventListener('click',()=>{usersPage++;users().catch(e=>showNotice(e.message,true));});
 $('accountForm').addEventListener('submit',event=>{event.preventDefault();task(event.currentTarget.querySelector('button'),async()=>{const result=await send('/api/admin/users','POST',{email:$('accountEmail').value,password:$('accountPassword').value,role:$('accountRole').value});showNotice(result.message);$('accountForm').reset();await users();});});
 async function categories(){const selected=$('postCategory').value;const rows=await api('/api/admin/categories');$('postCategory').innerHTML='<option value="">Uncategorized</option>'+rows.map(c=>`<option value="${esc(c.slug)}">${esc(c.name)}</option>`).join('');$('postCategory').value=selected;$('categoriesList').innerHTML=rows.map(c=>`<button class="panel category-edit" data-category="${esc(c.slug)}"><span class="eyebrow">${esc(c.slug)}</span><h2>${esc(c.name)}</h2><p>${esc(c.description||'Add a description to help your team organize content.')}</p><span>Edit category &#8594;</span></button>`).join('');$('categoriesList').querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{const c=rows.find(c=>c.slug===button.dataset.category);$('categorySlug').value=c.slug;$('categoryName').value=c.name;$('categoryDescription').value=c.description;$('categoryName').focus();}));}
 $('categoryForm').addEventListener('submit',event=>{event.preventDefault();task(event.currentTarget.querySelector('button'),async()=>{await send(`/api/admin/categories/${encodeURIComponent($('categorySlug').value)}`,'PUT',{name:$('categoryName').value,description:$('categoryDescription').value});showNotice('Category saved.');await categories();});});
 const fields={id:'postId',title:'postTitle',slug:'postSlug',excerpt:'postExcerpt',body:'postBody',status:'postStatus',category_slug:'postCategory',seo_title:'postSeoTitle',seo_description:'postSeoDescription',cover_image_id:'postCoverId',cover_alt:'postCoverAlt'};
 let editorGeneration=0,mediaPage=0,mediaTotal=0;
 let coverPreviewUrl=null, baseline='', uploading=false;
 const saveButton=$('postForm').querySelector('button[type=submit]');
 const snapshot=()=>JSON.stringify([...Object.values(fields).map(id=>$(id).value),$('postTags').value]);
 function updateDirty(){saveButton.disabled=uploading||snapshot()===baseline;saveButton.title=saveButton.disabled?'No unsaved changes':'Save your changes';}
 window.addEventListener('beforeunload',event=>{if(!$('postForm').hidden&&snapshot()!==baseline){event.preventDefault();event.returnValue='';}});
 function preview(){
  const title=$('postSeoTitle').value||$('postTitle').value||'Your article title';
  $('searchTitle').textContent=title;
  $('searchDescription').textContent=$('postSeoDescription').value||$('postExcerpt').value||'Add a short description to help readers understand your article.';
  const siteHost=(window.ANVIL_CONFIG?.SITE_URL||window.location.origin||'').replace(/^https?:\/\//,'').replace(/\/$/,'');
  $('searchUrl').textContent=`${siteHost}/journal/${$('postSlug').value||'your-article'}`;
  $('seoTitleCount').textContent=`${$('postSeoTitle').value.length} / 160`;
  $('seoDescriptionCount').textContent=`${$('postSeoDescription').value.length} / 320`;
  const words=$('postBody').value.trim().split(/\s+/).filter(Boolean).length;
  $('wordCount').textContent=`${words} words / ${Math.max(1,Math.ceil(words/200))} min read`;
  $('tagPreview').innerHTML=$('postTags').value.split(',').map(t=>t.trim()).filter(Boolean).slice(0,12).map(t=>`<span>${esc(t)}</span>`).join('');
 }
 function paintCover(url){
  coverPreviewUrl=url;
  $('coverStage').innerHTML=url?`<img src="${esc(url)}" alt="${esc($('postCoverAlt').value)}">`:'<span aria-hidden="true">&#9635;</span><strong>Give your story a cover</strong><p>JPEG, PNG or WebP, up to 3 MB</p>';
  $('removeCover').hidden=!$('postCoverId').value;updateDirty();
 }
 function edit(post={}){
  const generation=++editorGeneration;
  Object.entries(fields).forEach(([key,id])=>$(id).value=post[key]??(key==='status'?'draft':''));
  $('postTags').value=(post.tags||[]).join(', ');$('imageUploadStatus').textContent='';$('postImageFile').value='';
  $('editorHeading').textContent=post.id?'Edit article':'New article';
  $('postRevisions').innerHTML='';$('postForm').hidden=false;$('postsList').hidden=true;$('postsPagination').hidden=true;
  $('viewPublished').hidden=post.status!=='published';$('viewPublished').href=`/journal/${encodeURIComponent(post.slug||'')}`;
  paintCover(null);preview();baseline=snapshot();updateDirty();$('postTitle').focus();window.scrollTo({top:0,behavior:'smooth'});
  if(post.cover_image_id)api(`/api/admin/media/${post.cover_image_id}`).then(asset=>{if(generation===editorGeneration)paintCover(asset.url);}).catch(error=>{if(generation===editorGeneration)$('imageUploadStatus').textContent=error.message;});
 }
 $('postForm').addEventListener('input',()=>{preview();updateDirty();});$('postForm').addEventListener('change',updateDirty);
 $('postTitle').addEventListener('input',()=>{if(!$('postId').value&&!$('postSlug').dataset.manual){$('postSlug').value=$('postTitle').value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,150);preview();}});
 $('postSlug').addEventListener('input',()=>$('postSlug').dataset.manual='true');
 $('removeCover').addEventListener('click',()=>{$('postCoverId').value='';$('postCoverAlt').value='';paintCover(null);});
 $('postCoverAlt').addEventListener('input',()=>paintCover(coverPreviewUrl));
 $('postImageFile').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>3*1024*1024){$('imageUploadStatus').textContent='Choose a JPEG, PNG or WebP under 3 MB.';return;}
  const generation=editorGeneration,save=$('postForm').querySelector('button[type=submit]');
  uploading=true;save.disabled=true;event.target.disabled=true;$('imageUploadStatus').textContent='Uploading and optimizing your image...';
  try{const response=await AnvilAPI.fetch(`/api/admin/media?name=${encodeURIComponent(file.name)}`,{method:'POST',timeoutMs:60000,headers:{'Content-Type':file.type},body:file});const asset=await response.json();if(!response.ok)throw Error(asset.error||'Image upload failed.');if(generation===editorGeneration){$('postCoverId').value=asset.id;paintCover(asset.url);$('imageUploadStatus').textContent='Image uploaded. Save the article to attach it.';}}
  catch(error){$('imageUploadStatus').textContent=error.message;}finally{uploading=false;event.target.disabled=false;updateDirty();}
 });
 async function library(){
  $('mediaPickerGrid').setAttribute('aria-busy','true');$('mediaPickerGrid').innerHTML='<div class="panel-loading"><span></span><p>Loading images…</p></div>';$('mediaPrev').disabled=true;$('mediaNext').disabled=true;
  try{const data=await api(`/api/admin/media?page=${mediaPage}`);mediaTotal=data.total;
  $('mediaPickerGrid').innerHTML=data.items.length?data.items.map(asset=>`<button type="button" class="media-tile" data-image="${esc(asset.id)}"><img src="${esc(asset.url)}" alt="${esc(asset.alt_text||asset.file_name)}"><span>${esc(asset.file_name||'Image')}</span><small>${asset.width||''} x ${asset.height||''}</small></button>`).join(''):'<p class="empty-state">Your library is empty. Upload a photo in the editor first.</p>';
  $('mediaPickerGrid').querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{const asset=data.items.find(a=>a.id===button.dataset.image);$('postCoverId').value=asset.id;paintCover(asset.url);$('mediaPicker').close();$('postCoverAlt').focus();}));
  $('mediaPage').textContent=`Page ${mediaPage+1} / ${mediaTotal} images`;$('mediaPrev').disabled=mediaPage===0;$('mediaNext').disabled=(mediaPage+1)*24>=mediaTotal;
  }catch(error){$('mediaPickerGrid').textContent=error.message;}finally{$('mediaPickerGrid').removeAttribute('aria-busy');}
 }
 $('chooseMedia').addEventListener('click',()=>{$('mediaPicker').showModal();library();});$('closeMedia').addEventListener('click',()=>$('mediaPicker').close());$('mediaPicker').addEventListener('click',event=>{if(event.target===$('mediaPicker'))$('mediaPicker').close();});
 $('mediaPrev').addEventListener('click',()=>{mediaPage=Math.max(0,mediaPage-1);library();});$('mediaNext').addEventListener('click',()=>{mediaPage++;library();});
 $('newPost').addEventListener('click',()=>{delete $('postSlug').dataset.manual;edit();});$('cancelPost').addEventListener('click',()=>{if(snapshot()!==baseline&&!confirm('Discard unsaved article changes?'))return;$('postForm').hidden=true;$('postsList').hidden=false;$('postsPagination').hidden=false;editorGeneration++;});
 $('postsList').addEventListener('click',event=>{const button=event.target.closest('[data-post]');if(button)edit((window.workspacePosts||[]).find(p=>p.id===button.dataset.post));});
 $('postForm').addEventListener('submit',event=>{event.preventDefault();task(event.currentTarget.querySelector('button[type=submit]'),async()=>{const document=Object.fromEntries(Object.entries(fields).map(([key,id])=>[key,$(id).value]));document.id=document.id||crypto.randomUUID();document.category_slug=document.category_slug||null;document.cover_image_id=document.cover_image_id||null;document.tags=[...new Set($('postTags').value.split(',').map(t=>t.trim()).filter(Boolean))];const result=await send('/api/admin/documents','POST',document);edit(result.post);showNotice('Article saved.');await loadDashboard();});});
 $('postHistory').addEventListener('click',event=>task(event.currentTarget,async()=>{if(!$('postId').value)return;$('postRevisions').innerHTML='Loading revisions…';const rows=await api(`/api/admin/documents/${encodeURIComponent($('postId').value)}/revisions`);$('postRevisions').innerHTML=rows.map((row,index)=>`<button type="button" class="btn secondary small" data-revision="${index}">Load ${esc(new Date(row.created_at).toLocaleString())}</button>`).join('')||'No revisions yet.';$('postRevisions').querySelectorAll('[data-revision]').forEach(b=>b.addEventListener('click',()=>{const savedBaseline=baseline;edit(rows[Number(b.dataset.revision)].snapshot);baseline=savedBaseline;updateDirty();showNotice('Revision loaded into the editor. Save to apply it.');}));}));
 async function audit(){const rows=await api('/api/admin/audit');$('auditList').innerHTML=rows.length?rows.map(row=>`<div class="audit-row"><span class="audit-dot"></span><div><strong>${esc(row.action)}</strong><p>${esc(row.target)}</p><small>Actor: ${esc(row.actor_id||'system')} · ${esc(new Date(row.created_at).toLocaleString())}</small></div></div>`).join(''):'<p class="empty-state">Changes to articles and team access will appear here.</p>';}
 async function system(){const data=await api('/api/admin/system');$('systemCards').innerHTML=`<div class="panel"><span class="eyebrow">DATABASE</span><h2>Supabase connected</h2><p>Workspace configuration loaded successfully.</p></div><div class="panel"><span class="eyebrow">EMAIL DELIVERY</span><h2>${data.smtpConfigured?'SMTP configured':'SMTP setup needed'}</h2><p>Delivery results are available in the Contact inbox.</p></div><div class="panel"><span class="eyebrow">SIGN-IN</span><h2>Supabase Auth</h2><p>Email and password accounts are created directly by an administrator.</p></div>${data.settings.map(s=>`<div class="panel"><span class="eyebrow">${esc(s.key)}</span><pre>${esc(JSON.stringify(s.value,null,2))}</pre></div>`).join('')}`;}
 async function daily(){const rows=await api('/api/admin/analytics/daily');const totals=new Map();rows.forEach(row=>totals.set(row.day,(totals.get(row.day)||0)+Number(row.views)));const max=Math.max(1,...totals.values());$('dailyChart').innerHTML=totals.size?[...totals].map(([day,count])=>`<div class="daily-bar"><span>${count}</span><div style="height:${Math.max(3,count/max*130)}px"></div><small>${esc(day.slice(5))}</small></div>`).join(''):'<p class="empty-state">No recorded activity in the last 30 days.</p>';}
 async function route(){try{if(location.hash==='#users')await users();if(location.hash==='#categories'||location.hash==='#posts')await categories();if(location.hash==='#audit')await audit();if(location.hash==='#settings')await system();if(location.hash==='#analytics')await daily();}catch(error){showNotice(error.message,true);}}
 window.addEventListener('hashchange',route);route();
})();
