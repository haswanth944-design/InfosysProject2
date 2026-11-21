import {sb} from './supabase.js';
import {REQUIRE_EMAIL_OTP,OTP_LENGTH} from './config.js';
const ROLES={
admin:{db:'admin',n:'Admin',i:'shield-check',c:'#8b5cf6',d:'System management, user administration and permissions.',nav:[['layout-dashboard','Dashboard'],['users','Users'],['key-round','Roles'],['settings','System']],tiles:[['w6','key-round','Role overview','Five roles defined','Admin, Project Manager, Developer, Tester and DevOps Engineer.'],['w6','activity','System status','No status reported','Service health will be shown from the live API.']]},
pm:{db:'project_manager',n:'Project Manager',i:'briefcase',c:'#f59e0b',d:'Project creation, planning and team coordination.',nav:[['layout-dashboard','Dashboard'],['folder','Projects'],['git-branch','Sprints'],['users','Team']],tiles:[['w3','folder','Project overview','No projects yet','Create your first project to start planning sprints.'],['w3','users','Team overview','No team members','Members appear after the Admin approves their accounts.'],['w6','plus-circle','Project creation','Start a project','Project creation arrives in the next milestone step.']]},
dev:{db:'developer',n:'Developer',i:'code-2',c:'#3b82f6',d:'Development work and assigned project tasks.',nav:[['layout-dashboard','Dashboard'],['folder','My projects'],['list-checks','My tasks']],tiles:[['w3','folder','Assigned projects','Nothing assigned','Projects assigned by a Project Manager show up here.'],['w3','list-checks','Assigned tasks','No tasks yet','Task progress updates will be available here.']]},
tester:{db:'tester',n:'Tester',i:'bug',c:'#10b981',d:'Application testing and bug reporting.',nav:[['layout-dashboard','Dashboard'],['flask-conical','Test cases'],['bug','Bugs']],tiles:[['w3','flask-conical','Testing assignments','No assignments','Assigned test cycles will appear here.'],['w3','activity','Testing overview','No results yet','Executed test results will be summarised here.']]},
devops:{db:'devops',n:'DevOps Engineer',i:'server',c:'#06b6d4',d:'Build, deployment and infrastructure management.',nav:[['layout-dashboard','Dashboard'],['git-branch','Pipelines'],['rocket','Deployments'],['activity','Monitoring']],tiles:[['w3','git-branch','Build pipelines','No pipelines connected','Pipeline status arrives with the build integration.'],['w3','rocket','Deployments','No deployments','Deployment history will be listed here.']]}};
const K=Object.keys(ROLES);
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const root=$('#root');let cur={role:'admin'};
const ico=()=>window.lucide&&lucide.createIcons();
const I=(n,c='ic')=>`<i data-lucide="${n}" class="${c}"></i>`;
function toast(msg,t='in'){const e=document.createElement('div');e.className='toast '+t;e.innerHTML=I(t=='ok'?'check-circle-2':t=='er'?'alert-circle':'info')+'<span>'+msg+'</span>';$('#toasts').appendChild(e);ico();setTimeout(()=>e.remove(),4200)}
function theme(){const d=document.documentElement;d.dataset.theme=d.dataset.theme=='light'?'dark':'light'}
if(matchMedia('(prefers-color-scheme: light)').matches)document.documentElement.dataset.theme='light';
function topbar(){return `<header class="top glass"><a href="#landing" class="logo">${'<span class="m">'+I('network')+'</span>'}NeuroForge Nexus</a><nav><a class="nb" href="#landing">Home</a><button class="nb" data-dlg="about">About</button><button class="nb" data-dlg="help">Help</button></nav><button class="ib" data-act="cmd" aria-label="Open command menu">${I('search')}</button><button class="ib" data-act="theme" aria-label="Toggle theme">${I('sun-moon')}</button><button class="pri" data-act="signin">Sign in</button></header>`}
function landing(){return topbar()+`<section class="hero"><h1>One Platform. Five Roles. One Connected Workflow.</h1><p>Enterprise Software Lifecycle and DevOps Management System: plan, build, test, release and monitor software in one place.</p></section><section class="grid" id="roles">${K.map(k=>{const r=ROLES[k];return `<button class="rc glass" style="--c:${r.c}" data-role="${k}"><span class="ri">${I(r.i)}</span><h3>${r.n}</h3><p>${r.d}</p><span class="go">Continue ${I('arrow-right')}</span></button>`}).join('')}</section>`}
function login(k){const r=ROLES[k];cur.role=k;return `<div class="center" style="--rc:${r.c}"><div class="card glass"><a class="lnk" href="#landing" style="display:inline-flex;gap:6px;align-items:center;font-size:13px">${I('arrow-left')} Back to roles</a><div style="margin-top:18px"><span class="badge">${I(r.i)} ${r.n}</span></div><h2>Welcome back</h2><p class="sub">Sign in to your ${r.n} workspace.</p><form id="lf" novalidate><div id="g1"><label for="em">Email</label><input id="em" type="email" autocomplete="email" placeholder="you@company.com"><div class="err" id="e1"></div></div><div id="g2"><label for="pw">Password</label><div class="fld"><input id="pw" type="password" autocomplete="current-password" placeholder="Enter your password"><button type="button" class="ib" data-act="eye" aria-label="Show password">${I('eye')}</button></div><div class="err" id="e2"></div></div><div class="row"><label><input type="checkbox"> Remember me</label><button type="button" class="lnk" data-dlg="forgot">Forgot password?</button></div><button class="pri full" id="sb">Sign In</button></form>${k=='admin'?'<p class="foot">Admin accounts are provisioned by an authorized administrator.</p>':'<p class="foot">New here? <button class="lnk" data-dlg="reg">Request access</button></p>'}</div></div>`}
let tmr,cd;
function otp(){const r=ROLES[cur.role];return `<div class="center" style="--rc:${r.c}"><div class="card glass" style="text-align:center"><div class="shield">${I('shield-check')}</div><h2 style="margin-top:0">Verify your email</h2><p class="sub" style="margin-bottom:0">Enter the ${OTP_LENGTH}-digit code sent to <b id="oe"></b>. It expires in <b id="ct">5:00</b>.</p><div class="otp" id="ob">${Array.from({length:OTP_LENGTH},(_,i)=>i).map(i=>`<input inputmode="numeric" maxlength="1" placeholder=" " aria-label="Digit ${i+1}" autocomplete="one-time-code">`).join('')}</div><div class="err" id="oer" style="margin:-10px 0 12px"></div><button class="pri full" id="ov" disabled>Verify Code ${I('arrow-right')}</button><p class="foot"><button class="lnk" id="rs" disabled>Resend code in 60s</button> · <a class="lnk" href="#login-${cur.role}">Change email</a></p></div></div>`}
function dash(k){const r=ROLES[k];cur.role=k;const d=new Date().toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});return `<div class="app" style="--rc:${r.c}"><aside class="glass" id="sd"><div class="logo"><span class="m">${I('network')}</span>NeuroForge</div>${r.nav.map((n,i)=>`<button class="ni ${i?'':'on'}" data-nav="${n[1]}">${I(n[0])}${n[1]}</button>`).join('')}<button class="me" data-act="out"><span class="av">${esc((cur.me.full_name||r.n)[0])}</span><span style="flex:1"><b style="display:block;font-size:13px">${esc(cur.me.full_name||cur.me.email)}</b><span style="font-size:12px;color:var(--mut)">Sign out</span></span>${I('log-out')}</button></aside><main><div class="bar glass"><button class="ib menu" data-act="menu" aria-label="Menu">${I('menu')}</button><h2>${r.n} Dashboard</h2><button class="pill d" data-act="cmd">${I('search')} Search <span class="kbd">Ctrl K</span></button><span class="pill d">${d}</span><button class="ib" data-act="theme" aria-label="Toggle theme">${I('sun-moon')}</button><button class="ib" data-act="bell" aria-label="Notifications">${I('bell')}</button></div><div class="tiles"><section class="tile glass w6" id="pt"><h4>${I('folder')}Projects<span style="margin-left:auto">${CAN()?'<button class="pri" id="np">'+'New project</button>':''}</span></h4><div id="pl" class="empty">Loading…</div></section>${k=='admin'?'<section class="tile glass w6"><h4>'+I('users')+'User management</h4><div id="ul" class="empty">Loading…</div></section>':''}${r.tiles.filter(t=>t[1]!=='folder'&&t[1]!=='plus-circle').map(t=>`<section class="tile glass ${t[0]}"><h4>${I(t[1])}${t[2]}</h4><div class="empty">${I(t[1])}<b>${t[3]}</b><span>${t[4]}</span></div></section>`).join('')}</div></main></div>`}
async function route(){const h=location.hash.slice(1)||'landing';let html;if(h.startsWith('dash-')&&ROLES[h.slice(5)]){const me=await guard(h.slice(5));if(!me){location.hash='landing';return}cur.me=me}
 if(h.startsWith('login-')&&ROLES[h.slice(6)])html=login(h.slice(6));
 else if(h=='otp')html=otp();
 else if(h.startsWith('dash-')&&ROLES[h.slice(5)])html=dash(h.slice(5));
 else html=landing();
 clearInterval(tmr);root.innerHTML='<div class="view on">'+html+'</div>';ico();bind(h);scrollTo(0,0)}
