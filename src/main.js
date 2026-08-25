import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { feature } from 'topojson-client';
import { createClient } from '@supabase/supabase-js';

const C={sky:'#6AC6E8',yellow:'#FFD764',orange:'#FF884D',cream:'#F7F7F7',ink:'#232323',blue:'#397FCE',teal:'#54C7C4'};
const supabaseUrl=import.meta.env.VITE_SUPABASE_URL||'';
const supabaseKey=import.meta.env.VITE_SUPABASE_ANON_KEY||'';
const supabase=supabaseUrl&&supabaseKey?createClient(supabaseUrl,supabaseKey):null;
const demo=[
['Marco','Bianchi','Porto','Portugal',41.1579,-8.6291,'Faith. Waves. People.','@marcobianchi',C.yellow,12],
['Sofia','Martin','Bali','Indonesia',-8.4095,115.1889,'Find your people.','@sofiawaves',C.teal,47],
['Luca','Rossi','Lisbon','Portugal',38.7223,-9.1393,'Saltwater fixes everything.','@lucarossi',C.orange,33],
['Tommaso','Verdi','Ericeira','Portugal',38.9637,-9.4173,'Stay curious.','@tomverdi',C.blue,11],
['Emily','Johnson','Taghazout','Morocco',30.5428,-9.7112,'Good waves, good people.','@emilywaves',C.teal,44],
['Jack','Wilson','Byron Bay','Australia',-28.6474,153.602,"Let's go.",'@jackwilson',C.yellow,59],
['Chloe','Dubois','Hossegor','France',43.662,-1.428,'Adventure is better together.','@chloedubois',C.orange,45]
].map((x,i)=>({id:String(i+1),first_name:x[0],last_name:x[1],city:x[2],country:x[3],lat:x[4],lon:x[5],quote:x[6],instagram:x[7],color:x[8],avatar_url:`https://i.pravatar.cc/160?img=${x[9]}`}));

const root=document.querySelector('#root');
root.innerHTML=`<div id="app">
<div class="brand-block"><div class="logo">SURF<br>CHURCH</div><div class="world">WORLD</div><div class="scribble">EXPLORE<br>YOUR PEOPLE</div></div>
<header class="top"><div class="find-title">FIND YOUR PEOPLE</div><div class="search"><span>⌕</span><input id="search" placeholder="Search by name..."></div><button id="add" class="add">📍 ADD YOUR PIN</button><div class="join-note">Join the map! ↘</div></header>
<main class="map-frame"><div id="map"></div><div class="map-caption">SURF CHURCH WORLD<small>DRAG · EXPLORE · FIND YOUR PEOPLE</small></div><div class="hq-caption">SURF CHURCH PORTO<small>MATOSINHOS · OUR HOME BASE</small></div></main>
<aside class="friends"><div class="friends-head">FRIENDS ON THE MAP</div><div id="friendList"></div></aside>
<div class="stickers"><b class="good">GOOD<br>VIBES</b><b class="smile">☺</b><b class="shaka">🤙</b><b class="faith">FAITH.<br>WAVES.<br>PEOPLE.</b><b class="jesus">✚ JESUS<br>OVER<br>EVERYTHING</b></div>
<div class="hint">SEARCH · EXPLORE · ADD YOUR PIN</div>
<section id="profile" class="profile"><button id="closeProfile" class="x">×</button><div class="profile-row"><img id="avatar" class="avatar-big" alt=""><div><h2 id="pname"></h2><p id="pquote"></p></div></div><div id="pinfo" class="profile-info"></div><b class="tag">SURF CAMP COMMUNITY</b></section>
<div id="modal" class="modal-wrap"><div class="modal"><button id="closeModal" class="x">×</button><h2>JOIN THE MAP!</h2><p>Add yourself to the world. No password.</p><label>FIRST NAME<input id="first" placeholder="Federico"></label><label>LAST NAME<input id="last" placeholder="Nigro"></label><label>CITY / COUNTRY<input id="place" placeholder="Matosinhos, Portugal"></label><label>INSTAGRAM<input id="ig" placeholder="@yourhandle"></label><label>YOUR QUOTE<input id="quote" placeholder="Faith. Waves. People."></label><div class="actions"><button id="cancel">CANCEL</button><button id="save" class="save">DROP MY PIN</button></div></div></div><div id="toast"></div></div>`;

const mapEl=document.querySelector('#map');
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(32,1,.1,100);camera.position.set(0,.08,4.15);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x6AC6E8,1);mapEl.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.055;controls.rotateSpeed=.43;controls.zoomSpeed=.5;controls.minDistance=2.7;controls.maxDistance=5.2;
scene.add(new THREE.HemisphereLight(0xeafaff,0x23495f,2));const sun=new THREE.DirectionalLight(0xfff4dd,3);sun.position.set(4,5,6);scene.add(sun);
const world=new THREE.Group();scene.add(world);const R=1.52;

