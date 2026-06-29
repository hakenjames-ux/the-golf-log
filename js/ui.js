// ── PHASE 6: VISUAL & POLISH ───────────────────────────────────────────────

// ── DARK MODE ─────────────────────────────────────────────────────────────
function initDarkMode(){
  var saved=localStorage.getItem('golflog_theme');
  if(saved==='dark') applyDark(true,false);
  document.getElementById('darkToggleBtn').addEventListener('click',function(){
    var isDark=document.documentElement.getAttribute('data-theme')==='dark';
    applyDark(!isDark,true);
  });
}
function applyDark(on,save){
  document.documentElement.setAttribute('data-theme',on?'dark':'light');
  document.getElementById('darkToggleBtn').textContent=on?'☀️':'🌙';
  if(save) localStorage.setItem('golflog_theme',on?'dark':'light');
}
setTimeout(initDarkMode,300);

// ── MOBILE NAV ────────────────────────────────────────────────────────────
// Bottom nav removed — header hamburger handles all navigation via mobileMenuNav

function toggleMobileMenu(){
  var d=document.getElementById('mobileMenuDrawer');
  var o=document.getElementById('mobileMenuOverlay');
  var open=d.style.display==='block';
  d.style.display=open?'none':'block';
  o.style.display=open?'none':'block';
}

function closeMobileMenu(){
  document.getElementById('mobileMenuDrawer').style.display='none';
  document.getElementById('mobileMenuOverlay').style.display='none';
}

function mobileMenuNav(section){
  closeMobileMenu();
  var desktopMap={dashboard:'navDashboard',courses:'navCourses',social:'navSocial',profile:'navProfile'};
  showSection(section,document.getElementById(desktopMap[section]));
}

// ── ANIMATED COUNTERS ─────────────────────────────────────────────────────
function animateCounter(el,target,duration,decimals,prefix){
  if(!el) return;
  el.classList.remove('animating');
  void el.offsetWidth;
  el.classList.add('animating');
  if(target==='—'||target===null){el.textContent='—';return;}
  var start=0,startTime=null;
  var numTarget=parseFloat(String(target).replace('+','').replace('E','0'));
  if(isNaN(numTarget)){el.textContent=target;return;}
  function step(ts){
    if(!startTime) startTime=ts;
    var progress=Math.min((ts-startTime)/duration,1);
    var ease=1-Math.pow(1-progress,3);
    var val=start+(numTarget-start)*ease;
    el.textContent=(prefix||'')+(decimals?val.toFixed(decimals):Math.round(val));
    if(progress<1) requestAnimationFrame(step);
    else el.textContent=target;
  }
  requestAnimationFrame(step);
}

// ── PDF / PRINT EXPORT ────────────────────────────────────────────────────
function exportStatsPDF(){
  var name=(currentUser&&currentUser.user_metadata&&currentUser.user_metadata.display_name)||
    (currentUser?currentUser.email.split('@')[0]:'Golfer');
  var hcp=calcHcp(rounds);
  var hcpStr=hcp!==null?(hcp<=0?'+'+Math.abs(hcp):hcp.toFixed(1)):'N/A';
  var scores=rounds.map(function(r){return r.score;});
  var avgScore=scores.length?Math.round(scores.reduce(function(a,b){return a+b;},0)/scores.length):'—';
  var bestScore=scores.length?Math.min.apply(null,scores):'—';
  var printWin=window.open('','_blank');
  printWin.document.write('<!DOCTYPE html><html><head><title>Golf Log Stats — '+name+'</title>');
  printWin.document.write('<style>');
  printWin.document.write('body{font-family:Georgia,serif;color:#0f2419;background:white;padding:32px;max-width:800px;margin:0 auto;}');
  printWin.document.write('h1{font-size:2rem;margin-bottom:4px;}');
  printWin.document.write('.sub{color:#7a9a8a;font-size:0.85rem;margin-bottom:28px;}');
  printWin.document.write('.gold-bar{height:3px;background:linear-gradient(90deg,#c9a84c,#e8c97a,#c9a84c);margin-bottom:28px;}');
  printWin.document.write('.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;}');
  printWin.document.write('.stat-box{border:1px solid #dce8e2;border-radius:2px;padding:16px;text-align:center;}');
  printWin.document.write('.stat-val{font-size:2rem;font-weight:700;color:#0f2419;}');
  printWin.document.write('.stat-lbl{font-size:0.65rem;text-transform:uppercase;letter-spacing:0.05em;color:#7a9a8a;margin-top:4px;}');
  printWin.document.write('.hcp-box{background:#0f2419;color:white;border-radius:2px;padding:20px;text-align:center;margin-bottom:28px;}');
  printWin.document.write('.hcp-val{font-size:3.5rem;font-weight:700;}');
  printWin.document.write('.hcp-lbl{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.06em;opacity:0.6;margin-top:4px;}');
  printWin.document.write('table{width:100%;border-collapse:collapse;font-size:0.82rem;}');
  printWin.document.write('th{background:#f2f6f4;padding:8px 12px;text-align:left;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.04em;color:#7a9a8a;border-bottom:2px solid #dce8e2;}');
  printWin.document.write('td{padding:9px 12px;border-bottom:1px solid #dce8e2;}');
  printWin.document.write('tr:last-child td{border-bottom:none;}');
  printWin.document.write('.footer{margin-top:32px;text-align:center;font-size:0.72rem;color:#7a9a8a;border-top:1px solid #dce8e2;padding-top:16px;}');
  printWin.document.write('</style></head><body>');
  printWin.document.write('<h1>'+name+'\'s Golf Stats</h1>');
  printWin.document.write('<div class="sub">Generated '+new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})+' · The Golf Log</div>');
  printWin.document.write('<div class="gold-bar"></div>');
  printWin.document.write('<div class="hcp-box"><div class="hcp-val">'+hcpStr+'</div><div class="hcp-lbl">WHS Handicap Index</div></div>');
  printWin.document.write('<div class="stats-grid">');
  var statsData=[
    {val:rounds.length,lbl:'Rounds Played'},
    {val:bestScore,lbl:'Best Score'},
    {val:avgScore,lbl:'Avg Score'},
    {val:rounds.length?(Math.min.apply(null,rounds.map(function(r){return r.diff;})).toFixed(1)):'—',lbl:'Best Differential'}
  ];
  statsData.forEach(function(s){
    printWin.document.write('<div class="stat-box"><div class="stat-val">'+s.val+'</div><div class="stat-lbl">'+s.lbl+'</div></div>');
  });
  printWin.document.write('</div>');
  printWin.document.write('<h2 style="font-size:1.1rem;margin-bottom:12px;color:#1a3a2a;">Round History</h2>');
  printWin.document.write('<table><thead><tr><th>Course</th><th>Date</th><th>Score</th><th>+/−</th><th>Differential</th></tr></thead><tbody>');
  rounds.slice().reverse().forEach(function(r){
    var ov=r.score-r.par,ovS=ov===0?'E':(ov>0?'+'+ov:''+ov);
    printWin.document.write('<tr><td>'+r.course+'</td><td>'+fDate(r.date)+'</td><td><strong>'+r.score+'</strong></td><td>'+ovS+'</td><td>'+parseFloat(r.diff).toFixed(1)+'</td></tr>');
  });
  printWin.document.write('</tbody></table>');
  printWin.document.write('<div class="footer">The Golf Log · Printed '+new Date().toLocaleDateString('en-GB')+'</div>');
  printWin.document.write('</body></html>');
  printWin.document.close();
  setTimeout(function(){printWin.print();},500);
}

