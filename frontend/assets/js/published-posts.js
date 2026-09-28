(async()=>{
 const article=document.getElementById('publishedArticle');
 try{
 const slug=new URLSearchParams(location.search).get('slug');
 const response=await AnvilAPI.fetch(article?`/api/public/posts/${encodeURIComponent(slug||'')}`:'/api/public/posts');
 if(!response.ok)throw Error('This article is unavailable. Please return to the guides page.');
 const data=await response.json();
 if(article){document.title=`${data.title} | Anvil Tools`;article.replaceChildren();const title=document.createElement('h1');title.textContent=data.title;article.append(title);const excerpt=document.createElement('p');excerpt.className='lede';excerpt.textContent=data.excerpt;article.append(excerpt);for(const paragraph of (data.body||'').split(/\n\s*\n/)){const p=document.createElement('p');p.style.whiteSpace='pre-wrap';p.textContent=paragraph;article.append(p);}}
 else{const items=data.filter(p=>p.published_at);if(!items.length)return;document.getElementById('publishedGuides').hidden=false;const cards=document.getElementById('publishedGuideCards');for(const post of items){const card=document.createElement('div');card.className='tool-card';const h=document.createElement('h3');h.textContent=post.title;const p=document.createElement('p');p.textContent=post.excerpt;const a=document.createElement('a');a.href=`article.html?slug=${encodeURIComponent(post.slug)}`;a.textContent='Read guide →';a.className='tool-link';card.append(h,p,a);cards.append(card);}}
 }catch(error){if(article){article.querySelector('h1').textContent='Article unavailable';document.getElementById('articleStatus').textContent=error.message;}}
})();