// A painted globe: flat colors, chunky countries and cartoon water instead of a realistic Earth texture.
const globe=new THREE.Mesh(new THREE.SphereGeometry(R,96,64),new THREE.MeshStandardMaterial({color:0x397FCE,roughness:1,metalness:0}));world.add(globe);
const rim=new THREE.Mesh(new THREE.SphereGeometry(R*1.035,64,48),new THREE.MeshBasicMaterial({color:0xd9f8ff,transparent:true,opacity:.13,side:THREE.BackSide}));world.add(rim);
function latLon(lat,lon,r=R+.018){const p=(90-lat)*Math.PI/180,t=(lon+180)*Math.PI/180;return new THREE.Vector3(-r*Math.sin(p)*Math.cos(t),r*Math.cos(p),r*Math.sin(p)*Math.sin(t));}

function makeWorldTexture(){
 const c=document.createElement('canvas');c.width=2048;c.height=1024;const x=c.getContext('2d');
 x.fillStyle=C.blue;x.fillRect(0,0,c.width,c.height);
 // hand-painted ocean waves
 x.lineWidth=4;x.strokeStyle='rgba(247,247,247,.34)';
 for(let y=50;y<c.height;y+=58){for(let xx=-50;xx<c.width+50;xx+=110){x.beginPath();x.arc(xx,y,25,Math.PI,Math.PI*2);x.stroke()}}
 fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r=>r.json()).then(t=>{
   const geo=feature(t,t.objects.countries);const pal=['#F2D39A','#6FBF73','#FFD764','#54C7C4','#FF884D','#8E7BC5','#72CBE9'];
   geo.features.forEach((f,i)=>{const groups=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;groups.forEach(poly=>poly.forEach(ring=>{x.beginPath();ring.forEach(([lon,lat],j)=>{const X=(lon+180)/360*c.width,Y=(90-lat)/180*c.height;j?x.lineTo(X,Y):x.moveTo(X,Y)});x.closePath();x.fillStyle=pal[i%pal.length];x.fill();x.strokeStyle=C.ink;x.lineWidth=2.5;x.stroke()}))});
   globe.material.map=new THREE.CanvasTexture(c);globe.material.needsUpdate=true;
 }).catch(()=>{});
}
makeWorldTexture();

function addCloud(lat,lon,scale=.12){const g=new THREE.Group();g.position.copy(latLon(lat,lon,R+.035));g.lookAt(g.position.clone().multiplyScalar(2));for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(scale*(i===1?1:.75),12,8),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8}));m.position.x=(i-1)*scale*.55;g.add(m)}world.add(g);return g}
[[38,-25],[15,80],[-20,-90],[-34,50],[50,120]].forEach(v=>addCloud(v[0],v[1],.09));

function addBalloon(lat,lon,color){const g=new THREE.Group();g.position.copy(latLon(lat,lon,R+.12));g.lookAt(g.position.clone().multiplyScalar(2));const b=new THREE.Mesh(new THREE.SphereGeometry(.075,16,12),new THREE.MeshStandardMaterial({color,roughness:.8}));b.scale.y=1.25;b.position.y=.12;g.add(b);const basket=new THREE.Mesh(new THREE.BoxGeometry(.035,.025,.035),new THREE.MeshBasicMaterial({color:C.ink}));basket.position.y=-.01;g.add(basket);world.add(g);return g}
[[48,8,C.orange],[28,120,C.yellow],[-18,30,C.teal]].forEach(v=>addBalloon(...v));

function textSprite(text,sub,scale=1){const c=document.createElement('canvas');c.width=900;c.height=220;const g=c.getContext('2d');g.textAlign='center';g.font='900 50px Anton, Arial';g.lineWidth=14;g.strokeStyle=C.ink;g.fillStyle=C.cream;g.strokeText(text,450,78);g.fillText(text,450,78);if(sub){g.font='700 25px Oswald,Arial';g.strokeText(sub,450,130);g.fillText(sub,450,130)}const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));s.scale.set(.75*scale,.18*scale,1);return s}

