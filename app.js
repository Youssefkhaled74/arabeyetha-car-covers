const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const money = n => `EGP ${Number(n).toLocaleString('en-EG')}`;
const photos = {strike:'assets/personalized-cover.webp',stars:'assets/star-cover.jpg',racing:'assets/graphic-collection-cover.webp',essential:'assets/essential-cover.webp',hero:'assets/hero-car-cover.webp'};
const products = [
  {id:'strike',name:'The Signature',collection:'signature',tag:'SIGNATURE SERIES',image:photos.strike,price:2850,description:'A personalized cover concept with your name and strong red detailing. Final artwork is confirmed before production.'},
  {id:'stars',name:'The Starline',collection:'art',tag:'THE ART SERIES',image:photos.stars,price:3250,description:'Graphic silver symbols and red accents create a distinctive all-over look. Shown here as a sample artwork concept.'},
  {id:'racing',name:'The Graphic Edit',collection:'art',tag:'THE ART SERIES',image:photos.racing,price:3650,description:'A striking orange and silver graphic cover concept, presented in a dramatic studio setting.'},
  {id:'midnight',name:'The Essential',collection:'essentials',tag:'THE ESSENTIALS',image:photos.essential,price:1900,description:'A minimal black cover concept with fine red accent lines. Final fabric and fit are confirmed on inquiry.'}
];
const vehicles = {BMW:['3 Series','5 Series','X1','X3','X5'], 'Mercedes-Benz':['C-Class','E-Class','GLA','GLC'],Toyota:['Corolla','Camry','RAV4','Fortuner'],Hyundai:['Elantra','Tucson','Accent','Creta'],Kia:['Cerato','Sportage','Seltos','Picanto'],Nissan:['Sunny','Sentra','Qashqai'],Chevrolet:['Optra','Captiva','Aveo'],Other:['My model is not listed']};
const tiers = [{id:'standard',name:'Standard',desc:'A clean starting point',price:1900},{id:'premium',name:'Premium',desc:'Elevated look and finish',price:2400},{id:'signature',name:'Signature',desc:'Full creative expression',price:3150}];
const colors = [{id:'black',name:'Black',hex:'#131316',tint:'transparent'},{id:'charcoal',name:'Charcoal',hex:'#505156',tint:'#676b77'},{id:'navy',name:'Navy',hex:'#1d304d',tint:'#304c80'},{id:'red',name:'Red',hex:'#be1925',tint:'#d51529'},{id:'silver',name:'Silver',hex:'#b1b2b6',tint:'#e2e3e5'}];
const defaults = {make:'',model:'',year:'2026',tier:'premium',color:'black',pattern:'strike',text:'',font:'bold',textColor:'white',placement:'hood',badge:false};
const safeRead = (key,fallback) => {try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback}};
let design = {...defaults,...safeRead('coverlab-design',{})};
let cart = safeRead('coverlab-cart',[]);
let activeFilter='all';
let currentProduct=null;
let detailImage=0;
let currentLanguage=localStorage.getItem('coverlab-language')||'ar';
let toastTimer;

