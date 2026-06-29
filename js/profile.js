// ── PROFILE SECTION NAV ───────────────────────────────────────────────────
function showProfileSection(id,btn){
  document.querySelectorAll('.profile-body>div').forEach(function(d){d.classList.remove('active');});
  document.querySelectorAll('.profile-sidenav-item').forEach(function(b){b.classList.remove('active');});
  var el=document.getElementById(id);
  if(el) el.classList.add('active');
  if(btn) btn.classList.add('active');
  if(id==='ps-calendar') initCalendar();
}

var editProfileMode=false;
function setEditProfile(on){
  editProfileMode=on;
  var view=document.getElementById('profileView');
  var edit=document.getElementById('profileEdit');
  var btn=document.getElementById('editProfileBtn');
  if(view) view.style.display=on?'none':'';
  if(edit) edit.style.display=on?'':'none';
  if(btn) btn.textContent=on?'Done':'Edit Profile';
  if(!on) initCalendar();
}
function toggleEditProfile(){ setEditProfile(!editProfileMode); }

// ── PROFILE ───────────────────────────────────────────────────────────────
var profileData=null, favourites=[], profileSearchTimer=null;

var SVG_FLAG='<svg viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>';
var SVG_CAL='<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
var SVG_TROPHY='<svg viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';
var SVG_STAR='<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
var SVG_MEDAL='<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>';
var SVG_TARGET='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>';
var SVG_ZAP='<svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
var ACHIEVEMENTS=[
  {id:'first_round',name:'First Round',desc:'Log your first round',icon:SVG_FLAG,check:function(r){return r.length>=1;}},
  {id:'ten_rounds',name:'10 Rounds',desc:'Log 10 rounds',icon:SVG_CAL,check:function(r){return r.length>=10;}},
  {id:'fifty_rounds',name:'50 Rounds',desc:'Log 50 rounds',icon:SVG_TROPHY,check:function(r){return r.length>=50;}},
  {id:'broke_90',name:'Broke 90',desc:'Score under 90',icon:SVG_STAR,check:function(r){return r.some(function(x){return x.score<90;});}},
  {id:'broke_80',name:'Broke 80',desc:'Score under 80',icon:SVG_MEDAL,check:function(r){return r.some(function(x){return x.score<80;});}},
  {id:'single_figures',name:'Single Figures',desc:'Reach a handicap under 10',icon:SVG_TARGET,check:function(r){var h=calcHcp(r);return h!==null&&h<10;}},
  {id:'scratch_diff',name:'Scratch Differential',desc:'Record a differential under 0',icon:SVG_ZAP,check:function(r){return r.some(function(x){return x.diff<0;});}}
];

async function loadProfile(){
  if(!currentUser) return;
  // Profile always opens in view mode
  setEditProfile(false);
  // Set display name and email
  var name=currentUser.user_metadata&&currentUser.user_metadata.display_name?currentUser.user_metadata.display_name:currentUser.email.split('@')[0];
  document.getElementById('profileName').textContent=name;
  document.getElementById('profileEmail').textContent=currentUser.email;
  var nameInput=document.getElementById('newDisplayName');
  if(nameInput) nameInput.value=name;
  // Handicap
  var hcp=calcHcp(rounds);
  document.getElementById('profileHcp').textContent=hcp!==null?(hcp<=0?'+'+Math.abs(hcp):hcp.toFixed(1)):'—';
  // Load profile from DB
  var pr=await sb.from('profiles').select('*').eq('id',currentUser.id).single();
  if(!pr.error&&pr.data) profileData=pr.data;
  else profileData={id:currentUser.id,is_public:true,home_course_name:null,home_course_id:null};
  // Avatar
  setAvatar(profileData.avatar_url||null);
  initAvatarUpload();
  // Set toggle
  updateToggleUI(profileData.is_public);
  // Share URL
  updateShareUrl(profileData.is_public);
  // Home course
  renderHomeCourse();
  // Favourites
  var fr=await sb.from('favourites').select('*').eq('user_id',currentUser.id).order('created_at');
  if(!fr.error&&fr.data) favourites=fr.data;
  renderFavourites();
  // Achievements, photos & calendar
  if(!rounds.length) await loadRounds();
  renderAchievements();
  loadMyPhotos();
  initCalendar();
}