function pin(p,hq=false){const g=new THREE.Group();g.position.copy(latLon(p.lat,p.lon,R+.07));g.lookAt(g.position.clone().multiplyScalar(2));
 const c=new THREE.Mesh(new THREE.CircleGeometry(hq?.13:.09,24),new THREE.MeshBasicMaterial({color:C.cream}));c.rotation.x=Math.PI/2;c.position.y=.02;g.add(c);
 const stem=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,hq?.28:.2,8),new THREE.MeshBasicMaterial({color:C.ink}));stem.position.y=.12;g.add(stem);
 const ball=new THREE.Mesh(new THREE.SphereGeometry(hq?.11:.075,18,12),new THREE.MeshStandardMaterial({color:new THREE.Color(hq?C.orange:p.color),roughness:.85}));ball.position.y=hq?.31:.24;g.add(ball);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(hq?.135:.09,.014,8,24),new THREE.MeshBasicMaterial({color:C.cream}));ring.position.y=hq?.31:.24;g.add(ring);
 if(p.avatar_url&&!hq){const tex=new THREE.TextureLoader().load(p.avatar_url);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));s.scale.set(.16,.16,1);s.position.y=.24;g.add(s)}
 const label=textSprite(hq?'SURF CHURCH PORTO':'',hq?'MATOSINHOS · PORTO':'',hq?1:.7);if(hq){label.position.y=.62;g.add(label)}
 g.userData.profile=p;world.add(g);return g;
}

// Surf Church Porto HQ: tiny playful surf warehouse diorama in Matosinhos.
const hq={id:'hq',name:'Surf Church Porto',city:'Matosinhos',country:'Portugal',lat:41.2269,lon:-8.7053,quote:'Faith. Waves. People.',instagram:'@surfchurchporto',color:C.orange};
const hqPin=pin(hq,true);
const island=new THREE.Mesh(new THREE.CylinderGeometry(.34,.39,.10,9),new THREE.MeshStandardMaterial({color:0x72b96d,roughness:1}));island.position.y=-.035;hqPin.add(island);
const waterRing=new THREE.Mesh(new THREE.TorusGeometry(.37,.025,8,28),new THREE.MeshBasicMaterial({color:C.cream}));waterRing.rotation.x=Math.PI/2;waterRing.position.y=-.02;hqPin.add(waterRing);
const house=new THREE.Mesh(new THREE.BoxGeometry(.29,.18,.22),new THREE.MeshStandardMaterial({color:0x8b7968,roughness:1}));house.position.y=.09;hqPin.add(house);
const roof=new THREE.Mesh(new THREE.ConeGeometry(.23,.16,4),new THREE.MeshStandardMaterial({color:C.ink,roughness:1}));roof.rotation.y=Math.PI/4;roof.position.y=.25;hqPin.add(roof);
const sign=textSprite('SURF CHURCH','',.42);sign.position.set(0,.20,.12);sign.scale.set(.45,.12,1);hqPin.add(sign);
for(let i=0;i<3;i++){const board=new THREE.Mesh(new THREE.CapsuleGeometry(.018,.11,4,8),new THREE.MeshStandardMaterial({color:[C.yellow,C.orange,C.blue][i]}));board.rotation.z=Math.PI/2;board.position.set(-.14+i*.06,.11,.13);hqPin.add(board)}
for(let i=0;i<3;i++){const palm=new THREE.Mesh(new THREE.CylinderGeometry(.012,.018,.16,7),new THREE.MeshStandardMaterial({color:0x6b4b32}));palm.position.set(.12+i*.05,.12,-.10);hqPin.add(palm);const leaf=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),new THREE.MeshBasicMaterial({color:0x2f8d58}));leaf.scale.set(1.6,.55,1);leaf.position.set(.12+i*.05,.22,-.10);hqPin.add(leaf)}

// Landmark dioramas: tiny game-like silhouettes, not photorealistic models.
function landmark(lat,lon,type,color){const g=new THREE.Group();g.position.copy(latLon(lat,lon,R+.025));g.lookAt(g.position.clone().multiplyScalar(2));const base=new THREE.Mesh(new THREE.CylinderGeometry(.11,.14,.035,8),new THREE.MeshStandardMaterial({color:0x6fbf73}));base.position.y=.015;g.add(base);
 if(type==='eiffel'){const m=new THREE.Mesh(new THREE.CylinderGeometry(.018,.045,.28,6),new THREE.MeshStandardMaterial({color:0x574d43}));m.position.y=.16;g.add(m);for(let y of [.07,.16,.24]){const bar=new THREE.Mesh(new THREE.BoxGeometry(.12-y*.25,.015,.015),new THREE.MeshBasicMaterial({color:C.ink}));bar.position.y=y;g.add(bar)}}
 if(type==='colosseum'){const ring=new THREE.Mesh(new THREE.TorusGeometry(.075,.035,8,20),new THREE.MeshStandardMaterial({color:0xc9a87d}));ring.rotation.x=Math.PI/2;ring.position.y=.06;g.add(ring)}
 if(type==='statue'){const m=new THREE.Mesh(new THREE.CylinderGeometry(.018,.035,.20,7),new THREE.MeshStandardMaterial({color:0x9bc4bd}));m.position.y=.12;g.add(m);const head=new THREE.Mesh(new THREE.SphereGeometry(.03,8,8),new THREE.MeshBasicMaterial({color:0x9bc4bd}));head.position.y=.24;g.add(head)}
 if(type==='opera'){const roof=new THREE.Mesh(new THREE.ConeGeometry(.13,.16,8),new THREE.MeshStandardMaterial({color:C.cream}));roof.scale.set(1,.55,1);roof.rotation.x=Math.PI/2;roof.position.y=.12;g.add(roof)}
 world.add(g);return g}