function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3200)}
function save(){localStorage.setItem('coverlab-design',JSON.stringify(design))}
function cartSave(){localStorage.setItem('coverlab-cart',JSON.stringify(cart));renderCart()}
function imageForPattern(pattern){return pattern==='clean'?photos.essential:photos[pattern]||photos.strike}
function setupBrandGrid(){const makes=['BMW','Mercedes-Benz','Toyota','Hyundai','Kia','Nissan','Chevrolet','Other'];$('#brandGrid').innerHTML=makes.map((name,i)=>`<button type="button" class="brand-tile" data-brand="${name}"><strong>${['BMW','M-B','T','H','KIA','N','CHEV','+'][i]}</strong><span>${name}</span></button>`).join('');$$('[data-brand]').forEach(button=>button.addEventListener('click',()=>{const make=button.dataset.brand;$('#fitMake').value=make;populateModels($('#fitMake'),$('#fitModel'));$$('[data-brand]').forEach(tile=>tile.classList.toggle('active',tile===button));$('#fitModel').focus()}))}
function estimatedPrice(){return tiers.find(x=>x.id===design.tier).price+(design.text.trim()?250:0)+(design.badge?120:0)+(design.pattern==='racing'?300:design.pattern==='stars'?180:0)}
function populateMake(select, includePlaceholder=false){select.innerHTML=`${includePlaceholder?'<option value="">Select make</option>':''}${Object.keys(vehicles).map(v=>`<option value="${v}">${v}</option>`).join('')}`}
function populateModels(makeSelect,modelSelect,selected=''){const list=vehicles[makeSelect.value]||[];modelSelect.disabled=!list.length;modelSelect.innerHTML=`<option value="">Select model</option>${list.map(v=>`<option value="${v}">${v}</option>`).join('')}`;modelSelect.value=selected&&list.includes(selected)?selected:''}
function setupVehicles(){populateMake($('#makeSelect'),true);populateMake($('#fitMake'),true);$('#makeSelect').value=design.make;populateModels($('#makeSelect'),$('#modelSelect'),design.model);$('#yearSelect').innerHTML=Array.from({length:30},(_,i)=>2026-i).map(y=>`<option>${y}</option>`).join('');$('#yearSelect').value=design.year;$('#makeSelect').addEventListener('change',()=>{design.make=$('#makeSelect').value;design.model='';populateModels($('#makeSelect'),$('#modelSelect'));updateDesign()});$('#modelSelect').addEventListener('change',()=>{design.model=$('#modelSelect').value;updateDesign()});$('#yearSelect').addEventListener('change',()=>{design.year=$('#yearSelect').value;updateDesign()});$('#fitMake').addEventListener('change',()=>populateModels($('#fitMake'),$('#fitModel')));$('#findFit').addEventListener('click',()=>{if(!$('#fitMake').value||!$('#fitModel').value){toast('Select a make and model first.');return}design.make=$('#fitMake').value;design.model=$('#fitModel').value;$('#makeSelect').value=design.make;populateModels($('#makeSelect'),$('#modelSelect'),design.model);updateDesign();$('#lab').scrollIntoView({behavior:'smooth'});toast('Vehicle added to your Cover Lab design.')})}
const productArabic={strike:'غطاء التوقيع',stars:'غطاء ستارلاين',racing:'التصميم الجرافيكي',midnight:'الغطاء الأساسي'};
const tagArabic={essentials:'الأساسيات',signature:'سلسلة التوقيع',art:'سلسلة الفن'};
function renderProducts(){let list=activeFilter==='all'?products:products.filter(p=>p.collection===activeFilter);const ar=currentLanguage==='ar';$('#productCount').textContent=ar?`${String(list.length).padStart(2,'0')} تصاميم`:`${String(list.length).padStart(2,'0')} DESIGNS`;$('#productGrid').innerHTML=list.map(p=>`<article class="product-card"><div class="product-image"><img src="${p.image}" alt="${p.name} cover concept" loading="lazy"><span class="product-tag">${ar?tagArabic[p.collection]:p.tag}</span><button class="quick-btn" data-quick="${p.id}" aria-label="Quick view ${p.name}">${ar?'عرض سريع':'QUICK VIEW'} ↗</button></div><div class="product-meta"><div><span>${ar?tagArabic[p.collection]:p.tag}</span><h3>${ar?productArabic[p.id]:p.name}</h3><p>${ar?'تصميم توضيحي · المقاس بيتأكد عند الاستفسار':'Sample design · fit confirmed on inquiry'}</p></div><strong>${ar?'من':'FROM'} ${money(p.price)}</strong></div></article>`).join('');$$('[data-quick]').forEach(b=>b.addEventListener('click',()=>openProduct(b.dataset.quick)))}
function setFilter(filter){activeFilter=filter;$$('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));renderProducts()}
function openProduct(id){currentProduct=products.find(p=>p.id===id);detailImage=0;renderProductDetail();$('#productDialog').showModal()}
function renderProductDetail(){let p=currentProduct;if(!p)return;let images=[p.image];$('#productDetail').innerHTML=`<div class="detail-layout"><div class="detail-image"><img id="detailMainImage" src="${images[detailImage]}" alt="${p.name} product image"></div><div class="detail-copy"><span class="eyebrow">${p.tag}</span><h2>${p.name}</h2><div class="price">FROM ${money(p.price)}*</div><p>${p.description}</p><div class="detail-choices">${images.map((_,i)=>`<button data-detail-image="${i}" class="${i===detailImage?'active':''}">VIEW ${i+1}</button>`).join('')}</div><ul><li>Made for the selected vehicle after fit confirmation.</li><li>Color and personal details can be discussed before production.</li><li>Fabric, care, shipping, and return terms are confirmed on inquiry.</li></ul><p><small>* Indicative sample price. The image is a concept photo; exact material and availability are unverified.</small></p><button class="btn btn-red" id="detailAdd">ADD TO BAG ↗</button><button class="text-link" id="detailCustomize" style="margin-top:20px">CUSTOMIZE A COVER ↗</button></div></div>`;$('#detailMainImage').addEventListener('click',e=>e.currentTarget.classList.toggle('zoomed'));$$('[data-detail-image]').forEach(b=>b.addEventListener('click',()=>{detailImage=Number(b.dataset.detailImage);renderProductDetail()}));$('#detailAdd').addEventListener('click',()=>{addToCart({key:p.id,name:p.name,image:p.image,price:p.price,description:'Sample design · fit confirmed before production'});$('#productDialog').close();openCart()});$('#detailCustomize').addEventListener('click',()=>{$('#productDialog').close();$('#lab').scrollIntoView({behavior:'smooth'})})}
function renderTiers(){$('#tierList').innerHTML=tiers.map(t=>`<button class="tier-option ${design.tier===t.id?'active':''}" data-tier="${t.id}"><span><strong>${t.name}</strong><small>${t.desc}</small></span><b>FROM ${money(t.price)}</b></button>`).join('');$$('[data-tier]').forEach(b=>b.addEventListener('click',()=>{design.tier=b.dataset.tier;updateDesign()}))}
function renderSwatches(){$('#colorSwatches').innerHTML=colors.map(c=>`<button class="swatch ${design.color===c.id?'active':''}" data-color="${c.id}" style="background:${c.hex}" aria-label="${c.name} cover color" title="${c.name}"></button>`).join('');$$('[data-color]').forEach(b=>b.addEventListener('click',()=>{design.color=b.dataset.color;updateDesign()}))}
function updateDesign(){save();renderTiers();renderSwatches();$('#patternSelect').value=design.pattern;$('#personalText').value=design.text;$('#fontSelect').value=design.font;$('#textColorSelect').value=design.textColor;$('#placementSelect').value=design.placement;$('#badgeCheck').checked=design.badge;$('#previewImage').src=imageForPattern(design.pattern);$('#coverTint').style.background=colors.find(c=>c.id===design.color).tint;const personal=$('#previewPersonal');personal.textContent=design.text.trim().toUpperCase();personal.className=`preview-personal ${design.placement==='door'?'door':''} ${design.font==='italic'?'italic':design.font==='mono'?'mono':''}`;personal.style.color={white:'#fff',red:'#f01929',silver:'#ced1d6'}[design.textColor];$('#previewBadge').textContent=design.badge?'◆ YOUR MARK':'YOUR DESIGN';$('#vehicleNote').textContent=design.make&&design.model?`${design.year} ${design.make} ${design.model} · fit to be confirmed`:'Choose your vehicle to begin.';$('#labPrice').textContent=money(estimatedPrice());$('#labSummaryText').textContent=`${tiers.find(t=>t.id===design.tier).name} cover · ${colors.find(c=>c.id===design.color).name} · ${design.pattern} graphic${design.text.trim()?` · “${design.text.trim()}”`:''}${design.make&&design.model?` · ${design.make} ${design.model}`:''}`}
function setupLab(){setupVehicles();['pattern','font','textColor','placement'].forEach(name=>{const id={pattern:'patternSelect',font:'fontSelect',textColor:'textColorSelect',placement:'placementSelect'}[name];$('#'+id).addEventListener('change',e=>{design[name]=e.target.value;updateDesign()})});$('#personalText').addEventListener('input',e=>{design.text=e.target.value;updateDesign()});$('#badgeCheck').addEventListener('change',e=>{design.badge=e.target.checked;updateDesign()});$$('[data-angle]').forEach(b=>b.addEventListener('click',()=>{$$('[data-angle]').forEach(x=>x.classList.toggle('active',x===b));$('#previewStage').className=`preview-stage ${b.dataset.angle==='front'?'':b.dataset.angle}`;$('#previewAngleLabel').textContent={front:'01 / FRONT THREE-QUARTER',side:'02 / SIDE FOCUS',detail:'03 / GRAPHIC DETAIL'}[b.dataset.angle]}));$('#saveDesign').addEventListener('click',()=>{save();toast('Design saved on this device.')});$('#addDesign').addEventListener('click',()=>{if(!design.make||!design.model){toast('Choose your car make and model first.');$('#makeSelect').focus();return}const snapshot={...design};addToCart({key:'custom-'+Date.now(),name:'Your Cover Lab design',image:imageForPattern(design.pattern),price:estimatedPrice(),description:`${design.year} ${design.make} ${design.model} · ${design.color} · ${design.pattern}${design.text?' · '+design.text:''}`,snapshot});openCart()});updateDesign()}
function addToCart(item){let match=cart.find(c=>c.key===item.key);if(match)match.qty++;else cart.push({...item,qty:1});cartSave();toast('Added to your bag.')}
function openCart(){$('#drawerBackdrop').hidden=false;$('#cartDrawer').classList.add('open');$('#cartDrawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#closeCart').focus()}
function closeCart(){$('#cartDrawer').classList.remove('open');$('#cartDrawer').setAttribute('aria-hidden','true');$('#drawerBackdrop').hidden=true;document.body.style.overflow=''}
function renderCart(){let count=cart.reduce((a,c)=>a+c.qty,0);$('#cartCount').textContent=count;$('#cartSubtotal').textContent=money(cart.reduce((a,c)=>a+c.price*c.qty,0));$('#cartItems').innerHTML=cart.length?cart.map((c,i)=>`<div class="cart-row"><img src="${c.image}" alt="${c.name}"><div><h3>${c.name}</h3><p>${c.description}</p><strong>${money(c.price)}</strong><div class="qty-controls"><button data-qty="${i},-1" aria-label="Decrease quantity">−</button><span>${c.qty}</span><button data-qty="${i},1" aria-label="Increase quantity">+</button><button class="remove" data-remove="${i}">Remove</button></div></div></div>`).join(''):'<div class="empty-cart"><b>Your bag is waiting.</b>Discover a design or make one yourself.</div>';$$('[data-qty]').forEach(b=>b.addEventListener('click',()=>{let [i,delta]=b.dataset.qty.split(',').map(Number);cart[i].qty+=delta;if(cart[i].qty<=0)cart.splice(i,1);cartSave()}));$$('[data-remove]').forEach(b=>b.addEventListener('click',()=>{cart.splice(Number(b.dataset.remove),1);cartSave()}));$('#checkoutBtn').disabled=!cart.length}
function setupCart(){$$('.cart-trigger').forEach(b=>b.addEventListener('click',openCart));$('#closeCart').addEventListener('click',closeCart);$('#drawerBackdrop').addEventListener('click',closeCart);$('#checkoutBtn').addEventListener('click',()=>{if(!cart.length)return;closeCart();$('#checkoutDialog').showModal()});renderCart()}
function setupCheckout(){$('#checkoutForm').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.currentTarget);let lines=[`Cover inquiry — عربيتها واحنا نغطيها`,`Name: ${data.get('name')}`,`Phone: ${data.get('phone')}`,`City: ${data.get('city')}`,'',...cart.map(c=>`${c.qty} × ${c.name} — ${money(c.price*c.qty)} (${c.description})`),'',`Indicative subtotal: ${money(cart.reduce((a,c)=>a+c.price*c.qty,0))}`,`Notes: ${data.get('notes')||'None'}`,'Final price, fit, and terms to be confirmed.'];const message=lines.join('\n');let result=$('#inquiryResult');result.hidden=false;result.innerHTML='<div class="inquiry-box"><strong>Inquiry ready to share</strong><p>Copy this summary and send it through your preferred contact channel. No order has been placed.</p><textarea readonly></textarea><div class="inquiry-actions"><button type="button" class="btn btn-dark" id="copyInquiry">COPY SUMMARY</button></div></div>';result.querySelector('textarea').value=message;$('#copyInquiry').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(message);toast('Inquiry copied to clipboard.')}catch{result.querySelector('textarea').select();toast('Select and copy the inquiry text.')}});result.scrollIntoView({behavior:'smooth'})})}
function setupMisc(){$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>setFilter(b.dataset.filter)));$$('[data-collection]').forEach(a=>a.addEventListener('click',()=>setFilter(a.dataset.collection)));$('#menuBtn').addEventListener('click',()=>{let open=$('#mobileNav').classList.toggle('open');$('#menuBtn').setAttribute('aria-expanded',String(open))});$$('.mobile-nav a').forEach(a=>a.addEventListener('click',()=>{$('#mobileNav').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false')}));$$('.dialog-close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCart()});$$('[data-protection]').forEach(b=>b.addEventListener('click',()=>{$$('[data-protection]').forEach(x=>x.classList.toggle('active',x===b));$('#protectionText').textContent={fit:'Select your make and model; the final dimensions and fit are confirmed before production.',care:'Ask for the fabric and care guide that applies to your selected cover before ordering.',design:'Explore graphic styles and personal details in the Cover Lab, then confirm the final artwork.'}[b.dataset.protection]}));$('#compareRange').addEventListener('input',e=>{let v=e.target.value;$('#compareOverlay').style.width=v+'%';$('#compareDivider').style.left=v+'%'});$('#newsletterForm').addEventListener('submit',e=>{e.preventDefault();let email=$('#emailInput').value.trim();if(!email)return;localStorage.setItem('coverlab-demo-email',email);$('#newsletterMessage').textContent='Saved on this device for the demo. No email was sent.';e.currentTarget.reset();toast('Demo signup saved locally.')});$('#whatsappBtn').addEventListener('click',()=>toast('Add the brand WhatsApp number to enable direct inquiries.'));$('#emailLink').addEventListener('click',e=>{e.preventDefault();toast('Add the brand email address to enable direct inquiries.')});$('#langBtn').addEventListener('click',toggleLanguage)}
const translations={
  'Shop covers':'تسوق الأغطية','Collections':'المجموعات','The Cover Lab':'معمل الغطاء','Our story':'حكايتنا','FAQ':'الأسئلة الشائعة','Contact':'تواصل معنا',
  'YOUR CAR.':'عربيتك.','YOUR COVER.':'غطاها.','YOUR SIGNATURE.':'بصمتك.','SHOP COVERS':'تسوق الأغطية','DESIGN YOUR OWN':'صمم غطاءك',
  'A cover should never feel ordinary.':'الغطاء مش لازم يكون عادي.','Start with your car.':'ابدأ بعربيتك.','Shop by car brand.':'تسوق حسب ماركة عربيتك.','Icons in the making.':'تصاميم تلفت النظر.','Your canvas. Your rules.':'مساحتك. اختيارك.',
  'Questions, answered.':'عندك سؤال؟','THE NEXT DROP IS COMING.':'الجديد جاي قريب.'};