function updateToggleUI(isPublic){
  var track=document.getElementById('toggleTrack');
  var thumb=document.getElementById('toggleThumb');
  var toggle=document.getElementById('profilePublicToggle');
  var label=document.getElementById('profileToggleLabel');
  if(!track) return;
  toggle.checked=isPublic;
  track.style.background=isPublic?'var(--gold)':'rgba(0,0,0,0.15)';
  thumb.style.transform=isPublic?'translateX(20px)':'translateX(0)';
  if(label) label.textContent=isPublic?'Profile is Public':'Profile is Private';
}

function updateShareUrl(isPublic){
  var wrap=document.getElementById('profileShareUrl');
  var link=document.getElementById('profileShareLink');
  if(isPublic){
    wrap.style.display='block';
    link.textContent=window.location.origin+window.location.pathname+'?profile='+currentUser.id;
  }else{
    wrap.style.display='none';
  }
}

async function toggleProfilePublic(){
  var newVal=document.getElementById('profilePublicToggle').checked;
  updateToggleUI(newVal);
  updateShareUrl(newVal);
  await sb.from('profiles').upsert({id:currentUser.id,is_public:newVal,display_name:(currentUser.user_metadata&&currentUser.user_metadata.display_name)||currentUser.email.split('@')[0]});
  toast(newVal?'Profile is now public ✓':'Profile is now private');
}

function copyProfileLink(){
  var link=document.getElementById('profileShareLink').textContent;
  navigator.clipboard.writeText(link).then(function(){
    toast('Profile link copied! ✓');
  });
}

function renderHomeCourse(){
  var el=document.getElementById('homeCourseDisplay');
  if(profileData&&profileData.home_course_name){
    el.innerHTML='<div class="home-course-card"><span class="home-course-name">'+profileData.home_course_name+'</span><button class="home-course-clear" id="homeClearBtn">✕</button></div>';
    el.style.display='block';
  }else{
    el.innerHTML='<div style="font-size:0.82rem;color:var(--text-muted);font-style:italic;margin-bottom:8px;">No home course set</div>';
  }
}

function renderFavourites(){
  var el=document.getElementById('favCoursesList');
  document.getElementById('favCount').textContent=favourites.length;
  if(!favourites.length){
    el.innerHTML='<div style="font-size:0.82rem;color:var(--text-muted);font-style:italic;margin-bottom:8px;">No favourites yet</div>';
    return;
  }
  el.innerHTML=favourites.map(function(f){
    return '<div class="fav-item">'+f.course_name+'<button class="fav-remove" data-id="'+f.id+'">✕</button></div>';
  }).join('');
}

// ── ONBOARDING ─────────────────────────────────────────────────────────────
var obStep=1, obSearchTimers={home:null,fav:null};

async function checkOnboarding(){
  // Never onboard someone who already has rounds (existing users / re-logins)
  if(rounds.length>0) return;
  var onboarded=false;
  try{
    var pr=await sb.from('profiles').select('onboarded').eq('id',currentUser.id).maybeSingle();
    onboarded=!!(pr.data&&pr.data.onboarded);
  }catch(e){}
  if(!onboarded) startOnboarding();
}

function startOnboarding(){
  if(!profileData) profileData={id:currentUser.id,is_public:true,home_course_name:null,home_course_id:null};
  var name=(currentUser.user_metadata&&currentUser.user_metadata.display_name)||currentUser.email.split('@')[0];
  document.getElementById('obName').value=name;
  renderObHome();
  renderObFavs();
  obGoStep(1);
  document.getElementById('onboardOverlay').style.display='block';
}

function obGoStep(n){
  obStep=n;
  for(var i=1;i<=3;i++){ document.getElementById('obStep'+i).style.display=(i===n?'block':'none'); }
  document.querySelectorAll('.ob-dot').forEach(function(d,i){ d.classList.toggle('active',i===(n-1)); });
  document.getElementById('obBackBtn').style.visibility=(n>1?'visible':'hidden');
  document.getElementById('obNextBtn').style.display=(n<3?'inline-flex':'none');
}