// ── PHASE 7: COMMUNITY ────────────────────────────────────────────────────
var challengeOpponent_=null, challengeCourse_=null, currentTourney_=null, memberSearchTimer=null, challengeCourseTimer=null;


// ── ACTIVITY FEED ─────────────────────────────────────────────────────────
async function loadFeed(){
  var el=document.getElementById('feedList');
  el.innerHTML=skel(4,96);

  var query=sb.from('rounds').select('id,user_id,course,score,par,diff,date,holes_played,notes').order('date',{ascending:false}).limit(50);

  // Following filter
  if(feedFilter==='following'){
    var uidsToShow=Array.from(followingSet);
    uidsToShow.push(currentUser.id); // always show own rounds
    if(uidsToShow.length===1&&followingSet.size===0){
      el.innerHTML=emptyState(
        '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        'Your feed is waiting',
        'Follow other golfers and their rounds will show up here.',
        '<button class="log-btn" onclick="showSocialTab(\'sfMembers\')" style="width:auto;padding:11px 28px;">Find Members</button>'
      );
      return;
    }
    query=query.in('user_id',uidsToShow);
  }

  var r=await query;
  if(r.error||!r.data||!r.data.length){
    el.innerHTML=emptyState(
      '<svg viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
      feedFilter==='following'?'Quiet out there':'No activity yet',
      feedFilter==='following'?'No rounds yet from people you follow — check back after the weekend.':'Be the first to log a round and get the feed going.',
      ''
    );
    return;
  }

  // Get profiles (avatar + name)
  var uids=[...new Set(r.data.map(function(x){return x.user_id;}))];
  var profiles={};
  var pr=await sb.from('profiles').select('id,display_name,avatar_url').in('id',uids);
  if(pr.data) pr.data.forEach(function(p){profiles[p.id]=p;});

  // Get like counts
  var roundIds=r.data.map(function(x){return x.id;});
  var likeCounts={};
  var lc=await sb.from('round_likes').select('round_id').in('round_id',roundIds);
  (lc.data||[]).forEach(function(l){ likeCounts[l.round_id]=(likeCounts[l.round_id]||0)+1; });
  await loadLikes(roundIds);

  el.innerHTML=r.data.map(function(round){
    var prof=profiles[round.user_id]||{};
    var name=prof.display_name||(round.user_id===currentUser.id?((currentUser.user_metadata&&currentUser.user_metadata.display_name)||'You'):'Golfer');
    var init=name.charAt(0).toUpperCase();
    var isYou=round.user_id===currentUser.id;
    var ov=round.score-round.par,ovS=ov===0?'E':(ov>0?'+'+ov:''+ov);
    var ovCol=ov<0?'var(--under)':ov>0?'var(--over)':'var(--gold)';
    var lc=likeCounts[round.id]||0;
    var isLiked=likedRounds.has(round.id);
    var avatarHtml=prof.avatar_url
      ?'<img src="'+prof.avatar_url+'" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'">'
      :'<div class="feed-avatar">'+init+'</div>';
    var followBtn=(!isYou)?'<button class="follow-btn'+(followingSet.has(round.user_id)?' following':'')+'" data-id="'+round.user_id+'" style="font-family:\'Inter\',sans-serif;font-size:0.62rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;padding:3px 10px;border-radius:2px;cursor:pointer;border:1px solid var(--border);background:var(--panel);color:var(--text-mid);transition:all 0.15s;">'+(followingSet.has(round.user_id)?'Following':'Follow')+'</button>':'';
    return '<div class="feed-item" style="flex-direction:column;align-items:stretch;gap:0;padding:0;border-radius:var(--radius);border:1px solid var(--border);margin-bottom:12px;overflow:hidden;">'+
      '<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;">'+
        avatarHtml+
        '<div style="flex:1;">'+
          '<div style="display:flex;align-items:center;gap:8px;">'+
            '<span class="feed-name">'+name+(isYou?' <span style="font-size:0.62rem;color:var(--gold);">(you)</span>':'')+'</span>'+
            followBtn+
          '</div>'+
          '<div class="feed-detail">'+round.course+' · '+fDate(round.date)+(round.holes_played===9?' · 9H':'')+'</div>'+
        '</div>'+
        '<div style="text-align:right;flex-shrink:0;">'+
          '<div style="font-family:\'Inter\',serif;font-size:1.8rem;font-weight:700;color:var(--augusta-deep);line-height:1;">'+round.score+'</div>'+
          '<div style="font-size:0.72rem;font-weight:700;color:'+ovCol+';">'+ovS+'</div>'+
        '</div>'+
      '</div>'+
      (round.notes?'<div style="padding:0 16px 12px;font-size:0.85rem;color:var(--text-mid);font-style:italic;line-height:1.5;border-top:1px solid var(--border);padding-top:10px;margin-top:0;">'+round.notes+'</div>':'')+
      '<div style="display:flex;align-items:center;gap:16px;padding:10px 16px;border-top:1px solid var(--border);background:var(--panel);">'+
        '<button class="like-btn'+(isLiked?' liked':'')+'" data-id="'+round.id+'" data-count="'+lc+'" style="display:flex;align-items:center;gap:5px;background:none;border:none;cursor:pointer;font-size:0.82rem;color:'+(isLiked?'var(--over)':'var(--text-muted)')+';font-weight:600;padding:0;transition:color 0.15s;">'+(isLiked?'♥':'♡')+' '+lc+'</button>'+
        '<span style="font-size:0.72rem;color:var(--text-muted);">Diff '+parseFloat(round.diff).toFixed(1)+'</span>'+
      '</div>'+
    '</div>';
  }).join('');
}

// ── CHALLENGES ────────────────────────────────────────────────────────────
async function searchMembers(q){
  var dd=document.getElementById('challengeOpponentDropdown');
  if(!q||q.length<2){dd.classList.remove('open');return;}
  dd.innerHTML='<div class="csearch-opt" style="color:#aaa;font-style:italic;cursor:default;font-size:0.82rem;">Searching…</div>';
  dd.classList.add('open');
  clearTimeout(memberSearchTimer);
  memberSearchTimer=setTimeout(async function(){
    var r=await sb.from('profiles').select('id,display_name').ilike('display_name','*'+q+'*').neq('id',currentUser.id).limit(8);
    if(!r.data||!r.data.length){dd.innerHTML='<div class="csearch-opt" style="color:#aaa;cursor:default;font-style:italic;font-size:0.82rem;">No members found</div>';return;}
    window._memberCache=r.data;
    dd.innerHTML=r.data.map(function(m){
      return '<div class="csearch-opt" data-member-id="'+m.id+'" data-member-name="'+m.display_name+'"><div class="copt-name">'+m.display_name+'</div></div>';
    }).join('');
    dd.classList.add('open');
  },300);
}

