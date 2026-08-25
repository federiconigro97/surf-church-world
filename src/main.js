import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { feature } from 'topojson-client';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const COLORS = {
  sky: '#6AC6E8', yellow: '#FFD764', orange: '#FF884D', cream: '#F7F7F7', ink: '#232323',
  blue: '#397FCE', teal: '#54C7C4', green: '#6FBF73', purple: '#8D79C9', sand: '#F0D28B'
};

const demoFriends = [
  { id:'1', first_name:'Marco', last_name:'Bianchi', city:'Porto', country:'Portugal', lat:41.1579, lon:-8.6291, quote:'Faith. Waves. People.', instagram:'@marcobianchi', color:COLORS.yellow },
  { id:'2', first_name:'Sofia', last_name:'Martin', city:'Bali', country:'Indonesia', lat:-8.4095, lon:115.1889, quote:'Find your people.', instagram:'@sofiawaves', color:COLORS.teal },
  { id:'3', first_name:'Luca', last_name:'Rossi', city:'Lisbon', country:'Portugal', lat:38.7223, lon:-9.1393, quote:'Saltwater fixes everything.', instagram:'@lucarossi', color:COLORS.orange },
  { id:'4', first_name:'Tommaso', last_name:'Verdi', city:'Ericeira', country:'Portugal', lat:38.9637, lon:-9.4173, quote:'Stay curious.', instagram:'@tomverdi', color:COLORS.blue },
  { id:'5', first_name:'Emily', last_name:'Johnson', city:'Taghazout', country:'Morocco', lat:30.5428, lon:-9.7112, quote:'Good waves, good people.', instagram:'@emilywaves', color:COLORS.teal },
  { id:'6', first_name:'Jack', last_name:'Wilson', city:'Byron Bay', country:'Australia', lat:-28.6474, lon:153.602, quote:"Let's go.", instagram:'@jackwilson', color:COLORS.yellow },
  { id:'7', first_name:'Chloe', last_name:'Dubois', city:'Hossegor', country:'France', lat:43.662, lon:-1.428, quote:'Adventure is better together.', instagram:'@chloedubois', color:COLORS.orange }
];

const root = document.querySelector('#root');
root.innerHTML = `
<div id="app">
  <div id="map"></div>
  <header class="topbar">
    <div class="brand"><div>SURF</div><div>CHURCH</div><b>WORLD</b></div>
    <div class="find"><strong>FIND YOUR PEOPLE</strong><div class="searchbox"><span>⌕</span><input id="search" placeholder="Search by name..."/></div></div>
    <button class="join" id="add">📍 <span>ADD YOUR PIN</span></button>
    <div class="join-note">Join the map! <span>↘</span></div>
  </header>

  <aside class="friends paper">
    <div class="friends-title">FRIENDS ON THE MAP</div>
    <div id="friendList"></div>
  </aside>

  <div class="game-stickers" aria-hidden="true">
    <div class="sticker good">GOOD<br>VIBES</div>
    <div class="sticker smile">☺</div>
    <div class="sticker shaka">🤙</div>
    <div class="sticker faith">FAITH.<br>WAVES.<br>PEOPLE.</div>
    <div class="sticker jesus">✚ JESUS<br>OVER<br>EVERYTHING</div>
  </div>

  <div class="map-label porto-label">SURF CHURCH PORTO <small>MATOSINHOS · OUR HOME BASE</small></div>
  <div class="hint paper">DRAG TO EXPLORE THE WORLD · SCROLL TO ZOOM · CLICK A PIN</div>

  <section id="profile" class="profile paper">
    <button class="close" id="closeProfile">×</button>
    <div class="profile-row"><div class="profile-avatar" id="profileAvatar"></div><div><h2 id="profileName"></h2><div class="profile-quote" id="profileQuote"></div></div></div>
    <div id="profileInfo" class="profile-info"></div>
    <span class="community-tag">SURF CAMP COMMUNITY</span>
  </section>

  <div class="modal-wrap" id="modal">
    <div class="modal paper"><button class="close" id="closeModal">×</button><h2>JOIN THE MAP!</h2><p>Add yourself to the Surf Church world. No password. No complicated profile.</p>
      <label>FIRST NAME<input id="first" placeholder="Federico"/></label><label>LAST NAME<input id="last" placeholder="Nigro"/></label><label>CITY / COUNTRY<input id="place" placeholder="Matosinhos, Portugal"/></label><label>INSTAGRAM<input id="ig" placeholder="@yourhandle"/></label><label>YOUR QUOTE<input id="quote" placeholder="Faith. Waves. People."/></label>
      <div class="modal-actions"><button id="cancel">CANCEL</button><button class="save" id="save">DROP MY PIN</button></div>
    </div>
  </div>
  <div id="toast"></div>
</div>`;

