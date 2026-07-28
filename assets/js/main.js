
(function(){
 const toggle=document.querySelector('.mobile-toggle'), nav=document.querySelector('.nav-links');
 if(toggle&&nav)toggle.addEventListener('click',()=>{nav.classList.toggle('open');document.body.classList.toggle('mobile-nav-open',nav.classList.contains('open'));});
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
 const chat=document.querySelector('.wa-float');
 if(chat){
   chat.setAttribute('aria-label','Contact us on WhatsApp');
   chat.setAttribute('data-tooltip','Chat on WhatsApp');
   chat.textContent='';
   chat.insertAdjacentHTML('afterbegin','<span class="wa-ripple wa-ripple-one" aria-hidden="true"></span><span class="wa-ripple wa-ripple-two" aria-hidden="true"></span><span class="wa-ripple wa-ripple-three" aria-hidden="true"></span><svg class="wa-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16 3.2a12.5 12.5 0 0 0-10.7 19l-1.4 5.1 5.2-1.4A12.5 12.5 0 1 0 16 3.2Zm0 22.8c-2.1 0-4.1-.6-5.8-1.7l-.4-.2-3.1.8.8-3-.2-.4A10.3 10.3 0 1 1 16 26Zm5.6-7.7c-.3-.1-1.8-.9-2.1-1-.3-.1-.5-.1-.7.1s-.8 1-.9 1.2c-.2.2-.3.2-.6.1-1.8-.9-3-1.7-4.1-3.8-.3-.5.3-.5.9-1.7.1-.2.1-.4 0-.6l-1-2.2c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.4 1.3 3.6c.2.2 2.4 3.7 5.8 5.2.8.4 1.5.6 2 .8.9.3 1.7.2 2.4.1.7-.1 1.8-.7 2.1-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3Z"/></svg>');
   const style=document.createElement('style');
   style.textContent='.wa-float{width:58px!important;height:58px!important;padding:0!important;border:3px solid #fff!important;border-radius:50%!important;display:grid!important;place-items:center;isolation:isolate;overflow:visible!important;font-size:0!important;animation:none!important}.wa-float:before{display:none!important}.wa-icon{position:relative;z-index:1;width:34px;height:34px}.wa-ripple{position:absolute;inset:-5px;z-index:-1;border:5px solid #25d366;border-radius:50%;pointer-events:none;opacity:0;animation:wa-ripple 3s cubic-bezier(.18,.55,.3,1) infinite}.wa-ripple-two{animation-delay:1s}.wa-ripple-three{animation-delay:2s}@keyframes wa-ripple{0%{transform:scale(1);opacity:1}100%{transform:scale(3.2);opacity:0}}.wa-float:after{content:attr(data-tooltip);position:absolute;right:calc(100% + 12px);top:50%;transform:translateY(-50%);white-space:nowrap;background:#202020;color:#fff;padding:7px 10px;border-radius:4px;font-size:.8rem;font-weight:800;opacity:0;pointer-events:none;transition:opacity .2s}.wa-float:hover:after,.wa-float:focus-visible:after{opacity:1}@media (prefers-reduced-motion:reduce){.wa-ripple{display:none}}@media(max-width:700px){.wa-float{width:54px!important;height:54px!important}.wa-float:after{display:none}body.mobile-nav-open .wa-float{visibility:hidden;pointer-events:none}}';
   document.head.appendChild(style);
 }
})();