function bind(h){
 if(h=='otp')initOtp();if(h=='dash-admin')loadUsers();if(h.startsWith('dash-'))loadProjects();
 $$('.rc').forEach(c=>c.addEventListener('pointermove',e=>{const b=c.getBoundingClientRect();c.style.setProperty('--mx',e.clientX-b.left+'px');c.style.setProperty('--my',e.clientY-b.top+'px')}));
 const lf=$('#lf');if(lf)lf.addEventListener('submit',submitLogin);
 if(lf)$('#em').addEventListener('input',()=>clr('g1','e1'));if(lf)$('#pw').addEventListener('input',()=>clr('g2','e2'));
}
const clr=(g,e)=>{$('#'+g).classList.remove('bad');$('#'+e).textContent=''};
const bad=(g,e,m)=>{const x=$('#'+g);x.classList.remove('bad');void x.offsetWidth;x.classList.add('bad');$('#'+e).textContent=m};
const mailRe=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function submitLogin(e){e.preventDefault();const em=$('#em').value.trim(),pw=$('#pw').value;let ok=true;
 if(!em){bad('g1','e1','Email is required.');ok=false}else if(!mailRe.test(em)){bad('g1','e1','Enter a valid email address.');ok=false}
 if(!pw){bad('g2','e2','Password is required.');ok=false}if(!ok){toast('Please fix the highlighted fields.','er');return}
 doLogin(em,pw)}
