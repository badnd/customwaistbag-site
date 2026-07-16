
(async function(){
 const grid=document.querySelector('#productGrid'),empty=document.querySelector('#emptyState'),filters=document.querySelector('#categoryFilters');
 if(!grid&&!filters)return;
 const prefix=document.body.dataset.prefix||'';
 let products=[],categories=[];
 try{
   const [pr,cr]=await Promise.all([fetch(prefix+'assets/data/products.json'),fetch(prefix+'assets/data/categories.json')]);
   products=await pr.json();categories=await cr.json();
 }catch(e){console.warn('Product data could not be loaded. Use a local web server.',e.message)}
 const published=products.filter(p=>p.status==='published');
 if(filters){
   filters.innerHTML='<button class="filter-pill active" data-filter="all">All</button>'+categories.map(c=>`<button class="filter-pill" data-filter="${c.id}">${c.name}</button>`).join('');
   filters.addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;filters.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');render(b.dataset.filter)});
 }
 function render(filter='all'){
   const list=published.filter(p=>filter==='all'||p.category===filter);
   if(grid)grid.innerHTML=list.map(p=>`<article class="card product-card"><a href="${prefix}products/${p.slug}.html"><img src="${prefix}${p.mainImage}" alt="${p.title?.en||p.title||p.model}" loading="lazy"><div class="card-pad"><span class="badge">${p.model||'Custom'}</span><h3>${p.title?.en||p.title}</h3><p>${p.shortDescription?.en||p.shortDescription||''}</p></div></a></article>`).join('');
   if(empty)empty.classList.toggle('hidden',list.length>0);
 }
 render();
})();
