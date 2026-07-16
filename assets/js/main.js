
(function(){
 const toggle=document.querySelector('.mobile-toggle'), nav=document.querySelector('.nav-links');
 if(toggle&&nav)toggle.addEventListener('click',()=>nav.classList.toggle('open'));
 document.querySelectorAll('.faq-q').forEach(b=>b.addEventListener('click',()=>b.closest('.faq-item').classList.toggle('open')));
 const cookie=document.querySelector('.cookie');
 if(cookie&&!localStorage.getItem('cwCookie'))setTimeout(()=>cookie.classList.add('show'),600);
 document.querySelectorAll('[data-cookie-ok]').forEach(b=>b.addEventListener('click',()=>{localStorage.setItem('cwCookie','1');cookie?.classList.remove('show')}));
 let clicks=[];
 document.querySelectorAll('[data-admin-entry]').forEach(el=>el.addEventListener('click',()=>{
   const now=Date.now();clicks=clicks.filter(t=>now-t<3000);clicks.push(now);
   if(clicks.length>=5){document.querySelector('#adminOverlay')?.classList.add('open');clicks=[];}
 }));
 document.querySelectorAll('[data-close-admin]').forEach(b=>b.addEventListener('click',()=>document.querySelector('#adminOverlay')?.classList.remove('open')));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelector('#adminOverlay')?.classList.remove('open')});
 const y=document.querySelector('[data-year]');if(y)y.textContent=new Date().getFullYear();
})();