function initOtp(){$('#oe').textContent=cur.email||'your email';const ins=$$('#ob input');ins[0].focus();
 ins.forEach((x,i)=>{x.addEventListener('input',()=>{x.value=x.value.replace(/\D/g,'');if(x.value&&ins[i+1])ins[i+1].focus()});
  x.addEventListener('keydown',e=>{if(e.key=='Backspace'&&!x.value&&ins[i-1]){ins[i-1].focus();ins[i-1].value=''}if(e.key=='ArrowLeft'&&ins[i-1])ins[i-1].focus();if(e.key=='ArrowRight'&&ins[i+1])ins[i+1].focus();if(e.key=='Enter')$('#ov').click()});
  x.addEventListener('paste',e=>{e.preventDefault();const t=(e.clipboardData.getData('text')||'').replace(/[\s-]/g,'');if(!isOtp(t)){$('#oer').textContent='The code must be exactly '+OTP_LENGTH+' digits.';return}[...t].forEach((c,j)=>ins[j].value=c);ins[ins.length-1].focus();upd()})});
 const upd=()=>{$('#ov').disabled=!isOtp(ins.map(i=>i.value).join(''))};ins.forEach(x=>{x.addEventListener('input',()=>{$('#oer').textContent='';upd()});x.addEventListener('keyup',upd)});upd();
 let left=300,cool=60;const ct=$('#ct'),rs=$('#rs');
 tmr=setInterval(()=>{left=Math.max(0,left-1);ct.textContent=Math.floor(left/60)+':'+String(left%60).padStart(2,'0');if(cool>0){cool--;rs.textContent=cool?`Resend code in ${cool}s`:'Resend code';rs.disabled=cool>0}},1000);
 rs.onclick=async()=>{cool=60;rs.disabled=true;left=300;const r=cur.mode=='signup'?await sb.auth.resend({type:'signup',email:cur.email}):await sb.auth.signInWithOtp({email:cur.email,options:{shouldCreateUser:false}});toast(r.error?r.error.message:'A new code was sent.',r.error?'er':'ok')};
 $('#ov').onclick=()=>{const v=ins.map(i=>i.value).join('');if(!isOtp(v)){$('#oer').textContent='Enter all '+OTP_LENGTH+' digits.';$('#ob').classList.remove('bad');void $('#ob').offsetWidth;$('#ob').classList.add('bad');return}
  verifyCode(v)}}
