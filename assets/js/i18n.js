
(async function(){
 const allowed=['en','es','fr'];
 let lang=localStorage.getItem('cwLang')||'en'; if(!allowed.includes(lang))lang='en';
 async function apply(next){
   lang=next;localStorage.setItem('cwLang',lang);document.documentElement.lang=lang;
   const prefix=document.body.dataset.prefix||'';
   try{
     const r=await fetch(prefix+'assets/lang/'+lang+'.json');const t=await r.json();
     document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(t[k])el.textContent=t[k]});
     document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));
   }catch(e){console.warn('Translation fallback:',e.message)}
 }
 document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>apply(b.dataset.lang)));
 await apply(lang);
})();