function toggleLanguage(){currentLanguage=currentLanguage==='en'?'ar':'en';localStorage.setItem('coverlab-language',currentLanguage);applyLanguage()}
function applyLanguage(){document.documentElement.lang=currentLanguage;document.documentElement.dir=currentLanguage==='ar'?'rtl':'ltr';$('#langBtn').textContent=currentLanguage==='ar'?'ENGLISH':'العربية';if(!window.originalTexts){window.originalTexts=new Map();$$('.desktop-nav a,.mobile-nav a,.hero h1,.hero-actions a,.intro h2,.fit-strip h2,.shop h2,.lab h2,.faq h2,.newsletter h2').forEach(el=>window.originalTexts.set(el,el.innerHTML))}for(const [el,html] of window.originalTexts){if(currentLanguage==='en'){el.innerHTML=html;continue}let text=el.textContent.trim().replace(/\s+/g,' ');if(el.matches('.hero h1'))el.innerHTML='عربيتك. غطاها. <em>بصمتك.</em>';else if(el.matches('.intro h2'))el.innerHTML='الغطاء مش لازم<br>يكون <i>عادي.</i>';else if(el.matches('.lab h2'))el.innerHTML='مساحتك.<br><i>اختيارك.</i>';else if(el.matches('.faq h2'))el.innerHTML='عندك<br><i>سؤال؟</i>';else if(el.matches('.newsletter h2'))el.innerHTML='الجديد<br>جاي قريب.';else if(el.matches('.hero-actions a'))el.innerHTML=(el.getAttribute('href')==='#shop'?'تسوق الأغطية':'صمم غطاءك')+' <span>↗</span>';else if(translations[text])el.textContent=translations[text]}}
const arabicCopy={
  '.hero .eyebrow':'غطاء يحكي حكايتك',
  '.hero-bottom span:first-child':'01 / غطاء بشكل جديد',
  '.hero-bottom span:last-child':'اكتشف المزيد ↓',
  '.intro-kicker':'/ 01 الفكرة',
  '.hero-content p':'حماية لها شخصيتها. اكتشف أغطية مميزة وصمم غطاء يعبر عنك.',
  '.intro p':'طريقة مختلفة للاهتمام بعربيتك. اختار تصميم جاهز أو اصنع قطعة تحمل اسمك وألوانك وشخصيتك.',
  '.intro .text-link':'اكتشف معمل الغطاء ↗',
  '.fit-strip .eyebrow':'اختار عربيتك / 01',
  '.fit-strip p':'اختار ماركة عربيتك والموديل. المقاس النهائي بيتأكد قبل التنفيذ.',
  '.fit-intro .text-link':'شوف كل الماركات ↗',
  '#findFit':'شوف الأغطية ↗',
  '.shop .eyebrow':'التصاميم / 02',
  '.section-heading p':'اكتشف أول تصاميمنا. الصور والأسعار المعروضة أمثلة توضيحية؛ الخامة والمقاس والسعر النهائي والتوفر بيتأكدوا عند الاستفسار.',
  '.filter-tabs button:nth-child(1)':'كل التصاميم',
  '.filter-tabs button:nth-child(2)':'الأساسيات',
  '.filter-tabs button:nth-child(3)':'التوقيع',
  '.filter-tabs button:nth-child(4)':'سلسلة الفن',
  '.shop-footnote':'* التصاميم والأسعار بالجنيه المصري للتوضيح في هذه النسخة التجريبية.',
  '.collection-heading .eyebrow':'ثلاث طرق للتعبير عن شخصيتك / 03',
  '.collection-heading h2':'مجموعاتنا الإبداعية.',
  '.collection-heading p':'ثلاث طرق مختلفة تخلي عربيتك ليها حضورها الخاص.',
  '.collection-list a:nth-child(1) span':'01 / الأساسيات',
  '.collection-list a:nth-child(2) span':'02 / سلسلة التوقيع',
  '.collection-list a:nth-child(3) span':'03 / سلسلة الفن',
  '.collection-list a:nth-child(1) strong':'الأساسيات',
  '.collection-list a:nth-child(2) strong':'سلسلة التوقيع',
  '.collection-list a:nth-child(3) strong':'سلسلة الفن',
  '.collection-list a:nth-child(1) small':'بساطة وهدوء، وخطوط مدروسة.',
  '.collection-list a:nth-child(2) small':'اسمك أو حروفك الأولى على الغطاء.',
  '.collection-list a:nth-child(3) small':'رسومات جريئة لعربية تلفت النظر.',
  '.collection-list a:nth-child(1) b':'اكتشف ↗',
  '.collection-list a:nth-child(2) b':'اكتشف ↗',
  '.collection-list a:nth-child(3) b':'اكتشف ↗',
  '.lab .eyebrow':'معمل الغطاء / 04',
  '.lab-head p':'جرّب تصميمك مباشرة. اختياراتك محفوظة على الجهاز علشان ترجع لها وقت ما تحب.',
  '.preview-top span:first-child':'معاينة التصميم',
  '.preview-bottom>span':'تصور توضيحي · المنتج النهائي قد يختلف',
  '.lab-step:nth-child(1) .step-title h3':'اختار عربيتك',
  '.lab-step:nth-child(2) .step-title h3':'اختار نوع الغطاء',
  '.lab-step:nth-child(3) .step-title h3':'خليه على ذوقك',
  '#addDesign':'أضف التصميم للسلة ↗',
  '#saveDesign':'احفظ التصميم',
  '.protection h2':'حماية<br>بشخصية.',
  '.protection-copy>p:first-of-type':'الفكرة بسيطة: غطاء مدروس وشكل تحب تشوفه كل يوم. اختار المستوى المناسب لك.',
  '.protection .eyebrow':'التفاصيل بتفرق / 05',
  '.protection-detail':'اختار ماركة وموديل عربيتك؛ بنأكد المقاسات والتفاصيل قبل التنفيذ.',
  '.visual-caption':'تفاصيل تليق بعربيتك <span>↗</span>',
  '.compare h2':'شوف الفرق.',
  '.compare .section-heading p':'اسحب للمقارنة بين تصميمين من معرض النماذج.',
  '.quote-band h2':'التفاصيل اللي تختارها.',
  '.quote-band .btn':'صمم غطاءك ↗',
  '.review-note h2':'حكايتك هنا.',
  '.review-note p':'آراء العملاء الحقيقية هتظهر هنا لما تكون متاحة. لحد وقتها، اكتشف التصاميم واختار الغطاء اللي يعبر عنك.',
  '.review-note .text-link':'صمم غطاءك ↗',
  '.faq .eyebrow':'معلومات مهمة / 07',
  '.faq details:nth-child(1) summary':'إزاي أعرف الغطاء المناسب لعربيتي؟ <span>+</span>',
  '.faq details:nth-child(1) p':'اختار الماركة والموديل وسنة الصنع في معمل الغطاء. بنأكد المقاسات النهائية قبل التنفيذ.',
  '.faq details:nth-child(2) summary':'ينفع أطلب تصميم باسمي؟ <span>+</span>',
  '.faq details:nth-child(2) p':'أكيد. جرّب الألوان والرسومات والاسم ومكانه في معمل الغطاء. المعاينة توضيحية والتصميم النهائي بيتأكد قبل التنفيذ.',
  '.faq details:nth-child(3) summary':'إيه الخامات ومستويات الحماية المتاحة؟ <span>+</span>',
  '.faq details:nth-child(3) p':'المستويات المعروضة أمثلة في النسخة التجريبية. اسأل عن الخامة المناسبة، وتحمل الطقس، وتعليمات العناية قبل الطلب.',
  '.faq details:nth-child(4) summary':'إيه نظام التوصيل والدفع والاسترجاع؟ <span>+</span>',
  '.faq details:nth-child(4) p':'السياسات لسه بتتحدد. تواصل مع المتجر لمعرفة مناطق التوصيل وطرق الدفع والمدة وشروط الاسترجاع.',
  '.newsletter form>label':'خليك أول واحد يعرف عن التصاميم الجديدة.',
  '.newsletter .eyebrow':'خليك متابع',
  '.footer-main>div:nth-child(2) span':'اكتشف',
  '.footer-main>div:nth-child(3) span':'المساعدة',
  '.footer-main>div:nth-child(4) span':'تابعنا',
  '.footer-brand p':'غطّي اللي بيحركك.'
};
function applyArabicCopy(){if(!window.copyOriginals){window.copyOriginals=new Map();for(const [selector] of Object.entries(arabicCopy)){let el=$(selector);if(el)window.copyOriginals.set(selector,el.innerHTML)}}for(const [selector,arabic] of Object.entries(arabicCopy)){let el=$(selector);if(el)el.innerHTML=currentLanguage==='ar'?arabic:window.copyOriginals.get(selector)}}
function localizeLiveUi(){const ar=currentLanguage==='ar';const tierNames={standard:'عادي',premium:'بريميوم',signature:'توقيع'};const tierDescriptions={standard:'بداية بسيطة',premium:'شكل وتشطيب مميز',signature:'تصميم على ذوقك'};$$('.tier-option').forEach(button=>{const tier=tiers.find(t=>t.id===button.dataset.tier);button.querySelector('strong').textContent=ar?tierNames[tier.id]:tier.name;button.querySelector('small').textContent=ar?tierDescriptions[tier.id]:tier.desc});$('#vehicleNote').textContent=ar?(design.make&&design.model?`${design.year} ${design.make} ${design.model} · بنأكد المقاس قبل التنفيذ`:'اختار عربيتك علشان تبدأ.'):(design.make&&design.model?`${design.year} ${design.make} ${design.model} · fit to be confirmed`:'Choose your vehicle to begin.');$('#previewBadge').textContent=ar?(design.badge?'◆ علامتك':'تصميمك'):(design.badge?'◆ YOUR MARK':'YOUR DESIGN');if(ar){const color={black:'أسود',charcoal:'رمادي داكن',navy:'كحلي',red:'أحمر',silver:'فضي'}[design.color];$('#labSummaryText').textContent=`غطاء ${tierNames[design.tier]} · ${color} · ${design.pattern}${design.text.trim()?` · “${design.text.trim()}”`:''}${design.make&&design.model?` · ${design.make} ${design.model}`:''}`}const options={'#patternSelect':['بدون رسومات','خطوط حمراء','نجوم فضية','سباق'],'#fontSelect':['عريض','مائل','تقني'],'#textColorSelect':['أبيض','أحمر','فضي'],'#placementSelect':['غطاء المقدمة','جانب العربية']};for(const [selector,arabic] of Object.entries(options)){$$(selector+' option').forEach((option,i)=>{if(!option.dataset.en)option.dataset.en=option.textContent;option.textContent=ar?arabic[i]:option.dataset.en})}}
const baseUpdateDesign=updateDesign;
updateDesign=function(){baseUpdateDesign();localizeLiveUi()};
const baseApplyLanguage=applyLanguage;
applyLanguage=function(){baseApplyLanguage();applyArabicCopy();renderProducts();localizeLiveUi()};
renderProducts();setupLab();setupBrandGrid();setupCart();setupCheckout();setupMisc();applyLanguage();