document.addEventListener('click',function(e){
  var mo=e.target.closest('#challengeOpponentDropdown .csearch-opt');
  if(mo&&mo.dataset.memberId){
    challengeOpponent_={id:mo.dataset.memberId,name:mo.dataset.memberName};
    document.getElementById('challengeOpponentSearch').value='';
    document.getElementById('challengeOpponentDropdown').classList.remove('open');
    document.getElementById('challengeOpponentName').textContent=mo.dataset.memberName;
    document.getElementById('challengeOpponentSelected').style.display='block';
    return;
  }
  var cc=e.target.closest('#challengeCourseDropdown .csearch-opt');
  if(cc&&cc.dataset.idx){
    var course=(window._challengeCourseCache||[]).find(function(x){return x.id===cc.dataset.idx;});
    if(course){
      challengeCourse_=course;
      document.getElementById('challengeCourseSearch').value='';
      document.getElementById('challengeCourseDropdown').classList.remove('open');
      document.getElementById('challengeCourseName').textContent=course.name;
      document.getElementById('challengeCourseSelected').style.display='block';
    }
    return;
  }
});

async function searchChallengeCourse(q){
  var dd=document.getElementById('challengeCourseDropdown');
  if(!q||q.length<2){dd.classList.remove('open');return;}
  dd.innerHTML='<div class="csearch-opt" style="color:#aaa;font-style:italic;cursor:default;font-size:0.82rem;">Searching…</div>';
  dd.classList.add('open');
  clearTimeout(challengeCourseTimer);
  challengeCourseTimer=setTimeout(async function(){
    var r=await sb.from('courses').select('id,name,location').or('name.ilike.*'+q+'*,location.ilike.*'+q+'*').order('name').limit(8);
    if(!r.data||!r.data.length){dd.innerHTML='<div class="csearch-opt" style="color:#aaa;cursor:default;font-style:italic;font-size:0.82rem;">No courses found</div>';return;}
    window._challengeCourseCache=r.data;
    dd.innerHTML=r.data.map(function(c){
      return '<div class="csearch-opt" data-idx="'+c.id+'"><div class="copt-name">'+c.name+'</div><div class="copt-meta">'+c.location+'</div></div>';
    }).join('');
    dd.classList.add('open');
  },300);
}

function clearChallengeOpponent(){challengeOpponent_=null;document.getElementById('challengeOpponentSearch').value='';document.getElementById('challengeOpponentSelected').style.display='none';}
function clearChallengeCourse(){challengeCourse_=null;document.getElementById('challengeCourseSearch').value='';document.getElementById('challengeCourseSelected').style.display='none';}

async function issueChallenge(){
  if(!challengeOpponent_){toast('Please select an opponent.');return;}
  if(!challengeCourse_){toast('Please select a course.');return;}
  var myScore=parseInt(document.getElementById('challengeMyScore').value);
  if(isNaN(myScore)||myScore<50||myScore>150){toast('Please enter a valid score to beat.');return;}
  var format=document.getElementById('challengeFormat').value;
  var myName=(currentUser.user_metadata&&currentUser.user_metadata.display_name)||currentUser.email.split('@')[0];
  var r=await sb.from('challenges').insert({
    challenger_id:currentUser.id,challenger_name:myName,
    opponent_id:challengeOpponent_.id,opponent_name:challengeOpponent_.name,
    course_id:challengeCourse_.id,course_name:challengeCourse_.name,
    challenger_score:myScore,format:format,status:'pending'
  });
  if(r.error){toast('Error: '+r.error.message);return;}
  clearChallengeOpponent();clearChallengeCourse();
  document.getElementById('challengeMyScore').value='';
  toast('Challenge issued to '+challengeOpponent_.name+'');
  loadChallenges();
}

async function loadChallenges(){
  var incoming=document.getElementById('incomingChallengesList');
  var mine=document.getElementById('myChallengesList');
  var r=await sb.from('challenges').select('*').or('challenger_id.eq.'+currentUser.id+',opponent_id.eq.'+currentUser.id).order('created_at',{ascending:false});
  var challenges=r.data||[];
  var inc=challenges.filter(function(c){return c.opponent_id===currentUser.id&&c.status==='pending';});
  var my=challenges.filter(function(c){return c.challenger_id===currentUser.id;});
  incoming.innerHTML=inc.length?inc.map(function(c){
    return '<div class="challenge-card">'+
      '<div class="challenge-vs">'+c.challenger_name+' challenges you</div>'+
      '<div class="challenge-meta">'+c.course_name+' · Beat '+c.challenger_score+' · '+c.format+'</div>'+
      '<div style="display:flex;gap:8px;margin-top:10px;">'+
        '<button class="accept-challenge-btn log-btn" data-id="'+c.id+'" style="flex:1;padding:8px;font-size:0.72rem;">Accept</button>'+
        '<button class="decline-challenge-btn log-btn" data-id="'+c.id+'" style="flex:1;padding:8px;font-size:0.72rem;background:var(--danger);">Decline</button>'+
      '</div>'+
    '</div>';
  }).join(''):'<div style="color:var(--text-muted);font-style:italic;font-size:0.85rem;">No incoming challenges.</div>';
  mine.innerHTML=my.length?my.map(function(c){
    var statusCls='challenge-status-'+c.status;
    var statusLabel=c.status==='pending'?'PENDING':c.status==='accepted'?'ACCEPTED':c.status==='declined'?'DECLINED':c.status.toUpperCase();
    return '<div class="challenge-card">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;">'+
        '<div class="challenge-vs">vs '+c.opponent_name+'</div>'+
        '<span class="'+statusCls+'">'+statusLabel+'</span>'+
      '</div>'+
      '<div class="challenge-meta">'+c.course_name+' · Your score: '+c.challenger_score+' · '+c.format+'</div>'+
    '</div>';
  }).join(''):'<div style="color:var(--text-muted);font-style:italic;font-size:0.85rem;">No challenges issued yet.</div>';
}

async function respondChallenge(id,status){
  await sb.from('challenges').update({status:status}).eq('id',id);
  toast(status==='accepted'?'Challenge accepted!':'Challenge declined.');
  loadChallenges();
}

// ── TOURNAMENTS ───────────────────────────────────────────────────────────
async function loadTournaments(){
  var el=document.getElementById('activeTourneyList');
  var r=await sb.from('tournaments').select('*').order('start_date',{ascending:false}).limit(20);
  var tourneys=r.data||[];
  if(!tourneys.length){el.innerHTML='<div style="color:var(--text-muted);font-style:italic;font-size:0.85rem;">No tournaments yet. Create one!</div>';return;}
  el.innerHTML=tourneys.map(function(t){
    var active=new Date(t.end_date)>=new Date();
    return '<div class="tourney-card" data-id="'+t.id+'" data-name="'+t.name+'" data-dates="'+fDate(t.start_date)+' – '+fDate(t.end_date)+'" data-format="'+t.format+'">'+
      '<div style="width:40px;height:40px;background:'+(active?'var(--gold)':'var(--panel)')+';border-radius:2px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#0d0e10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></div>'+
      '<div>'+
        '<div class="tourney-name">'+t.name+'</div>'+
        '<div class="tourney-meta">'+fDate(t.start_date)+' – '+fDate(t.end_date)+' · '+t.format+(active?' · <span style="color:var(--under);font-weight:700;">ACTIVE</span>':' · Ended')+'</div>'+
      '</div>'+
    '</div>';
  }).join('');
}