function obBack(){ if(obStep>1) obGoStep(obStep-1); }
function obNext(){
  if(obStep===1){ obSaveName(); obGoStep(2); }
  else if(obStep===2){ obGoStep(3); }
}

async function obSaveName(){
  var name=document.getElementById('obName').value.trim();
  if(!name) return;
  var cur=(currentUser.user_metadata&&currentUser.user_metadata.display_name)||'';
  if(name===cur) return;
  var r=await sb.auth.updateUser({data:{display_name:name}});
  await sb.from('profiles').upsert({id:currentUser.id,display_name:name});
  if(!r.error&&r.data){
    currentUser=r.data.user;
    document.getElementById('userPill').textContent=name;
    var dn=document.getElementById('drawerUserName'); if(dn) dn.textContent=name;
    var dsh=document.getElementById('dashUserName'); if(dsh) dsh.textContent=name;
  }
}

async function obSearchCourses(type,q){
  var dd=document.getElementById(type==='home'?'obHomeDropdown':'obFavDropdown');
  if(!q||q.length<2){dd.classList.remove('open');return;}
  dd.innerHTML='<div class="csearch-opt" style="color:#aaa;font-style:italic;cursor:default;font-size:0.82rem;">Searching…</div>';
  dd.classList.add('open');
  clearTimeout(obSearchTimers[type]);
  obSearchTimers[type]=setTimeout(async function(){
    var ql=q.toLowerCase();
    var r=await sb.from('courses').select('id,name,location').or('name.ilike.*'+ql+'*,location.ilike.*'+ql+'*').order('name').limit(8);
    if(!r.data||!r.data.length){dd.innerHTML='<div class="csearch-opt" style="color:#aaa;cursor:default;font-style:italic;font-size:0.82rem;">No courses found</div>';return;}
    window['_pc_'+type]=r.data; // reused by pickHomeCourse
    window['_ob_'+type]=r.data;
    dd.innerHTML=r.data.map(function(c){
      return '<div class="csearch-opt" data-idx="'+c.id+'" data-name="'+c.name.replace(/"/g,'&quot;')+'"><div class="copt-name">'+c.name+'</div><div class="copt-meta">'+c.location+'</div></div>';
    }).join('');
    dd.classList.add('open');
  },300);
}

function obPickHome(id){
  document.getElementById('obHomeDropdown').classList.remove('open');
  pickHomeCourse(id).then(renderObHome);
}
function obAddFav(id,name){
  document.getElementById('obFavDropdown').classList.remove('open');
  addFavourite(id,name).then(renderObFavs);
}
function obRemoveFav(id){ removeFavourite(id).then(renderObFavs); }
function obClearHome(){ clearHomeCourse().then(renderObHome); }

function renderObHome(){
  var el=document.getElementById('obHomeSelected');
  var inp=document.getElementById('obHomeSearch'); if(inp) inp.value='';
  if(!el) return;
  if(profileData&&profileData.home_course_name){
    el.style.display='block';
    el.innerHTML='<div class="selected-course"><span>'+profileData.home_course_name+'</span><button onclick="obClearHome()">✕</button></div>';
  } else { el.style.display='none'; el.innerHTML=''; }
}
function renderObFavs(){
  var el=document.getElementById('obFavList');
  var inp=document.getElementById('obFavSearch'); if(inp) inp.value='';
  if(!el) return;
  if(!favourites.length){ el.innerHTML=''; return; }
  el.innerHTML=favourites.map(function(f){
    return '<div class="fav-item">'+f.course_name+'<button class="fav-remove" onclick="obRemoveFav(\''+f.id+'\')">✕</button></div>';
  }).join('');
}

async function finishOnboarding(openLog){
  document.getElementById('onboardOverlay').style.display='none';
  try{
    await sb.from('profiles').upsert({id:currentUser.id,onboarded:true,display_name:(currentUser.user_metadata&&currentUser.user_metadata.display_name)||currentUser.email.split('@')[0]});
  }catch(e){}
  // Refresh dashboard so any home course / name changes show through
  renderAll();
  if(openLog) openLogModal();
}

function renderAchievements(){
  var earned=0;
  var html=ACHIEVEMENTS.map(function(a){
    var isEarned=a.check(rounds);
    if(isEarned) earned++;
    return '<div class="achievement-card '+(isEarned?'earned':'locked')+'">'+
      '<div class="achievement-icon">'+a.icon+'</div>'+
      '<div class="achievement-name">'+a.name+'</div>'+
      '<div class="achievement-desc">'+a.desc+'</div>'+
      (isEarned?'<div style="font-family:\'Inter\',sans-serif;font-size:0.6rem;font-weight:700;letter-spacing:0.04em;color:var(--gold);margin-top:6px;text-transform:uppercase;">Earned ✓</div>':'<div style="font-size:0.65rem;color:#bbb;margin-top:6px;">Locked</div>')+
    '</div>';
  }).join('');
  document.getElementById('achievementsList').innerHTML=html;
  document.getElementById('achievementCount').textContent=earned+' / '+ACHIEVEMENTS.length+' earned';
}

// Profile course search (home + favourites)
var profileSearchTimers={home:null,fav:null};
async function searchProfileCourses(type,q){
  var ddId=type==='home'?'homeCourseDropdown':'favCourseDropdown';
  var dd=document.getElementById(ddId);
  if(!q||q.length<2){dd.classList.remove('open');return;}
  dd.innerHTML='<div class="csearch-opt" style="color:#aaa;font-style:italic;cursor:default;font-size:0.82rem;">Searching…</div>';
  dd.classList.add('open');
  clearTimeout(profileSearchTimers[type]);
  profileSearchTimers[type]=setTimeout(async function(){
    var ql=q.toLowerCase();
    var r=await sb.from('courses').select('id,name,location').or('name.ilike.*'+ql+'*,location.ilike.*'+ql+'*').order('name').limit(8);
    if(!r.data||!r.data.length){dd.innerHTML='<div class="csearch-opt" style="color:#aaa;cursor:default;font-style:italic;font-size:0.82rem;">No courses found</div>';return;}
    window['_pc_'+type]=r.data;
    dd.innerHTML=r.data.map(function(c){
      return '<div class="csearch-opt" data-idx="'+c.id+'" data-name="'+c.name.replace(/"/g,'&quot;')+'"><div class="copt-name">'+c.name+'</div><div class="copt-meta">'+c.location+'</div></div>';
    }).join('');
    dd.classList.add('open');
  },300);
}

async function pickHomeCourse(id){
  var data=(window._pc_home||[]).find(function(x){return x.id===id;});
  if(!data) return;
  document.getElementById('homeCourseSearch').value='';
  document.getElementById('homeCourseDropdown').classList.remove('open');
  await sb.from('profiles').upsert({id:currentUser.id,home_course_id:id,home_course_name:data.name,display_name:(currentUser.user_metadata&&currentUser.user_metadata.display_name)||currentUser.email.split('@')[0]});
  profileData.home_course_name=data.name;
  profileData.home_course_id=id;
  renderHomeCourse();
  toast('Home course set to '+data.name+' ✓');
}

async function clearHomeCourse(){
  await sb.from('profiles').upsert({id:currentUser.id,home_course_id:null,home_course_name:null,display_name:(currentUser.user_metadata&&currentUser.user_metadata.display_name)||currentUser.email.split('@')[0]});
  profileData.home_course_name=null;
  profileData.home_course_id=null;
  renderHomeCourse();
  toast('Home course removed');
}

async function addFavourite(id,name){
  document.getElementById('favCourseSearch').value='';
  document.getElementById('favCourseDropdown').classList.remove('open');
  if(favourites.find(function(f){return f.course_id===id;})){toast('Already in favourites!');return;}
  var r=await sb.from('favourites').insert({user_id:currentUser.id,course_id:id,course_name:name}).select().single();
  if(r.error){toast('Error: '+r.error.message);return;}
  favourites.push(r.data);
  renderFavourites();
  toast(name+' added to favourites ⭐');
}

async function removeFavourite(id){
  var r=await sb.from('favourites').delete().eq('id',id);
  if(r.error){toast('Error removing.');return;}
  favourites=favourites.filter(function(f){return f.id!==id;});
  renderFavourites();
  toast('Removed from favourites');
}