const css = document.createElement('style');
css.textContent = `
:root{--sky:#6AC6E8;--yellow:#FFD764;--orange:#FF884D;--cream:#F7F7F7;--ink:#232323;--blue:#397FCE;--teal:#54C7C4}
*{box-sizing:border-box}html,body,#root,#app{margin:0;width:100%;height:100%;overflow:hidden}body{font-family:Arial Black,Impact,Arial,sans-serif;background:#6AC6E8;color:var(--ink)}button,input{font:inherit}button{cursor:pointer}
#map{position:absolute;inset:0;background:linear-gradient(#72CBE9,#5CB6DD)}#map canvas{display:block}
.paper{background:rgba(247,247,247,.97);border:3px solid var(--ink);box-shadow:7px 7px 0 var(--ink);border-radius:17px}
.topbar{position:absolute;z-index:20;left:0;right:0;top:0;height:158px;display:flex;align-items:flex-start;gap:20px;padding:20px 32px;background:linear-gradient(90deg,#6AC6E8 0 22%,var(--yellow) 22% 79%,#6AC6E8 79%);border-bottom:4px solid var(--ink)}
.brand{width:250px;height:115px;line-height:.78;font-size:42px;letter-spacing:-3px;color:var(--cream);text-shadow:3px 3px 0 var(--ink),-2px -2px 0 var(--ink),2px -2px 0 var(--ink),-2px 2px 0 var(--ink);font-style:italic;transform:rotate(-2deg);position:relative;padding-top:3px}.brand b{font-size:26px;letter-spacing:-1px;color:var(--orange);display:block;margin-left:98px;margin-top:4px;text-shadow:2px 2px 0 var(--ink),-1px -1px 0 var(--ink),1px -1px 0 var(--ink),-1px 1px 0 var(--ink)}
.find{flex:1;max-width:720px;padding-top:6px}.find strong{font-size:24px;display:block;margin:0 0 12px}.searchbox{height:43px;max-width:340px;border:3px solid var(--ink);border-radius:10px;background:var(--cream);display:flex;align-items:center;padding:0 11px;box-shadow:4px 4px 0 var(--ink)}.searchbox span{font-size:22px;margin-right:8px}.searchbox input{border:0;outline:0;background:transparent;width:100%;font-family:Arial,sans-serif;font-size:15px;font-weight:800}
.join{margin-top:65px;background:var(--blue);color:white;border:3px solid var(--ink);border-radius:12px;box-shadow:5px 5px 0 var(--ink);height:46px;padding:0 25px;font-size:17px;font-weight:1000}.join:hover{transform:translate(2px,2px);box-shadow:3px 3px 0 var(--ink)}.join-note{position:absolute;right:280px;top:18px;font-family:cursive;font-size:19px;font-weight:900;transform:rotate(-5deg)}.join-note span{font-size:27px}
.friends{position:absolute;z-index:18;right:22px;top:18px;width:300px;max-height:calc(100vh - 36px);overflow:auto;border-color:#397FCE;box-shadow:6px 6px 0 var(--ink)}.friends-title{background:var(--sky);color:var(--cream);font-size:21px;padding:15px 16px;border-bottom:3px solid var(--ink);margin:-1px -1px 10px;text-shadow:1px 1px 0 #456}.friend{display:flex;align-items:center;gap:9px;padding:8px 13px;border-bottom:1px solid #b8b8b8;cursor:pointer}.friend:hover{background:#fff0b0}.friend:last-child{border-bottom:0}.avatar{width:46px;height:46px;border-radius:50%;border:2px solid var(--ink);background:linear-gradient(135deg,var(--sky),var(--yellow));display:grid;place-items:center;font-size:16px;color:white;text-shadow:1px 1px 0 var(--ink);flex:none}.friend-meta{flex:1;font-family:Arial,sans-serif}.friend-meta b{font-size:14px}.friend-meta small{display:block;font-size:12px;margin-top:2px}.friend-dot{width:13px;height:13px;border:2px solid var(--ink);border-radius:50%;flex:none}
.game-stickers{position:absolute;z-index:17;left:28px;bottom:18px;display:flex;gap:12px;align-items:flex-end;pointer-events:none}.sticker{border:3px solid var(--ink);box-shadow:4px 4px 0 var(--ink);font-weight:1000;line-height:.82;text-align:center}.good{background:var(--cream);color:var(--orange);font-size:24px;padding:10px 9px;border-radius:12px;transform:rotate(-5deg);text-shadow:1px 1px 0 var(--ink)}.smile{background:var(--yellow);border-radius:50%;width:48px;height:48px;display:grid;place-items:center;font-size:31px;transform:rotate(7deg)}.shaka{background:var(--blue);color:white;border-radius:12px;padding:4px 9px;font-size:30px;transform:rotate(-8deg)}.faith{background:var(--yellow);border-radius:50%;padding:10px 16px;font-size:13px;transform:rotate(4deg)}.jesus{background:var(--ink);color:var(--cream);border-radius:7px;padding:8px 13px;font-size:12px;transform:rotate(-4deg)}
.map-label{position:absolute;z-index:16;left:50%;bottom:145px;transform:translateX(-50%);background:var(--ink);color:white;border-radius:10px;padding:9px 15px;font-size:18px;box-shadow:4px 4px 0 rgba(255,255,255,.65);text-align:center;pointer-events:none}.map-label small{display:block;color:var(--yellow);font:700 11px Arial,sans-serif;margin-top:3px}.hint{position:absolute;z-index:16;left:50%;bottom:20px;transform:translateX(-50%);padding:10px 16px;font-size:11px;white-space:nowrap}
.profile{position:absolute;z-index:30;left:25px;bottom:100px;width:355px;padding:16px;display:none}.profile.active{display:block}.close{position:absolute;right:8px;top:5px;border:0;background:transparent;font-size:25px;font-weight:1000}.profile-row{display:flex;gap:12px;align-items:center}.profile-avatar{width:68px;height:68px;border-radius:50%;border:3px solid var(--ink);background:linear-gradient(135deg,var(--sky),var(--orange));display:grid;place-items:center;color:white;font-size:20px}.profile h2{margin:0;font-size:20px}.profile-quote{font:italic 700 13px Arial,sans-serif;margin-top:4px}.profile-info{font:700 13px Arial,sans-serif;line-height:1.7;margin-top:12px}.community-tag{display:inline-block;background:var(--teal);border:2px solid var(--ink);border-radius:7px;padding:4px 7px;font-size:10px;margin-top:7px}
.modal-wrap{position:absolute;z-index:50;inset:0;background:rgba(35,35,35,.5);display:none;align-items:center;justify-content:center}.modal-wrap.show{display:flex}.modal{position:relative;width:min(470px,calc(100% - 30px));padding:22px}.modal h2{margin:0 0 5px;font-size:26px}.modal p{font:700 13px Arial,sans-serif;color:#555;margin:0 0 13px}.modal label{display:block;font-size:10px;margin:9px 0}.modal input{display:block;width:100%;border:3px solid var(--ink);border-radius:9px;padding:9px;margin-top:4px;outline:0;background:white;font-family:Arial,sans-serif}.modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:15px}.modal-actions button{border:3px solid var(--ink);border-radius:9px;padding:9px 13px;background:white;font-weight:1000}.modal-actions .save{background:var(--orange);color:white}
#toast{position:absolute;z-index:60;top:170px;left:50%;transform:translate(-50%,-10px);opacity:0;background:var(--yellow);border:3px solid var(--ink);box-shadow:4px 4px 0 var(--ink);border-radius:10px;padding:9px 13px;font-weight:1000;font-size:12px;transition:.2s}#toast.show{opacity:1;transform:translate(-50%,0)}
@media(max-width:900px){.topbar{height:122px;padding:12px;gap:9px}.brand{width:150px;font-size:28px}.brand b{font-size:18px;margin-left:50px}.find strong{font-size:16px}.searchbox{height:37px}.join{margin-top:38px;padding:0 12px}.join span{display:none}.join-note{display:none}.friends{top:135px;right:10px;width:270px;max-height:42vh}.game-stickers{display:none}.map-label{bottom:115px;font-size:14px}.hint{bottom:10px;font-size:8px}.profile{left:10px;bottom:65px;width:calc(100% - 20px)}}`;
document.head.appendChild(css);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, innerWidth/innerHeight, .1, 1000);
camera.position.set(0,.18,4.0);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace;
document.querySelector('#map').appendChild(renderer.domElement);
const controls = new OrbitControls(camera,renderer.domElement);
controls.enablePan=false; controls.enableDamping=true; controls.dampingFactor=.055; controls.minDistance=2.55; controls.maxDistance=5.5; controls.rotateSpeed=.38; controls.zoomSpeed=.55;
scene.add(new THREE.HemisphereLight(0xdaf5ff,0x234353,1.65));
const sun = new THREE.DirectionalLight(0xffffff,2.3); sun.position.set(4,5,6); scene.add(sun);