landmark(48.8584,2.2945,'eiffel',C.orange);landmark(41.8902,12.4924,'colosseum',C.yellow);landmark(40.6892,-74.0445,'statue',C.teal);landmark(-33.8568,151.2153,'opera',C.cream);

const pins=demo.map(p=>pin(p,false));

function showProfile(p){document.querySelector('#profile').classList.add('active');document.querySelector('#pname').textContent=p.name||`${p.first_name} ${p.last_name}`;document.querySelector('#pquote').textContent=`“${p.quote||''}”`;document.querySelector('#pinfo').innerHTML=`📍 ${p.city||''}${p.country?', '+p.country:''}<br>◎ ${p.instagram||''}`;document.querySelector('#avatar').src=p.avatar_url||`https://i.pravatar.cc/160?u=${encodeURIComponent(p.first_name||p.name)}`}
const list=document.querySelector('#friendList');
function render(arr){list.innerHTML='';arr.forEach(p=>{const d=document.createElement('div');d.className='friend';const avatar=p.avatar_url?`<img class="av" src="${p.avatar_url}" alt="">`:`<div class="av">${p.first_name[0]}${p.last_name[0]}</div>`;d.innerHTML=`${avatar}<div class="meta"><b>${p.first_name} ${p.last_name}</b><small>${p.city}, ${p.country}</small></div><i class="dot" style="background:${p.color||C.teal}"></i>`;d.onclick=()=>{showProfile(p);camera.position.copy(latLon(p.lat,p.lon,3.55));controls.target.set(0,0,0)};list.appendChild(d)})}
render(demo);
document.querySelector('#search').oninput=e=>{const q=e.target.value.toLowerCase().trim();render(demo.filter(p=>`${p.first_name} ${p.last_name}`.toLowerCase().includes(q)))};

const modal=document.querySelector('#modal');document.querySelector('#add').onclick=()=>modal.classList.add('show');document.querySelector('#closeModal').onclick=()=>modal.classList.remove('show');document.querySelector('#cancel').onclick=()=>modal.classList.remove('show');document.querySelector('#closeProfile').onclick=()=>document.querySelector('#profile').classList.remove('active');
function toast(t){const e=document.querySelector('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2200)}
document.querySelector('#save').onclick=async()=>{const first=document.querySelector('#first').value.trim(),last=document.querySelector('#last').value.trim(),place=document.querySelector('#place').value.trim(),ig=document.querySelector('#ig').value.trim(),quote=document.querySelector('#quote').value.trim();if(!first||!last||!place)return toast('Add your name and location ✌');const parts=place.split(',').map(s=>s.trim());const p={first_name:first,last_name:last,city:parts[0],country:parts[1]||'',lat:41.2269,lon:-8.7053,quote:quote||'Faith. Waves. People.',instagram:ig||'@surfer',color:C.yellow,avatar_url:`https://i.pravatar.cc/160?u=${encodeURIComponent(first+last)}`};if(supabase){const {error}=await supabase.from('profiles').insert({first_name:p.first_name,last_name:p.last_name,city:p.city,country:p.country,lat:p.lat,lon:p.lon,quote:p.quote,instagram:p.instagram,avatar_url:p.avatar_url});if(error)return toast('Could not save your pin')}pin(p,false);showProfile(p);modal.classList.remove('show');toast('You are on the map! 🌍')};
async function load(){if(!supabase)return;const {data,error}=await supabase.from('profiles').select('*').order('created_at',{ascending:true});if(!error&&data){data.filter(p=>!demo.some(d=>d.id===p.id)).forEach(p=>pin({...p,color:C.teal}))}}
load();
function resize(){const el=document.querySelector('#map');camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight)}addEventListener('resize',resize);resize();
function animate(t){requestAnimationFrame(animate);controls.update();world.children.forEach((o,i)=>{if(o.userData?.profile&&!o.userData?.profile.id==='hq')o.position.y+=Math.sin(t*.001+i)*.00001});renderer.render(scene,camera)}animate(0);