/* dialogs */
function modal(html){const o=document.createElement('div');o.className='ov';o.innerHTML='<div class="dlg" role="dialog" aria-modal="true">'+html+'</div>';const prev=document.activeElement;const close=()=>{o.remove();prev&&prev.focus&&prev.focus()};o.addEventListener('mousedown',e=>{if(e.target==o)close()});o.addEventListener('keydown',e=>{if(e.key=='Escape')close()});document.body.appendChild(o);ico();$$('[data-close]',o).forEach(b=>b.onclick=close);const f=$('input,button',o);f&&f.focus();return{o,close}}
const DL={about:()=>modal(`<h3>About NeuroForge Nexus</h3><p class="sub" style="color:var(--mut);margin:8px 0 18px">An enterprise software lifecycle and DevOps management system with five specialized roles.</p><button class="pri" data-close>Close</button>`),
help:()=>modal(`<h3>Help</h3><p style="color:var(--mut);margin:8px 0 18px">Pick your role, sign in, then verify the ${OTP_LENGTH}-digit code sent to your email. Press Ctrl+K (or Cmd+K) anywhere to open the command menu.</p><button class="pri" data-close>Got it</button>`),
forgot:()=>{const m=modal(`<h3>Reset your password</h3><p style="color:var(--mut);margin:6px 0 4px" id="fp">We will email a ${OTP_LENGTH}-digit recovery code.</p><div id="s1"><label for="fe">Email</label><input id="fe" type="email" placeholder="you@company.com"></div><div id="s2" style="display:none"><label for="fc">Code</label><input id="fc" type="text" inputmode="numeric" maxlength="6"><label for="fn">New password</label><input id="fn" type="password" placeholder="At least 8 characters"></div><div class="err" id="fer"></div><div style="display:flex;gap:10px;margin-top:18px"><button class="pri" id="fs">Send code</button><button class="sec" data-close>Cancel</button></div>`);
 const g=i=>$('#'+i,m.o);let step=1,em='';
 g('fs').onclick=async()=>{const e=g('fer');e.textContent='';g('fs').disabled=true;
  if(step==1){em=g('fe').value.trim();if(!mailRe.test(em)){e.textContent='Enter a valid email address.';g('fs').disabled=false;return}
   const {error}=await sb.auth.resetPasswordForEmail(em);g('fs').disabled=false;if(error){e.textContent=error.message;return}
   step=2;g('s1').style.display='none';g('s2').style.display='block';g('fs').textContent='Set new password';g('fp').textContent='Enter the code we emailed you and choose a new password.';return}
  if(g('fn').value.length<8){e.textContent='Password must be at least 8 characters.';g('fs').disabled=false;return}
  const v=await sb.auth.verifyOtp({email:em,token:g('fc').value.trim(),type:'recovery'});
  if(v.error){e.textContent='That code is invalid or has expired.';g('fs').disabled=false;return}
  const u=await sb.auth.updateUser({password:g('fn').value});await sb.auth.signOut({scope:'local'});g('fs').disabled=false;
  if(u.error){e.textContent=u.error.message;return}m.close();toast('Password updated. You can sign in now.','ok')}},
reg:()=>{const m=modal(`<h3>Request access</h3><p style="color:var(--mut);margin:6px 0 0">Role: <b>${ROLES[cur.role].n}</b>. An administrator approves new accounts.</p><label for="rn">Full name</label><input id="rn" type="text"><label for="re">Email</label><input id="re" type="email"><label for="rp">Password</label><input id="rp" type="password" placeholder="At least 8 characters"><label for="rc">Confirm password</label><input id="rc" type="password"><label style="display:flex;gap:8px;align-items:center;font-weight:450"><input id="rt" type="checkbox"> I accept the terms and conditions</label><div class="err" id="rer"></div><div style="display:flex;gap:10px;margin-top:16px"><button class="pri" id="rb">Create account</button><button class="sec" data-close>Cancel</button></div>`);
 $('#rb',m.o).onclick=async()=>{const g=i=>$('#'+i,m.o),e=g('rer');let msg='';
  if(!g('rn').value.trim())msg='Full name is required.';else if(!mailRe.test(g('re').value.trim()))msg='Enter a valid email address.';else if(g('rp').value.length<8)msg='Password must be at least 8 characters.';else if(g('rp').value!==g('rc').value)msg='Passwords do not match.';else if(!g('rt').checked)msg='Please accept the terms.';
  e.textContent=msg;if(msg)return;const em=g('re').value.trim();g('rb').disabled=true;const {error}=await sb.auth.signUp({email:em,password:g('rp').value,options:{data:{full_name:g('rn').value.trim(),requested_role:ROLES[cur.role].db}}});if(error){e.textContent=error.message;g('rb').disabled=false;return}cur.email=em;cur.mode='signup';m.close();toast('Account created. Enter the code we emailed you.','ok');location.hash='otp'}}};