const world = new THREE.Group(); scene.add(world);
const base = new THREE.Mesh(new THREE.SphereGeometry(1.55,48,32),new THREE.MeshStandardMaterial({color:0x2f92ca,roughness:.92,flatShading:true})); world.add(base);
const oceanRing = new THREE.Mesh(new THREE.SphereGeometry(1.57,48,32),new THREE.MeshBasicMaterial({color:0x79d5ed,transparent:true,opacity:.35,wireframe:true})); world.add(oceanRing);
const countryLayer = new THREE.Mesh(new THREE.SphereGeometry(1.565,64,40),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true})); world.add(countryLayer);
const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.68,48,32),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.16,side:THREE.BackSide})); world.add(atmosphere);
const markers = new THREE.Group(); world.add(markers);

function latLon(lat,lon,r=1.585){const phi=(90-lat)*Math.PI/180,theta=(lon+180)*Math.PI/180;return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta))}

function drawCountryTexture(topology){
  const c=document.createElement('canvas'); c.width=2048; c.height=1024; const x=c.getContext('2d');
  x.fillStyle='#4faed3'; x.fillRect(0,0,c.width,c.height);
  const geo=feature(topology,topology.objects.countries);
  const countryColors=['#6FBF73','#FFD764','#FF884D','#397FCE','#8D79C9','#F0D28B','#54C7C4'];
  geo.features.forEach((f,i)=>{
    const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
    x.beginPath();
    polys.forEach(poly=>poly.forEach(ring=>ring.forEach((p,j)=>{const px=(p[0]+180)/360*c.width,py=(90-p[1])/180*c.height;j?x.lineTo(px,py):x.moveTo(px,py)})));
    x.fillStyle=countryColors[i%countryColors.length]; x.globalAlpha=.94; x.fill(); x.globalAlpha=1; x.strokeStyle='#2b5969'; x.lineWidth=2.8; x.stroke();
  });
  // cartoon wave marks across ocean
  x.strokeStyle='rgba(255,255,255,.42)'; x.lineWidth=5;
  for(let row=0;row<12;row++) for(let col=0;col<22;col++){
    const px=col*95+30+(row%2)*30, py=row*75+45; x.beginPath(); x.arc(px,py,18,Math.PI*.15,Math.PI*.85); x.stroke();
  }
  const texture=new THREE.CanvasTexture(c); texture.colorSpace=THREE.SRGBColorSpace; return texture;
}
fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r=>r.json()).then(topology=>{countryLayer.material.map=drawCountryTexture(topology);countryLayer.material.needsUpdate=true}).catch(()=>{});