async function createTourney(){
  var name=document.getElementById('tourneyName').value.trim();
  var start=document.getElementById('tourneyStart').value;
  var end=document.getElementById('tourneyEnd').value;
  var format=document.getElementById('tourneyFormat').value;
  if(!name||!start||!end){toast('Please fill in all fields.');return;}
  var r=await sb.from('tournaments').insert({name:name,start_date:start,end_date:end,format:format,created_by:currentUser.id});
  if(r.error){toast('Error: '+r.error.message);return;}
  document.getElementById('tourneyName').value='';
  toast('Tournament "'+name+'" created ✓');
  loadTournaments();
}

async function openTourney(id,name,dates,format){
  currentTourney_={id:id,name:name,format:format};
  document.getElementById('tourneyDetail').style.display='block';
  document.getElementById('tourneyDetailName').textContent=name;
  document.getElementById('tourneyDetailDates').textContent=dates+' · '+format;
  // Populate round selector
  var sel=document.getElementById('tourneyRoundSelect');
  sel.innerHTML=rounds.slice().reverse().map(function(r){
    return '<option value="'+r.id+'">'+r.course+' · '+fDate(r.date)+' · '+r.score+'</option>';
  }).join('');
  // Load leaderboard
  await loadTourneyLb(id,format);
  // Check my entry
  var me=await sb.from('tournament_entries').select('*').eq('tournament_id',id).eq('user_id',currentUser.id).single();
  if(!me.error&&me.data){
    var entry=me.data;
    document.getElementById('tourneyMyEntry').style.display='block';
    document.getElementById('tourneyMyEntry').innerHTML='<strong>Your entry:</strong> Score '+entry.score+(entry.stableford_points?' · '+entry.stableford_points+' pts':'');
  }
}

async function loadTourneyLb(id,format){
  var r=await sb.from('tournament_entries').select('*').eq('tournament_id',id).order(format==='stableford'?'stableford_points':'score',{ascending:format!=='stableford'});
  var entries=r.data||[];
  var lbEl=document.getElementById('tourneyLbBody');
  if(!entries.length){lbEl.innerHTML='<div class="lb-empty">No entries yet.</div>';return;}
  var rc=['r1','r2','r3'];
  lbEl.innerHTML=entries.map(function(e,i){
    var isYou=e.user_id===currentUser.id;
    var val=format==='stableford'?(e.stableford_points||'—')+'pts':e.score;
    return '<div class="lb-row"><div class="lb-rank-num '+(rc[i]||'')+'">'+(i+1)+'</div><div class="lb-player">'+e.display_name+(isYou?'<span class="lb-you-tag">(you)</span>':'')+'</div><div class="lb-hcp-num">'+val+'</div></div>';
  }).join('');
}

function closeTourneyDetail(){
  document.getElementById('tourneyDetail').style.display='none';
  currentTourney_=null;
}

async function submitTourneyScore(){
  if(!currentTourney_){toast('No tournament selected.');return;}
  var roundId=document.getElementById('tourneyRoundSelect').value;
  var round=rounds.find(function(r){return r.id===roundId;});
  if(!round){toast('Round not found.');return;}
  var dname=(currentUser.user_metadata&&currentUser.user_metadata.display_name)||currentUser.email.split('@')[0];
  var r=await sb.from('tournament_entries').upsert({
    tournament_id:currentTourney_.id,user_id:currentUser.id,display_name:dname,
    score:round.score,stableford_points:round.stableford_points||null,round_id:roundId
  });
  if(r.error){toast('Error: '+r.error.message);return;}
  toast('Score submitted ✓');
  document.getElementById('tourneyMyEntry').style.display='block';
  document.getElementById('tourneyMyEntry').innerHTML='<strong>Your entry:</strong> Score '+round.score+(round.stableford_points?' · '+round.stableford_points+' pts':'');
  await loadTourneyLb(currentTourney_.id,currentTourney_.format);
}

// ── PHASE 8: PRACTICAL TOOLS ──────────────────────────────────────────────

// ── BAG TRACKER ───────────────────────────────────────────────────────────
var bagState={};

function initBagTracker(){
  var saved=localStorage.getItem('golflog_bag');
  if(saved){try{bagState=JSON.parse(saved);}catch(e){bagState={};}}
  renderBag();
}

function renderBag(){
  var grid=document.getElementById('bagGrid');
  if(!grid) return;
  var clubs=Object.keys(bagState).filter(function(c){return bagState[c];});
  var countEl=document.getElementById('bagCount');
  if(countEl) countEl.textContent=clubs.length+' club'+(clubs.length!==1?'s':'');
  if(!clubs.length){
    grid.innerHTML='<div style="font-size:0.82rem;color:var(--text-muted);font-style:italic;">No clubs added yet — type your exact club name below and click Add Club.</div>';
    return;
  }
  grid.innerHTML=clubs.map(function(c){
    return '<div class="bag-club in-bag" data-club="'+c+'" title="Click to remove">'+c+'</div>';
  }).join('');
}

function toggleClub(club){
  // Clicking removes the club
  delete bagState[club];
  localStorage.setItem('golflog_bag',JSON.stringify(bagState));
  renderBag();
  toast(club+' removed from bag');
}

function addCustomClub(){
  var name=document.getElementById('customClubInput').value.trim();
  if(!name){toast('Please enter a club name.');return;}
  if(bagState[name]){toast('That club is already in your bag.');return;}
  bagState[name]=true;
  localStorage.setItem('golflog_bag',JSON.stringify(bagState));
  document.getElementById('customClubInput').value='';
  renderBag();
  toast(name+' added to bag ✓');
}

// ── TEE TIME REMINDERS ────────────────────────────────────────────────────
var reminders=[];

function initReminders(){
  var saved=localStorage.getItem('golflog_reminders');
  if(saved){try{reminders=JSON.parse(saved);}catch(e){reminders=[];}}
  renderReminders();
  // Check notification permission
  if('Notification' in window){
    var statusEl=document.getElementById('notifStatus');
    if(statusEl) statusEl.textContent=Notification.permission==='granted'?'✓ Notifications on':Notification.permission==='denied'?'Blocked':'Not enabled';
    // Schedule any pending reminders
    reminders.forEach(function(r){scheduleNotification(r);});
  }
}

function setTeeReminder(){
  var course=document.getElementById('reminderCourse').value.trim();
  var time=document.getElementById('reminderTime').value;
  var before=parseInt(document.getElementById('reminderBefore').value);
  if(!course||!time){toast('Please enter a course and tee time.');return;}
  var teeTime=new Date(time);
  if(teeTime<=new Date()){toast('Tee time must be in the future.');return;}
  if(!('Notification' in window)){toast('Notifications not supported in this browser.');return;}
  Notification.requestPermission().then(function(perm){
    if(perm!=='granted'){toast('Please allow notifications to set reminders.');return;}
    var reminder={id:Date.now().toString(),course:course,teeTime:teeTime.toISOString(),before:before};
    reminders.push(reminder);
    localStorage.setItem('golflog_reminders',JSON.stringify(reminders));
    scheduleNotification(reminder);
    document.getElementById('reminderCourse').value='';
    document.getElementById('reminderTime').value='';
    renderReminders();
    toast('Reminder set for '+course+' ⏰');
    document.getElementById('notifStatus').textContent='✓ Notifications on';
  });
}