/* command menu */
function cmd(){const items=[['Home','home','#landing'],...K.map(k=>['Sign in as '+ROLES[k].n,ROLES[k].i,'#login-'+k]),['Toggle theme','sun-moon','theme']];
 const m=modal(`<div style="margin:-26px"><div class="cmd" style="width:100%;box-shadow:none;border:0"><input id="cq" type="text" placeholder="Type a command…" aria-label="Command search"><div id="cl"></div></div></div>`);
 const dl=m.o.firstChild;dl.style.padding='26px';dl.style.width='min(540px,100%)';let sel=0,list=[];
 const draw=()=>{const q=$('#cq',m.o).value.toLowerCase();list=items.filter(i=>i[0].toLowerCase().includes(q));sel=Math.min(sel,Math.max(0,list.length-1));$('#cl',m.o).innerHTML=list.map((x,i)=>`<button class="${i==sel?'on':''}" data-i="${i}">${I(x[1])}${x[0]}</button>`).join('')||'<p style="padding:14px 18px;color:var(--mut)">No results.</p>';ico();$$('#cl button',m.o).forEach(b=>b.onclick=()=>run(+b.dataset.i))};
 const run=i=>{const x=list[i];if(!x)return;m.close();x[2]=='theme'?theme():location.hash=x[2]};
 $('#cq',m.o).addEventListener('input',draw);$('#cq',m.o).addEventListener('keydown',e=>{if(e.key=='ArrowDown'){sel=Math.min(sel+1,list.length-1);draw();e.preventDefault()}if(e.key=='ArrowUp'){sel=Math.max(0,sel-1);draw();e.preventDefault()}if(e.key=='Enter')run(sel)});draw()}
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()=='k'){e.preventDefault();if(!$('.ov'))cmd()}});
document.addEventListener('click',e=>{const t=e.target.closest('[data-role],[data-act],[data-dlg],[data-nav]');if(!t)return;
 if(t.dataset.role){const k=t.dataset.role;$$('.rc').forEach(c=>c.classList.add(c==t?'sel':'dim'));setTimeout(()=>location.hash='login-'+k,380)}
 else if(t.dataset.dlg)DL[t.dataset.dlg]();
 else if(t.dataset.nav){if(t.dataset.nav=='Dashboard'){$$('.ni').forEach(n=>n.classList.toggle('on',n==t))}else if(/project/i.test(t.dataset.nav))$('#pt').scrollIntoView({behavior:'smooth'});else toast(t.dataset.nav+' arrives in a later milestone step.','in')}
 else{const a=t.dataset.act;if(a=='theme')theme();else if(a=='cmd')cmd();else if(a=='signin'){document.getElementById('roles').scrollIntoView({behavior:'smooth'})}
 else if(a=='eye'){const p=$('#pw'),s=p.type=='password';p.type=s?'text':'password';t.innerHTML=I(s?'eye-off':'eye');ico()}
 else if(a=='out'){sb.auth.signOut().then(()=>{toast('Signed out.','ok');location.hash='landing'})}
 else if(a=='menu')$('#sd').classList.toggle('open');
 else if(a=='bell')toast('No notifications.','in')}});