function makeBadge(text,color,scale=.7){
  const c=document.createElement('canvas'); c.width=900;c.height=220;const x=c.getContext('2d');
  x.fillStyle=color;x.strokeStyle='#232323';x.lineWidth=12;x.beginPath();x.roundRect(18,25,864,165,34);x.fill();x.stroke();
  x.fillStyle=color===COLORS.yellow?'#232323':'#fff';x.font='900 62px Arial Black,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,450,110);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true}));s.scale.set(scale,scale*.245,1);return s;
}
function makePin(p){
  const g=new THREE.Group();
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.018,.025,.16,8),new THREE.MeshStandardMaterial({color:0x232323})); stem.position.y=.09;g.add(stem);
  const outer=new THREE.Mesh(new THREE.SphereGeometry(.075,16,10),new THREE.MeshStandardMaterial({color:0x232323,flatShading:true})); outer.position.y=.19;g.add(outer);
  const inner=new THREE.Mesh(new THREE.SphereGeometry(.056,16,10),new THREE.MeshStandardMaterial({color:new THREE.Color(p.color||COLORS.teal),flatShading:true})); inner.position.y=.19;g.add(inner);
  g.userData=p; return g;
}
function initials(p){return `${(p.first_name||'S')[0]}${(p.last_name||'C')[0]}`.toUpperCase()}