function scheduleNotification(reminder){
  var teeTime=new Date(reminder.teeTime);
  var notifyAt=new Date(teeTime.getTime()-reminder.before*60*1000);
  var delay=notifyAt.getTime()-Date.now();
  if(delay<=0) return;
  setTimeout(function(){
    if(Notification.permission==='granted'){
      new Notification('Tee Time Reminder',{
        body:'You tee off at '+reminder.course+' in '+reminder.before+' minutes!',
        icon:'/favicon.ico'
      });
    }
  },delay);
}

function deleteReminder(id){
  reminders=reminders.filter(function(r){return r.id!==id;});
  localStorage.setItem('golflog_reminders',JSON.stringify(reminders));
  renderReminders();
  toast('Reminder removed.');
}

function renderReminders(){
  var el=document.getElementById('activeReminders');
  if(!el) return;
  var future=reminders.filter(function(r){return new Date(r.teeTime)>new Date();});
  if(!future.length){el.innerHTML='<div style="font-size:0.78rem;color:var(--text-muted);font-style:italic;">No upcoming reminders.</div>';return;}
  el.innerHTML=future.map(function(r){
    var t=new Date(r.teeTime);
    var timeStr=t.toLocaleDateString('en-GB',{day:'numeric',month:'short'})+' at '+t.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    return '<div class="reminder-item">'+
      '<div class="reminder-item-name">'+r.course+'</div>'+
      '<div class="reminder-item-time">'+timeStr+' (−'+r.before+'min)</div>'+
      '<button class="reminder-delete" data-id="'+r.id+'">✕</button>'+
    '</div>';
  }).join('');
}

// Init on boot
function initPhase8(){
  initReminders();
}

// ── PHASE 9: ACCOUNT ──────────────────────────────────────────────────────

async function saveDisplayName(){
  var name=document.getElementById('newDisplayName').value.trim();
  if(!name){toast('Please enter a display name.');return;}
  var btn=document.getElementById('saveDisplayNameBtn');
  btn.innerHTML='<span class="spinner"></span>';btn.disabled=true;
  // Update Supabase Auth metadata
  var r=await sb.auth.updateUser({data:{display_name:name}});
  // Update profiles table
  await sb.from('profiles').upsert({id:currentUser.id,display_name:name});
  btn.innerHTML='Save';btn.disabled=false;
  if(r.error){toast('Error: '+r.error.message);return;}
  currentUser=r.data.user;
  document.getElementById('userPill').textContent=name;
  document.getElementById('profileName').textContent=name;
  toast('Display name updated to "'+name+'" ✓');
}

async function changePassword(){
  var pass=document.getElementById('newPassword').value;
  var confirm=document.getElementById('confirmPassword').value;
  if(!pass||pass.length<6){toast('Password must be at least 6 characters.');return;}
  if(pass!==confirm){toast('Passwords do not match.');return;}
  var btn=document.getElementById('changePasswordBtn');
  btn.innerHTML='<span class="spinner"></span>Updating…';btn.disabled=true;
  var r=await sb.auth.updateUser({password:pass});
  btn.innerHTML='Change Password';btn.disabled=false;
  if(r.error){toast('Error: '+r.error.message);return;}
  document.getElementById('newPassword').value='';
  document.getElementById('confirmPassword').value='';
  toast('Password changed successfully ✓');
}