window.addEventListener('hashchange',route);
/* network background */
(function(){const c=$('#net'),x=c.getContext('2d');let w,h,P=[];const rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function rs(){w=c.width=innerWidth;h=c.height=innerHeight;P=Array.from({length:Math.min(60,Math.floor(w*h/22000))},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25}))}
 function f(){x.clearRect(0,0,w,h);const l=document.documentElement.dataset.theme=='light';x.fillStyle=l?'rgba(80,90,200,.5)':'rgba(170,185,255,.6)';
  for(const p of P){if(!rm){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1}x.beginPath();x.arc(p.x,p.y,1.6,0,6.3);x.fill()}
  for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const d=Math.hypot(P[i].x-P[j].x,P[i].y-P[j].y);if(d<140){x.strokeStyle=(l?'rgba(80,90,200,':'rgba(140,150,255,')+(.2*(1-d/140))+')';x.beginPath();x.moveTo(P[i].x,P[i].y);x.lineTo(P[j].x,P[j].y);x.stroke()}}
  if(!rm)requestAnimationFrame(f)}
 addEventListener('resize',()=>{rs();rm&&f()});rs();f()})();
const isOtp=v=>new RegExp('^[0-9]{'+OTP_LENGTH+'}$').test(v);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function doLogin(em,pw){const b=$('#sb');b.disabled=true;b.innerHTML='<span class="spin"></span> Signing in…';
 try{const {data,error}=await sb.auth.signInWithPassword({email:em,password:pw});if(error)throw error;
  const {data:p}=await sb.from('profiles').select('role,account_status').eq('id',data.user.id).single();
  const deny=!p||!p.role||p.account_status!=='active'?(p&&p.account_status=='suspended'?'This account is suspended.':'Your account is awaiting administrator approval.'):p.role!==ROLES[cur.role].db?'This is not a '+ROLES[cur.role].n+' account.':'';
  if(deny||REQUIRE_EMAIL_OTP)await sb.auth.signOut({scope:'local'});
  if(deny)throw new Error(deny);
  if(!REQUIRE_EMAIL_OTP){toast('Signed in.','ok');location.hash='dash-'+cur.role;return}
  const {error:oe}=await sb.auth.signInWithOtp({email:em,options:{shouldCreateUser:false}});if(oe)throw oe;
  cur.email=em;cur.mode='email';toast('We emailed you a code.','ok');location.hash='otp'}
 catch(e){toast(e.message||'Sign in failed.','er');b.disabled=false;b.textContent='Sign In'}}
async function verifyCode(v){if(!isOtp(v)){$('#oer').textContent='The code must be exactly '+OTP_LENGTH+' digits.';return}const b=$('#ov');b.disabled=true;
 const {data,error}=await sb.auth.verifyOtp({email:cur.email,token:v,type:cur.mode=='signup'?'signup':'email'});b.disabled=false;
 if(error){$('#oer').textContent='That code is invalid or has expired.';const o=$('#ob');o.classList.remove('bad');void o.offsetWidth;o.classList.add('bad');return}
 const {data:p}=await sb.from('profiles').select('role,account_status').eq('id',data.user.id).single();
 if(!p||!p.role||p.account_status!=='active'){await sb.auth.signOut({scope:'local'});toast('Email verified. Your account is awaiting administrator approval.','ok');location.hash='landing';return}
 const k=K.find(x=>ROLES[x].db===p.role);toast('Welcome back.','ok');location.hash='dash-'+k}