function makeHQ(){
  const g=new THREE.Group();
  const island=new THREE.Mesh(new THREE.CylinderGeometry(.34,.42,.08,8),new THREE.MeshStandardMaterial({color:0x8fbf78,flatShading:true})); island.position.y=-.03; g.add(island);
  const house=new THREE.Mesh(new THREE.BoxGeometry(.30,.20,.22),new THREE.MeshStandardMaterial({color:0xcbb79a,flatShading:true})); house.position.y=.10; g.add(house);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(.23,.16,4),new THREE.MeshStandardMaterial({color:0x232323,flatShading:true})); roof.rotation.y=Math.PI/4; roof.position.y=.28; g.add(roof);
  for(let i=0;i<3;i++){const board=new THREE.Mesh(new THREE.CapsuleGeometry(.025,.11,4,8),new THREE.MeshStandardMaterial({color:[0xff884d,0xffd764,0x54c7c4][i],flatShading:true}));board.rotation.z=Math.PI/2;board.position.set(-.17+i*.06,.13,.12);g.add(board)}
  const palmStem=new THREE.Mesh(new THREE.CylinderGeometry(.012,.018,.25,7),new THREE.MeshStandardMaterial({color:0x8b6a43})); palmStem.position.set(.19,.16,.08);g.add(palmStem);
  const leaves=new THREE.Mesh(new THREE.SphereGeometry(.07,8,4),new THREE.MeshStandardMaterial({color:0x3f8e55,flatShading:true})); leaves.scale.y=.55; leaves.position.set(.19,.30,.08);g.add(leaves);
  const label=makeBadge('SURF CHURCH PORTO',COLORS.orange,.62);label.position.set(0,.55,0);g.add(label);
  g.userData={hq:true,first_name:'Surf Church',last_name:'Porto',city:'Matosinhos',country:'Portugal',lat:41.2049,lon:-8.7058,quote:'Our home base.',instagram:'@surfchurchporto'};return g;
}

const hq=makeHQ(); hq.position.copy(latLon(41.2049,-8.7058,1.61)); markers.add(hq);

demoFriends.forEach(p=>{const pin=makePin(p);pin.position.copy(latLon(p.lat,p.lon,1.61));markers.add(pin)});

function showProfile(p){
  const el=document.querySelector('#profile'); el.classList.add('active');
  const avatar=document.querySelector('#profileAvatar'); avatar.textContent=p.hq?'🏄':initials(p); avatar.style.background=p.hq?'linear-gradient(135deg,#ff884d,#ffd764)':'linear-gradient(135deg,#6ac6e8,#397fce)';
  document.querySelector('#profileName').textContent=p.hq?'Surf Church Porto':`${p.first_name} ${p.last_name}`;
  document.querySelector('#profileQuote').textContent=`“${p.quote||'Faith. Waves. People.'}”`;
  document.querySelector('#profileInfo').innerHTML=`📍 ${p.city}, ${p.country}<br>◎ ${p.instagram||'@surfchurchporto'}`;
}