function exportCsv(){
  if(!rounds.length){toast('No rounds to export.');return;}
  var headers=['Course','Date','Holes','Par','Score','+/-','Differential','Rating','Slope','Putts','Fairways Hit','GIR','Penalties','Stableford','Avg Drive'];
  var rows=rounds.map(function(r){
    return [
      '"'+(r.course||'').replace(/"/g,'""')+'"',
      r.date,
      r.holes_played||18,
      r.par,
      r.score,
      r.score-r.par,
      parseFloat(r.diff).toFixed(1),
      r.rating||'',
      r.slope||'',
      r.putts||'',
      r.fairways_hit||'',
      r.greens_in_regulation||'',
      r.penalties||'',
      r.stableford_points||'',
      r.avg_driving_distance||''
    ].join(',');
  });
  var csv=[headers.join(',')].concat(rows).join('\n');
  var blob=new Blob([csv],{type:'text/csv'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='golf-log-rounds-'+new Date().toISOString().split('T')[0]+'.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast('Rounds exported as CSV ✓');
}

async function exportFullProfile(){
  var name=(currentUser.user_metadata&&currentUser.user_metadata.display_name)||currentUser.email.split('@')[0];
  var hcp=calcHcp(rounds);
  // Fetch favourites
  var fr=await sb.from('favourites').select('course_name').eq('user_id',currentUser.id);
  var favs=(fr.data||[]).map(function(f){return f.course_name;});
  // Fetch profile
  var pr=await sb.from('profiles').select('*').eq('id',currentUser.id).single();
  var profile=pr.data||{};
  var data={
    exported:new Date().toISOString(),
    name:name,
    email:currentUser.email,
    handicap_index:hcp,
    home_course:profile.home_course_name||null,
    favourite_courses:favs,
    rounds_played:rounds.length,
    best_score:rounds.length?Math.min.apply(null,rounds.map(function(r){return r.score;})):null,
    rounds:rounds.map(function(r){return{course:r.course,date:r.date,score:r.score,par:r.par,diff:r.diff,holes:r.holes_played||18};})
  };
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='golf-log-profile-'+new Date().toISOString().split('T')[0]+'.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Full profile exported ✓');
}

async function deleteAccount(){
  if(!confirm('Are you sure? This will permanently delete your account and ALL your data including rounds, favourites and profile. This CANNOT be undone.')){return;}
  var confirm2=prompt('Type DELETE to confirm:');
  if(confirm2!=='DELETE'){toast('Account deletion cancelled.');return;}
  toast('Deleting your account…');
  try{
    // Fully removes data + the auth user via the service-role edge function.
    var res=await sb.functions.invoke('delete-account',{method:'POST'});
    if(res.error){ throw res.error; }
    await sb.auth.signOut();
    toast('Your account and all data have been permanently deleted.');
  }catch(e){
    console.error('delete-account failed:',e);
    toast('Could not delete your account. Please email support@logmygolf.com.');
  }
}

// ── NAV & UTILS ───────────────────────────────────────────────────────────
var SECTIONS=['dashboard','courses','stats','social','profile'];

function showSection(s,btn,skipHistory){
  if(SECTIONS.indexOf(s)===-1) s='dashboard';
  SECTIONS.forEach(function(x){
    document.getElementById('section-'+x).style.display=x===s?'':'none';
  });
  document.querySelectorAll('.nav-item').forEach(function(b){b.classList.remove('active');});
  // Highlight matching nav button (Stats has no nav button — Home stays lit)
  if(btn){ btn.classList.add('active'); }
  else {
    var map={dashboard:'navDashboard',courses:'navCourses',social:'navSocial',profile:'navProfile',stats:'navDashboard'};
    var nb=document.getElementById(map[s]); if(nb) nb.classList.add('active');
  }
  // Update URL hash
  if(!skipHistory) history.pushState({section:s},'','#'+s);
  if(s==='courses') renderCoursesBrowser();
  if(s==='stats'){ loadRounds().then(function(){ renderStats(); }); }
  if(s==='social') loadSocial();
  if(s==='profile') loadProfile();
}

// Handle browser back / forward
window.addEventListener('popstate',function(e){
  var s=(e.state&&e.state.section)||location.hash.replace('#','').split('?')[0]||'dashboard';
  showSection(s,null,true);
});

// ── GLOBAL SEARCH ─────────────────────────────────────────────────────────
var gsDebounce=null;

function openGlobalSearch(){
  document.getElementById('globalSearchOverlay').style.display='block';
  setTimeout(function(){document.getElementById('globalSearchInput').focus();},50);
}
function closeGlobalSearch(){
  document.getElementById('globalSearchOverlay').style.display='none';
  document.getElementById('globalSearchInput').value='';
  document.getElementById('globalSearchResults').innerHTML='<div style="padding:20px;text-align:center;color:var(--text-muted);font-style:italic;font-size:0.85rem;">Start typing to search across the app…</div>';
}

document.addEventListener('click',function(e){
  if(e.target.id==='globalSearchBtn'||e.target.closest('#globalSearchBtn')){openGlobalSearch();return;}
  if(e.target.id==='globalSearchOverlay'){closeGlobalSearch();return;}
});
document.addEventListener('keydown',function(e){
  if(e.key==='/'&&document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='TEXTAREA'){
    e.preventDefault();openGlobalSearch();return;
  }
  if(e.key==='Escape'){closeGlobalSearch();}
});
document.addEventListener('input',function(e){
  if(e.target.id!=='globalSearchInput') return;
  var q=e.target.value.trim();
  clearTimeout(gsDebounce);
  if(!q){
    document.getElementById('globalSearchResults').innerHTML='<div style="padding:20px;text-align:center;color:var(--text-muted);font-style:italic;font-size:0.85rem;">Start typing to search across the app…</div>';
    return;
  }
  document.getElementById('globalSearchResults').innerHTML='<div style="padding:20px;text-align:center;color:var(--text-muted);font-style:italic;font-size:0.85rem;">Searching…</div>';
  gsDebounce=setTimeout(function(){runGlobalSearch(q);},280);
});

async function runGlobalSearch(q){
  var ql=q.toLowerCase();
  var el=document.getElementById('globalSearchResults');

  // Fire all 4 queries in parallel
  var results=await Promise.allSettled([
    sb.from('profiles').select('id,display_name,avatar_url,home_course_name').ilike('display_name','*'+ql+'*').limit(5),
    sb.from('courses').select('id,name,location,county,holes,par').or('name.ilike.*'+ql+'*,location.ilike.*'+ql+'*,county.ilike.*'+ql+'*').limit(5),
    sb.from('tournaments').select('id,name,format,start_date,end_date').ilike('name','*'+ql+'*').order('start_date',{ascending:false}).limit(4),
    sb.from('societies').select('id,name,invite_code').ilike('name','*'+ql+'*').limit(4)
  ]);

  var members=(results[0].status==='fulfilled'&&!results[0].value.error)?results[0].value.data||[]:[];
  var courses=(results[1].status==='fulfilled'&&!results[1].value.error)?results[1].value.data||[]:[];
  var tourneys=(results[2].status==='fulfilled'&&!results[2].value.error)?results[2].value.data||[]:[];
  var societies=(results[3].status==='fulfilled'&&!results[3].value.error)?results[3].value.data||[]:[];

  var total=members.length+courses.length+tourneys.length+societies.length;
  if(!total){
    el.innerHTML='<div style="padding:32px;text-align:center;color:var(--text-muted);font-style:italic;font-size:0.88rem;">No results for "'+q+'"</div>';
    return;
  }

  var html='';

  if(members.length){
    html+='<div class="gs-category">Members</div>';
    html+=members.map(function(p){
      var isYou=p.id===currentUser.id;
      var init=(p.display_name||'?').charAt(0).toUpperCase();
      var avatarHtml=p.avatar_url
        ?'<img src="'+p.avatar_url+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'">'
        :'<div class="gs-result-icon" style="font-family:\'Inter\',serif;font-size:1rem;font-weight:700;color:white;">'+init+'</div>';
      return '<div class="gs-result" data-type="member" data-id="'+p.id+'" data-name="'+encodeURIComponent(p.display_name||'')+'">'+
        avatarHtml+
        '<div><div class="gs-result-name">'+p.display_name+(isYou?' <span style="font-size:0.65rem;color:var(--gold);">(you)</span>':'')+'</div>'+
        (p.home_course_name?'<div class="gs-result-sub">'+p.home_course_name+'</div>':'')+
        '</div><span class="gs-result-badge">Member</span></div>';
    }).join('');
  }

  if(courses.length){
    html+='<div class="gs-category">Courses</div>';
    html+=courses.map(function(c){
      return '<div class="gs-result" data-type="course" data-name="'+encodeURIComponent(c.name)+'">'+
        '<div class="gs-result-icon"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"</div>'+
        '<div><div class="gs-result-name">'+c.name+'</div>'+
        '<div class="gs-result-sub">'+c.location+(c.county?', '+c.county:'')+' · Par '+c.par+' · '+c.holes+'H</div></div>'+
        '<span class="gs-result-badge">Course</span></div>';
    }).join('');
  }

  if(tourneys.length){
    html+='<div class="gs-category">Tournaments</div>';
    html+=tourneys.map(function(t){
      var active=new Date(t.end_date)>=new Date();
      return '<div class="gs-result" data-type="tournament" data-id="'+t.id+'" data-name="'+encodeURIComponent(t.name)+'" data-format="'+t.format+'" data-dates="'+fDate(t.start_date)+' – '+fDate(t.end_date)+'">'+
        '<div class="gs-result-icon"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#0d0e10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></div>'+
        '<div><div class="gs-result-name">'+t.name+'</div>'+
        '<div class="gs-result-sub">'+fDate(t.start_date)+' – '+fDate(t.end_date)+' · '+t.format+'</div></div>'+
        '<span class="gs-result-badge" style="'+(active?'color:var(--under);border-color:var(--under);':'')+'">'+( active?'Active':'Ended')+'</span></div>';
    }).join('');
  }

  if(societies.length){
    html+='<div class="gs-category">Societies</div>';
    html+=societies.map(function(s){
      var isMember=societies.some&&false; // evaluated per-result below
      return '<div class="gs-result" data-type="society" data-id="'+s.id+'" data-name="'+encodeURIComponent(s.name)+'" data-code="'+s.invite_code+'">'+
        '<div class="gs-result-icon">👥</div>'+
        '<div><div class="gs-result-name">'+s.name+'</div>'+
        '<div class="gs-result-sub">Code: '+s.invite_code+'</div></div>'+
        '<span class="gs-result-badge">Society</span></div>';
    }).join('');
  }

  el.innerHTML=html;

  // Attach click handlers to results
  el.querySelectorAll('.gs-result').forEach(function(row){
    row.addEventListener('click',function(){
      var type=this.dataset.type;
      closeGlobalSearch();
      if(type==='member'){
        // Go to Community → Find Members and pre-fill search
        showSection('social',document.getElementById('navSocial'));
        setTimeout(function(){
          showSocialTab('sfMembers');
          var inp=document.getElementById('memberSearchInput');
          if(inp){ inp.value=decodeURIComponent(row.dataset.name); inp.dispatchEvent(new Event('input')); }
        },100);
      } else if(type==='course'){
        // Go to Courses and pre-fill search
        showSection('courses',document.getElementById('navCourses'));
        setTimeout(function(){
          var inp=document.getElementById('courseBrowserSearch');
          if(inp){ inp.value=decodeURIComponent(row.dataset.name); inp.dispatchEvent(new Event('input')); }
        },100);
      } else if(type==='tournament'){
        // Go to Community → Tournaments and open the tourney
        showSection('social',document.getElementById('navSocial'));
        setTimeout(function(){
          showSocialTab('sfCompete');
          setTimeout(function(){ showCompeteTab('scTournaments'); },50);
          setTimeout(function(){
            openTourney(row.dataset.id,decodeURIComponent(row.dataset.name),row.dataset.dates,row.dataset.format);
          },300);
        },100);
      } else if(type==='society'){
        // Go to Social → Societies
        showSection('social',document.getElementById('navSocial'));
        setTimeout(function(){
          showSocialTab('sfSocieties');
          // If user is a member, open it; otherwise highlight join form
          var match=societies.find(function(s){return s.id===row.dataset.id;}) ||
            {id:row.dataset.id,name:decodeURIComponent(row.dataset.name),invite_code:row.dataset.code};
          var memberSociety=(window.societies||[]).find(function(s){return s&&s.id===row.dataset.id;});
          if(memberSociety){
            openSociety(row.dataset.id,decodeURIComponent(row.dataset.name),row.dataset.code);
          } else {
            var joinInput=document.getElementById('joinCodeInput');
            if(joinInput){ joinInput.value=row.dataset.code; joinInput.focus(); }
            toast('Enter code '+row.dataset.code+' to join "'+decodeURIComponent(row.dataset.name)+'"');
          }
        },300);
      }
    });
  });
}

// ── AVATAR ────────────────────────────────────────────────────────────────
function initAvatarUpload(){
  var input=document.getElementById('avatarUpload');
  if(!input||input._bound) return;
  input._bound=true;
  input.addEventListener('change',async function(){
    var file=this.files[0];
    if(!file) return;
    if(file.size>2*1024*1024){toast('Image must be under 2MB.');return;}
    var ext=file.name.split('.').pop();
    var path=currentUser.id+'/avatar.'+ext;
    var btn=document.getElementById('avatarDisplay');
    btn.style.opacity='0.5';
    var r=await sb.storage.from('avatars').upload(path,file,{upsert:true,contentType:file.type});
    btn.style.opacity='1';
    if(r.error){toast('Upload failed: '+r.error.message);return;}
    var pub=sb.storage.from('avatars').getPublicUrl(path);
    var url=pub.data.publicUrl+'?t='+Date.now();
    await sb.from('profiles').upsert({id:currentUser.id,avatar_url:url,display_name:(currentUser.user_metadata&&currentUser.user_metadata.display_name)||currentUser.email.split('@')[0]});
    setAvatar(url);
    toast('Profile photo updated ✓');
  });
}

function setAvatar(url){
  var img=document.getElementById('avatarImg');
  var initial=document.getElementById('avatarInitial');
  if(!img||!initial) return;
  if(url){
    img.onerror=function(){setAvatar(null);};
    img.src=url;
    img.style.display='block';
    initial.style.display='none';
  } else {
    img.style.display='none';
    initial.style.display='block';
    var name=(currentUser&&currentUser.user_metadata&&currentUser.user_metadata.display_name)||
      (currentUser?currentUser.email.split('@')[0]:'?');
    initial.textContent=name.charAt(0).toUpperCase();
  }
  // Also update header pill avatar if present
  var pill=document.getElementById('avatarPillImg');
  if(pill){ pill.src=url||''; pill.style.display=url?'inline-block':'none'; }
}

// ── MEMBER SEARCH ────────────────────────────────────────────────────────
var memberSearchDebounce=null;

function initMemberSearch(){
  var input=document.getElementById('memberSearchInput');
  if(!input||input._bound) return;
  input._bound=true;
  input.addEventListener('input',function(){
    clearTimeout(memberSearchDebounce);
    var q=this.value.trim();
    if(!q){
      document.getElementById('memberSearchResults').innerHTML='<div style="color:var(--text-muted);font-style:italic;font-size:0.85rem;">Start typing to find members.</div>';
      return;
    }
    memberSearchDebounce=setTimeout(function(){runMemberSearch(q);},300);
  });
}

async function runMemberSearch(q){
  var el=document.getElementById('memberSearchResults');
  el.innerHTML='<div style="color:var(--text-muted);font-style:italic;font-size:0.85rem;">Searching…</div>';
  var r=await sb.from('profiles').select('id,display_name,avatar_url,home_course_name,is_public').ilike('display_name','*'+q+'*').limit(20);
  if(r.error||!r.data||!r.data.length){
    el.innerHTML='<div style="color:var(--text-muted);font-style:italic;font-size:0.85rem;">No members found.</div>';
    return;
  }
  // Get handicaps — fetch rounds for matched users
  var uids=r.data.map(function(p){return p.id;});
  var rr=await sb.from('rounds').select('user_id,diff').in('user_id',uids);
  var roundMap={};
  (rr.data||[]).forEach(function(x){
    if(!roundMap[x.user_id]) roundMap[x.user_id]=[];
    roundMap[x.user_id].push(x);
  });
  el.innerHTML=r.data.map(function(p){
    var isYou=p.id===currentUser.id;
    var hcp=calcHcp(roundMap[p.id]||[]);
    var hcpStr=hcp!==null?(hcp<=0?'+'+Math.abs(hcp):hcp.toFixed(1)):'—';
    var initials=(p.display_name||'?').charAt(0).toUpperCase();
    var avatarHtml=p.avatar_url
      ? '<img src="'+p.avatar_url+'" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid var(--gold);flex-shrink:0;">'
      : '<div style="width:40px;height:40px;border-radius:50%;background:var(--augusta);display:flex;align-items:center;justify-content:center;font-family:\'Inter\',serif;font-size:1.2rem;font-weight:700;color:white;flex-shrink:0;border:2px solid var(--gold);">'+initials+'</div>';
    return '<div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--border);">'+
      avatarHtml+
      '<div style="flex:1;">'+
        '<div style="font-weight:600;color:var(--augusta-deep);font-size:0.9rem;">'+p.display_name+(isYou?' <span style="font-size:0.65rem;color:var(--gold);font-family:\'Inter\',sans-serif;font-weight:600;letter-spacing:0.04em;">(you)</span>':'')+'</div>'+
        (p.home_course_name?'<div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">'+p.home_course_name+'</div>':'')+
      '</div>'+
      '<div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:6px;">'+
        '<div>'+
          '<div style="font-family:\'Inter\',serif;font-size:1.5rem;font-weight:700;color:var(--augusta-deep);line-height:1;">'+hcpStr+'</div>'+
          '<div style="font-family:\'Inter\',sans-serif;font-size:0.55rem;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:var(--text-muted);">Handicap</div>'+
        '</div>'+
        (!isYou?'<button class="follow-btn'+(followingSet.has(p.id)?' following':'')+'" data-id="'+p.id+'" style="font-family:\'Inter\',sans-serif;font-size:0.65rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;padding:5px 12px;border-radius:2px;cursor:pointer;border:1px solid var(--border);background:'+(followingSet.has(p.id)?'var(--augusta)':'var(--panel)')+';color:'+(followingSet.has(p.id)?'white':'var(--text-mid)')+';white-space:nowrap;">'+(followingSet.has(p.id)?'Following':'Follow')+'</button>':'')+
      '</div>'+
    '</div>';
  }).join('');
}

// ── LOG MODAL ─────────────────────────────────────────────────────────────
function openLogModal(){
  // Always start fresh (clears any leftover edit state)
  editingRoundId=null;
  document.getElementById('logModalTitle').textContent='Log a Round';
  document.getElementById('submitBtn').textContent='Record Round';
  clearCourseSelection();
  ['fTotal','fNotes','fRating','fSlope','fPutts','fFairways','fGIR','fPenalties'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('fHoles').value='18';
  document.getElementById('fPar').value='72';
  for(var i=1;i<=18;i++){var h=document.getElementById('h'+i);if(h)h.value='';}
  ['courseDetailsPanel','optStatsPanel','holeByHolePanel'].forEach(function(id){var p=document.getElementById(id);if(p)p.style.display='none';});
  ['toggleCourseDetails','toggleOptStats','toggleHoleByHole'].forEach(function(id){var b=document.getElementById(id);if(b){b.classList.remove('open');b.innerHTML=b.innerHTML.replace('－','＋');}});
  document.getElementById('logRoundModal').style.display='flex';
  document.getElementById('fDate').valueAsDate=new Date();
  clearRoundPhotos();
  initRoundPhotoInput();
}
function closeLogModal(){
  document.getElementById('logRoundModal').style.display='none';
  editingRoundId=null;
  document.getElementById('logModalTitle').textContent='Log a Round';
  document.getElementById('submitBtn').textContent='Record Round';
}

// ── FEED FILTER ───────────────────────────────────────────────────────────
var feedFilter='following';
function setFeedFilter(f,btn){
  feedFilter=f;
  document.querySelectorAll('#feedFilterFollowing,#feedFilterAll').forEach(function(b){b.classList.remove('active');});
  if(btn) btn.classList.add('active');
  loadFeed();
}

// ── FOLLOWS ───────────────────────────────────────────────────────────────
var followingSet=new Set();

async function loadFollowing(){
  var r=await sb.from('follows').select('following_id').eq('follower_id',currentUser.id);
  followingSet=new Set((r.data||[]).map(function(f){return f.following_id;}));
}

async function toggleFollow(uid,btn){
  if(followingSet.has(uid)){
    await sb.from('follows').delete().eq('follower_id',currentUser.id).eq('following_id',uid);
    followingSet.delete(uid);
    if(btn){btn.textContent='Follow';btn.classList.remove('following');}
    toast('Unfollowed');
  } else {
    await sb.from('follows').insert({follower_id:currentUser.id,following_id:uid});
    followingSet.add(uid);
    if(btn){btn.textContent='Following';btn.classList.add('following');}
    toast('Following ✓');
  }
}

// ── LIKES ─────────────────────────────────────────────────────────────────
var likedRounds=new Set();

async function loadLikes(roundIds){
  if(!roundIds.length) return;
  var r=await sb.from('round_likes').select('round_id').eq('user_id',currentUser.id).in('round_id',roundIds);
  likedRounds=new Set((r.data||[]).map(function(l){return l.round_id;}));
}

async function toggleLike(roundId,btn){
  if(likedRounds.has(roundId)){
    await sb.from('round_likes').delete().eq('round_id',roundId).eq('user_id',currentUser.id);
    likedRounds.delete(roundId);
    var count=parseInt(btn.dataset.count||0)-1;
    btn.dataset.count=count;
    btn.innerHTML='♡ '+count;
    btn.classList.remove('liked');
  } else {
    await sb.from('round_likes').insert({round_id:roundId,user_id:currentUser.id});
    likedRounds.add(roundId);
    var count=parseInt(btn.dataset.count||0)+1;
    btn.dataset.count=count;
    btn.innerHTML='♥ '+count;
    btn.classList.add('liked');
  }
}

function fDate(s){
  if(!s) return '';
  return new Date(s+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
}
function toast(m){
  var e=document.getElementById('toast');
  e.textContent=m; e.classList.add('show');
  clearTimeout(tT);
  tT=setTimeout(function(){e.classList.remove('show');},2600);
}

// ── PULL-TO-REFRESH (social feed only) ────────────────────────────────────
(function(){
  var startY=0, active=false, dist=0, THRESH=64, ind=null, refreshing=false;
  function onFeed(){
    var s=document.getElementById('section-social'), f=document.getElementById('sf-feed');
    return s&&s.style.display!=='none'&&f&&f.style.display!=='none';
  }
  function ensureInd(){
    if(ind) return ind;
    ind=document.createElement('div');
    ind.style.cssText='position:fixed;top:0;left:0;right:0;display:flex;align-items:flex-end;justify-content:center;height:0;overflow:hidden;z-index:8000;pointer-events:none;padding-bottom:8px;box-sizing:border-box;';
    ind.innerHTML='<span class="spinner" style="border-top-color:var(--augusta);border-color:var(--border);border-top-color:var(--augusta);"></span>';
    document.body.appendChild(ind);
    return ind;
  }
  function setH(h){ ensureInd().style.height=h+'px'; }
  document.addEventListener('touchstart',function(e){
    if(refreshing||!onFeed()||window.scrollY>0){active=false;return;}
    startY=e.touches[0].clientY; active=true; dist=0;
  },{passive:true});
  document.addEventListener('touchmove',function(e){
    if(!active) return;
    dist=e.touches[0].clientY-startY;
    if(dist<=0||window.scrollY>0){ active=false; setH(0); return; }
    setH(Math.min(dist*0.5,80));
    if(e.cancelable) e.preventDefault();
  },{passive:false});
  document.addEventListener('touchend',function(){
    if(!active) return;
    active=false;
    if(dist*0.5>=THRESH){
      refreshing=true; setH(46);
      Promise.resolve(loadFeed()).then(function(){},function(){}).then(function(){
        setTimeout(function(){ setH(0); refreshing=false; },400);
      });
    } else { setH(0); }
  });
})();