async function guard(k){const {data:{session}}=await sb.auth.getSession();if(!session){toast('Please sign in first.','er');return null}
 const {data:p}=await sb.from('profiles').select('full_name,email,role,account_status').eq('id',session.user.id).single();
 if(!p||p.account_status!=='active'||p.role!==ROLES[k].db){toast('You do not have access to that area.','er');return null}p.id=session.user.id;return p}
async function loadUsers(){const el=$('#ul');if(!el)return;
 const {data,error}=await sb.from('profiles').select('id,full_name,email,role,requested_role,account_status,email_verified').order('created_at',{ascending:false});
 if(error){el.textContent=error.message;return}
 el.className='';el.style.cssText='width:100%;overflow-x:auto';
 el.innerHTML='<table style="width:100%;border-collapse:collapse;font-size:13.5px;text-align:left"><tr style="color:var(--mut)"><th style="padding:6px 8px">Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>'+data.map(u=>{const r=u.role||u.requested_role;const act=u.id==cur.me.id?'':u.account_status=='active'?`<button class="sec" data-uid="${u.id}" data-st="suspended">Suspend</button>`:r?`<button class="sec" data-uid="${u.id}" data-st="active">Approve as ${esc(r)}</button>`:'';return `<tr style="border-top:1px solid var(--bd)"><td style="padding:10px 8px">${esc(u.full_name)}</td><td>${esc(u.email)}${u.email_verified?'':' (unverified)'}</td><td>${esc(u.role||'requested: '+(u.requested_role||'none'))}</td><td>${u.account_status}</td><td>${act}</td></tr>`}).join('')+'</table>';
 el.onclick=async e=>{const b=e.target.closest('button[data-uid]');if(!b)return;const u=data.find(x=>x.id==b.dataset.uid);b.disabled=true;
  const {error}=await sb.rpc('admin_set_role',{target:u.id,new_role:u.role||u.requested_role,new_status:b.dataset.st});
  if(error){toast(error.message,'er');b.disabled=false;return}toast('User updated.','ok');loadUsers()}}

const CAN=()=>cur.me&&['admin','project_manager'].includes(cur.me.role);
const ST={planning:'Planning',active:'Active',on_hold:'On hold',completed:'Completed'};
const FS='width:100%;padding:12px 14px;border-radius:12px;background:var(--inp);border:1px solid var(--bd);color:var(--tx);font:inherit';
async function loadProjects(){const el=$('#pl');if(!el)return;const nb=$('#np');if(nb)nb.onclick=()=>projectForm();
 const {data,error}=await sb.from('projects').select('id,name,project_key,description,status,start_date,end_date,owner_id,created_at').order('created_at',{ascending:false});
 if(error){el.textContent=error.message;return}
 if(!data.length){el.innerHTML=I('folder')+'<b>No projects yet</b><span>'+(CAN()?'Create your first project to get started.':'Projects you are added to will appear here.')+'</span>';ico();return}
 el.className='';el.style.cssText='width:100%';
 el.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px">'+data.map(p=>`<button class="sec" style="text-align:left;display:flex;flex-direction:column;gap:6px" data-pid="${p.id}"><span style="display:flex;justify-content:space-between;gap:8px"><b>${esc(p.name)}</b><span class="kbd">${esc(p.project_key)}</span></span><span style="color:var(--mut);font-size:13px">${esc(p.description||'No description')}</span><span style="font-size:12px;color:var(--mut)">${ST[p.status]} · ${new Date(p.created_at).toLocaleDateString()}${p.owner_id==cur.me.id?' · yours':''}</span></button>`).join('')+'</div>';
 el.onclick=e=>{const b=e.target.closest('[data-pid]');if(b)openProject(data.find(x=>x.id==b.dataset.pid))}}
