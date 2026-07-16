
(function(){
 const fileInput=document.querySelector('#importProducts'),text=document.querySelector('#jsonEditor'),status=document.querySelector('#adminStatus');
 if(!text)return;
 const starter='[]';
 text.value=localStorage.getItem('cwProductsDraft')||starter;
 function setStatus(s){if(status)status.textContent=s}
 document.querySelector('[data-save-draft]')?.addEventListener('click',()=>{try{JSON.parse(text.value);localStorage.setItem('cwProductsDraft',text.value);setStatus('Preview draft saved in this browser only.')}catch(e){setStatus('Invalid JSON: '+e.message)}});
 document.querySelector('[data-format-json]')?.addEventListener('click',()=>{try{text.value=JSON.stringify(JSON.parse(text.value),null,2);setStatus('JSON formatted.')}catch(e){setStatus('Invalid JSON: '+e.message)}});
 document.querySelector('[data-export-json]')?.addEventListener('click',()=>{try{const data=JSON.stringify(JSON.parse(text.value),null,2);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download='products.json';a.click();URL.revokeObjectURL(a.href);setStatus('products.json exported. Replace assets/data/products.json and redeploy to publish.')}catch(e){setStatus('Invalid JSON: '+e.message)}});
 fileInput?.addEventListener('change',async()=>{const f=fileInput.files[0];if(!f)return;text.value=await f.text();document.querySelector('[data-format-json]')?.click();setStatus('Imported for preview. Not published online.')});
 document.querySelectorAll('[data-admin-tab]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-admin-tab]').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('[data-admin-panel]').forEach(p=>p.classList.add('hidden'));document.querySelector('#'+b.dataset.adminTab)?.classList.remove('hidden')}));
})();
