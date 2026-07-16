
(function(){
 const form=document.querySelector('#inquiryForm');if(!form)return;
 const val=n=>form.elements[n]?.value?.trim()||'';
 function details(){
  return [
   'CUSTOM WAIST BAG INQUIRY',
   'Name: '+val('name'),'Company: '+val('company'),'Email: '+val('email'),'WhatsApp: '+val('whatsapp'),
   'Country: '+val('country'),'Product Type: '+val('productType'),'Estimated Quantity: '+val('quantity'),
   'Logo Method: '+val('logoMethod'),'Target Delivery Date: '+val('delivery'),'Message: '+val('message')
  ].join('\\n');
 }
 function valid(){if(!form.reportValidity())return false;return true}
 form.addEventListener('submit',e=>{e.preventDefault();if(!valid())return;location.href='mailto:'+SITE_CONFIG.email+'?subject='+encodeURIComponent('Custom Waist Bag Factory Inquiry')+'&body='+encodeURIComponent(details())});
 document.querySelector('[data-send-wa]')?.addEventListener('click',()=>{if(!valid())return;window.open('https://wa.me/'+SITE_CONFIG.whatsapp+'?text='+encodeURIComponent(details()),'_blank','noopener')});
 document.querySelector('[data-copy-inquiry]')?.addEventListener('click',async e=>{if(!valid())return;await navigator.clipboard.writeText(details());const old=e.target.textContent;e.target.textContent='Copied';setTimeout(()=>e.target.textContent=old,1600)});
})();