function projectForm(p){const ed=!!p;const m=modal(`<h3>${ed?'Edit project':'New project'}</h3><label for="pn">Project name</label><input id="pn" type="text" value="${ed?esc(p.name):''}"><label for="pk">Project key</label><input id="pk" type="text" maxlength="10" placeholder="e.g. NEXUS" value="${ed?esc(p.project_key):''}" ${ed?'disabled':''}><label for="pd2">Description</label><input id="pd2" type="text" value="${ed?esc(p.description):''}"><label for="ps">Status</label><select id="ps" style="${FS}">${Object.entries(ST).map(([k,v])=>`<option value="${k}" ${ed&&p.status==k?'selected':''}>${v}</option>`).join('')}</select><div style="display:flex;gap:10px"><div style="flex:1"><label for="sd">Start date</label><input id="sd" type="date" style="${FS}" value="${ed&&p.start_date||''}"></div><div style="flex:1"><label for="ed">End date</label><input id="ed" type="date" style="${FS}" value="${ed&&p.end_date||''}"></div></div><div class="err" id="fe2"></div><div style="display:flex;gap:10px;margin-top:18px"><button class="pri" id="sv">${ed?'Save changes':'Create project'}</button><button class="sec" data-close>Cancel</button></div>`);
 const g=i=>$('#'+i,m.o);g('sv').onclick=async()=>{const e=g('fe2');const v={name:g('pn').value.trim(),description:g('pd2').value.trim(),status:g('ps').value,start_date:g('sd').value||null,end_date:g('ed').value||null};const key=g('pk').value.trim().toUpperCase();let msg='';
  if(v.name.length<3)msg='Project name must be at least 3 characters.';else if(!ed&&!/^[A-Z][A-Z0-9]{1,9}$/.test(key))msg='Key: 2 to 10 letters or digits, starting with a letter.';else if(v.start_date&&v.end_date&&v.end_date<v.start_date)msg='End date must be after the start date.';
  e.textContent=msg;if(msg)return;g('sv').disabled=true;
  const r=ed?await sb.from('projects').update(v).eq('id',p.id).select():await sb.from('projects').insert({...v,project_key:key}).select();
  g('sv').disabled=false;
  if(r.error||!r.data.length){e.textContent=r.error?(r.error.code=='23505'?'That project key is already used.':r.error.message):'You are not allowed to do that.';return}
  m.close();toast(ed?'Project updated.':'Project created.','ok');loadProjects()}}
async function openProject(p){const mg=p.owner_id==cur.me.id||cur.me.role=='admin';
 const m=modal(`<h3>${esc(p.name)} <span class="kbd">${esc(p.project_key)}</span></h3><p style="color:var(--mut);margin:6px 0">${esc(p.description||'No description')}</p><p style="font-size:13px;color:var(--mut)">${ST[p.status]}${p.start_date?' · '+p.start_date:''}${p.end_date?' to '+p.end_date:''}</p><h4 style="margin:16px 0 6px">Team</h4><div id="tm" style="font-size:13.5px;color:var(--mut)">Loading…</div>${mg?'<label for="ae">Add member by email</label><div style="display:flex;gap:8px"><input id="ae" type="email" placeholder="member@company.com"><button class="sec" id="ab">Add</button></div>':''}<div class="err" id="pe"></div><div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">${mg?'<button class="pri" id="pg">Edit</button><button class="sec" id="pd">Delete</button>':''}<button class="sec" data-close>Close</button></div>`);
 const g=i=>$('#'+i,m.o);
 const team=async()=>{const {data,error}=await sb.rpc('project_team',{pid:p.id});g('tm').innerHTML=error?esc(error.message):(data||[]).map(u=>`<div>${esc(u.full_name||u.email)} · ${esc(u.role)} · ${esc(u.membership_role)}</div>`).join('')||'No members yet.'};team();
 if(mg){g('ab').onclick=async()=>{const e=g('pe');e.textContent='';const em=g('ae').value.trim();if(!mailRe.test(em)){e.textContent='Enter a valid email address.';return}const {error}=await sb.rpc('add_project_member',{pid:p.id,member_email:em});if(error){e.textContent=error.message;return}g('ae').value='';toast('Member added.','ok');team()};
  g('pg').onclick=()=>{m.close();projectForm(p)};
  let armed=false;g('pd').onclick=async()=>{if(!armed){armed=true;g('pd').textContent='Click again to confirm delete';return}const {data:d,error}=await sb.from('projects').delete().eq('id',p.id).select();if(error||!d.length){g('pe').textContent=error?error.message:'You are not allowed to delete this project.';return}m.close();toast('Project deleted.','ok');loadProjects()}}}

route();