document.querySelector('#closeProfile').onclick=()=>document.querySelector('#profile').classList.remove('active');

const list=document.querySelector('#friendList');
function renderList(items){list.innerHTML='';items.forEach(p=>{const row=document.createElement('div');row.className='friend';row.innerHTML=`<div class="avatar">${initials(p)}</div><div class="friend-meta"><b>${p.first_name} ${p.last_name}</b><small>${p.city}, ${p.country}</small></div><i class="friend-dot" style="background:${p.color}"></i>`;row.onclick=()=>{showProfile(p);const v=latLon(p.lat,p.lon,1);camera.position.copy(v.normalize().multiplyScalar(3.15));controls.target.set(0,0,0)};list.appendChild(row)})}
renderList(demoFriends);

document.querySelector('#search').addEventListener('input',e=>{const q=e.target.value.toLowerCase();renderList(demoFriends.filter(p=>`${p.first_name} ${p.last_name}`.toLowerCase().includes(q)))});

async function loadProfiles(){
  if(!supabase)return;
  const {data,error}=await supabase.from('profiles').select('*').order('created_at',{ascending:true});
  if(error||!data?.length)return;
  data.forEach(p=>{if(demoFriends.some(d=>d.id===p.id))return;const normalized={...p,color:COLORS.teal};const pin=makePin(normalized);pin.position.copy(latLon(p.lat,p.lon,1.61));markers.add(pin);demoFriends.push(normalized)});renderList(demoFriends);
}
loadProfiles();

const modal=document.querySelector('#modal');document.querySelector('#add').onclick=()=>modal.classList.add('show');document.querySelector('#closeModal').onclick=()=>modal.classList.remove('show');document.querySelector('#cancel').onclick=()=>modal.classList.remove('show');
function toast(t){const el=document.querySelector('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
async function geocode(place){
  try{const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`);const d=await r.json();if(d[0])return{lat:+d[0].lat,lon:+d[0].lon,display:d[0].display_name};}catch(e){}return null;
}
document.querySelector('#save').onclick=async()=>{
  const first=document.querySelector('#first').value.trim(),last=document.querySelector('#last').value.trim(),place=document.querySelector('#place').value.trim(),instagram=document.querySelector('#ig').value.trim(),quote=document.querySelector('#quote').value.trim();
  if(!first||!last||!place){toast('Add your name + location ✌');return}
  toast('Finding your place on the world...'); const geo=await geocode(place); if(!geo){toast('Could not find that place');return}
  const p={first_name:first,last_name:last,city:place,country:'',lat:geo.lat,lon:geo.lon,instagram,quote,color:COLORS.yellow};
  if(supabase){const {data,error}=await supabase.from('profiles').insert({first_name:first,last_name:last,city:place,country:'',lat:geo.lat,lon:geo.lon,instagram,quote}).select().single();if(!error&&data)Object.assign(p,data)}
  const pin=makePin(p);pin.position.copy(latLon(p.lat,p.lon,1.61));markers.add(pin);demoFriends.push(p);renderList(demoFriends);showProfile(p);modal.classList.remove('show');toast('You are on the map! 🌍');
};

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
renderer.domElement.addEventListener('click',e=>{const r=renderer.domElement.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=-(e.clientY-r.top)/r.height*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(markers.children,true);if(!hits.length)return;let o=hits[0].object;while(o.parent&&o.parent!==markers)o=o.parent;if(o.userData?.hq||o.userData?.first_name)showProfile(o.userData)});

function animate(){requestAnimationFrame(animate);controls.update();markers.children.forEach((m,i)=>{m.position.y+=Math.sin(performance.now()*.002+i)*.00008;m.rotation.y+=.0007});oceanRing.rotation.y+=.00015;renderer.render(scene,camera)}animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
`;
css.textContent += '';
const script = document.createElement('script');
// CSS is intentionally embedded in this module so the visual system ships as one deployable frontend file.

document.head.appendChild(css);
