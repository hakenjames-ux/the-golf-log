// ── SOCIAL ────────────────────────────────────────────────────────────────
var societies=[], currentSociety=null, matches=[], selectedShareRound=null;

function showSocialTab(tabId){
  var tabs=['sfFeed','sfMembers','sfLeaderboard','sfSocieties','sfCompete','sfShare'];
  var panels={sfFeed:'sf-feed',sfMembers:'sf-members',sfLeaderboard:'sf-leaderboard',sfSocieties:'sf-societies',sfCompete:'sf-compete',sfShare:'sf-share'};
  tabs.forEach(function(t){
    document.getElementById(t).classList.toggle('active',t===tabId);
    document.getElementById(panels[t]).style.display=t===tabId?'':'none';
  });
  document.getElementById('sp-society-detail').style.display='none';
  if(tabId==='sfFeed') loadFeed();
  if(tabId==='sfMembers') initMemberSearch();
  if(tabId==='sfLeaderboard') loadLeaderboard();
  if(tabId==='sfSocieties') loadSocieties();
  if(tabId==='sfCompete'){ loadChallenges(); showCompeteTab('scChallenges'); }
  if(tabId==='sfShare') renderShareRoundList();
}

function showCompeteTab(tabId){
  var tabs=['scChallenges','scTournaments','scMatchPlay'];
  var panels={scChallenges:'sc-challenges',scTournaments:'sc-tournaments',scMatchPlay:'sc-matchplay'};
  tabs.forEach(function(t){
    document.getElementById(t).classList.toggle('active',t===tabId);
    document.getElementById(panels[t]).style.display=t===tabId?'':'none';
  });
  if(tabId==='scTournaments') loadTournaments();
  if(tabId==='scMatchPlay'){ loadMatches().then(renderMatchSummary); document.getElementById('matchDate').valueAsDate=new Date(); }
}

async function loadSocial(){
  if(!rounds.length) await loadRounds();
  showSocialTab('sfFeed');
}

// ── SOCIETIES ─────────────────────────────────────────────────────────────
async function loadSocieties(){
  var r=await sb.from('society_members').select('society_id, societies(id,name,invite_code,created_by,created_at)').eq('user_id',currentUser.id);
  if(r.error||!r.data){document.getElementById('societiesList').innerHTML='<div style="color:var(--text-muted);font-style:italic;font-size:0.88rem;">Could not load societies.</div>';return;}
  societies=r.data.map(function(m){return m.societies;}).filter(Boolean);
  renderSocietiesList();
}

function renderSocietiesList(){
  var el=document.getElementById('societiesList');
  if(!societies.length){
    el.innerHTML=emptyState(
      '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      'No societies yet',
      'Create a society for your regular group, or join one with an invite code above.',
      ''
    );
    return;
  }
  el.innerHTML=societies.map(function(s){
    return '<div class="society-card" data-id="'+s.id+'" data-name="'+s.name+'" data-code="'+s.invite_code+'">'+
      '<div style="width:40px;height:40px;background:var(--augusta);border-radius:2px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"</div>'+
      '<div><div class="society-card-name">'+s.name+'</div><div class="society-card-meta">Code: '+s.invite_code+'</div></div>'+
      '<div style="margin-left:auto;font-family:\'Inter\',sans-serif;font-size:0.65rem;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:var(--text-muted);">View →</div>'+
    '</div>';
  }).join('');
}

function generateCode(){
  return Math.random().toString(36).substring(2,8).toUpperCase();
}

async function createSociety(){
  var name=document.getElementById('newSocietyName').value.trim();
  if(!name){toast('Please enter a society name.');return;}
  var code=generateCode();
  var r=await sb.from('societies').insert({name:name,invite_code:code,created_by:currentUser.id}).select().single();
  if(r.error){toast('Error: '+r.error.message);return;}
  // Auto-join as creator
  await sb.from('society_members').insert({society_id:r.data.id,user_id:currentUser.id});
  document.getElementById('newSocietyName').value='';
  toast('Society "'+name+'" created! Code: '+code);
  await loadSocieties();
}

async function joinSociety(){
  var code=document.getElementById('joinCodeInput').value.trim().toUpperCase();
  if(!code||code.length<4){toast('Please enter a valid invite code.');return;}
  var r=await sb.from('societies').select('id,name').eq('invite_code',code);
  // Need to bypass RLS for lookup — use a different approach
  if(r.error||!r.data||!r.data.length){
    // Try direct insert with code lookup
    toast('Code not found. Check the code and try again.');return;
  }
  var society=r.data[0];
  var join=await sb.from('society_members').insert({society_id:society.id,user_id:currentUser.id});
  if(join.error){if(join.error.code==='23505'){toast('You\'re already in this society!');}else{toast('Error: '+join.error.message);}return;}
  document.getElementById('joinCodeInput').value='';
  toast('Joined "'+society.name+'" ✓');
  await loadSocieties();
}

async function sendEmailInvite(){
  var email=document.getElementById('inviteEmailInput').value.trim();
  if(!email){toast('Please enter an email address.');return;}
  // We can't send emails directly from the browser, so we just copy a join message
  var code=currentSociety?currentSociety.invite_code:'your society code';
  var msg='Join me on The Golf Log! Use invite code '+code+' to join our society at '+window.location.href;
  navigator.clipboard.writeText(msg).then(function(){
    toast('Invite message copied — paste and send to '+email+' ✓');
    document.getElementById('inviteEmailInput').value='';
  });
}

async function openSociety(id,name,code){
  currentSociety={id:id,name:name,invite_code:code};
  document.getElementById('sf-societies').style.display='none';
  document.getElementById('sp-society-detail').style.display='block';
  document.getElementById('societyDetailName').textContent=name;
  document.getElementById('societyDetailCode').textContent='Code: '+code;
  // Load members
  var mr=await sb.from('society_members').select('user_id, profiles(id,display_name)').eq('society_id',id);
  var members=mr.data||[];
  document.getElementById('societyMembersList').innerHTML=members.map(function(m){
    var pname=(m.profiles&&m.profiles.display_name)||'Member';
    var isYou=m.user_id===currentUser.id;
    return '<div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:0.85rem;font-weight:'+(isYou?'700':'400')+';color:var(--augusta-deep);">👤 '+pname+(isYou?' (you)':'')+'</div>';
  }).join('');
  // Society leaderboard — get all members' rounds
  var uids=members.map(function(m){return m.user_id;});
  var rr=await sb.from('rounds').select('user_id,diff,score').in('user_id',uids);
  var map={};
  (rr.data||[]).forEach(function(r){if(!map[r.user_id])map[r.user_id]=[];map[r.user_id].push(r);});
  var entries=uids.map(function(uid){
    var member=members.find(function(m){return m.user_id===uid;});
    var pname=(member&&member.profiles&&member.profiles.display_name)||'Member';
    var hcp=calcHcp(map[uid]||[]);
    return{uid:uid,name:pname,hcp:hcp,count:(map[uid]||[]).length};
  }).filter(function(e){return e.hcp!==null;}).sort(function(a,b){return a.hcp-b.hcp;});
  var rc=['r1','r2','r3'];
  document.getElementById('societyLbBody').innerHTML=entries.length?entries.map(function(e,i){
    var h=e.hcp<=0?'+'+Math.abs(e.hcp):e.hcp.toFixed(1);
    var isYou=e.uid===currentUser.id;
    return '<div class="lb-row"><div class="lb-rank-num '+(rc[i]||'')+'">'+(i+1)+'</div><div class="lb-player">'+e.name+(isYou?'<span class="lb-you-tag">(you)</span>':'')+'</div><div class="lb-hcp-num">'+h+'</div><div class="lb-rds">'+e.count+' rds</div></div>';
  }).join(''):'<div class="lb-empty">No handicap data yet.</div>';
}

function copySocietyCode(){
  if(!currentSociety) return;
  navigator.clipboard.writeText(currentSociety.invite_code).then(function(){toast('Code '+currentSociety.invite_code+' copied! ✓');});
}

async function leaveSociety(){
  if(!currentSociety) return;
  if(!confirm('Leave "'+currentSociety.name+'"?')) return;
  await sb.from('society_members').delete().eq('society_id',currentSociety.id).eq('user_id',currentUser.id);
  currentSociety=null;
  document.getElementById('sp-society-detail').style.display='none';
  document.getElementById('sf-societies').style.display='';
  toast('Left society.');
  await loadSocieties();
}

// ── MATCH PLAY ────────────────────────────────────────────────────────────
async function loadMatches(){
  var r=await sb.from('matches').select('*').eq('created_by',currentUser.id).order('date',{ascending:false});
  if(!r.error&&r.data) matches=r.data;
}

function renderMatchSummary(){
  var wins=0,draws=0,losses=0;
  matches.forEach(function(m){if(m.result==='win')wins++;else if(m.result==='draw')draws++;else if(m.result==='loss')losses++;});
  document.getElementById('matchWins').textContent=wins;
  document.getElementById('matchDraws').textContent=draws;
  document.getElementById('matchLosses').textContent=losses;
  var el=document.getElementById('matchHistory');
  if(!matches.length){el.innerHTML='<div style="color:var(--text-muted);font-style:italic;font-size:0.85rem;">No matches logged yet.</div>';return;}
  el.innerHTML=matches.slice(0,8).map(function(m){
    var cls=m.result==='win'?'match-result-win':m.result==='loss'?'match-result-loss':'match-result-draw';
    var label=m.result==='win'?'WIN':m.result==='loss'?'LOSS':'HALVED';
    return '<div class="match-item">'+
      '<div style="flex:1;"><div style="font-weight:600;color:var(--augusta-deep);font-size:0.85rem;">vs '+m.player2_name+'</div><div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px;">'+m.course+' · '+fDate(m.date)+'</div></div>'+
      '<div style="text-align:center;"><div style="font-family:\'Inter\',serif;font-size:1rem;font-weight:700;">'+m.player1_score+' – '+m.player2_score+'</div></div>'+
      '<div class="'+cls+'">'+label+'</div>'+
      '<button class="match-delete row-del" data-id="'+m.id+'">✕</button>'+
    '</div>';
  }).join('');
}

async function logMatch(){
  var opp=document.getElementById('matchOpponent').value.trim();
  var course=document.getElementById('matchCourse').value.trim();
  var date=document.getElementById('matchDate').value;
  var myScore=parseInt(document.getElementById('matchMyScore').value);
  var oppScore=parseInt(document.getElementById('matchOppScore').value);
  if(!opp||!course||!date||isNaN(myScore)||isNaN(oppScore)){toast('Please fill in all match fields.');return;}
  var result=myScore<oppScore?'win':myScore>oppScore?'loss':'draw';
  var myName=(currentUser.user_metadata&&currentUser.user_metadata.display_name)||currentUser.email.split('@')[0];
  var r=await sb.from('matches').insert({player1_id:currentUser.id,player1_name:myName,player2_name:opp,course:course,date:date,player1_score:myScore,player2_score:oppScore,result:result,created_by:currentUser.id}).select().single();
  if(r.error){toast('Error: '+r.error.message);return;}
  matches.unshift(r.data);
  ['matchOpponent','matchCourse','matchMyScore','matchOppScore'].forEach(function(id){document.getElementById(id).value='';});
  renderMatchSummary();
  toast('Match logged — '+result.toUpperCase()+' ✓');
}

async function deleteMatch(id){
  await sb.from('matches').delete().eq('id',id);
  matches=matches.filter(function(m){return m.id!==id;});
  renderMatchSummary();
  toast('Match removed.');
}

// ── MONTHLY MEDAL ─────────────────────────────────────────────────────────
function renderMonthlyMedal(){
  if(!rounds.length){document.getElementById('monthlyMedalGrid').innerHTML='<div style="color:var(--text-muted);font-style:italic;">No rounds logged yet.</div>';return;}
  var year=parseInt(document.getElementById('medalYearSelect').value)||new Date().getFullYear();
  document.getElementById('seasonYear').textContent=year+' Season';
  var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var grid=document.getElementById('monthlyMedalGrid');
  grid.innerHTML=months.map(function(m,i){
    var monthRounds=rounds.filter(function(r){
      var d=new Date(r.date+'T12:00:00');
      return d.getFullYear()===year&&d.getMonth()===i;
    });
    var best=monthRounds.length?monthRounds.reduce(function(a,b){return a.score<b.score?a:b;}):null;
    return '<div class="medal-card '+(best?'has-round':'')+'">'+
      '<div class="medal-month">'+m+'</div>'+
      (best?'<div class="medal-score">'+best.score+'</div><div class="medal-course">'+best.course+'</div><div style="font-size:0.68rem;color:var(--gold);margin-top:4px;font-family:\'Inter\',sans-serif;font-weight:600;letter-spacing:0.04em;">'+(best.score-best.par>0?'+':'')+(best.score-best.par===0?'E':best.score-best.par)+'</div>':'<div style="color:var(--text-muted);font-style:italic;font-size:0.8rem;margin-top:8px;">No round</div>')+
    '</div>';
  }).join('');
  // Season standings — best round per month count
  var played=months.filter(function(_,i){return rounds.some(function(r){var d=new Date(r.date+'T12:00:00');return d.getFullYear()===year&&d.getMonth()===i;});}).length;
  var yearRounds=rounds.filter(function(r){return new Date(r.date+'T12:00:00').getFullYear()===year;});
  var bestOfYear=yearRounds.length?yearRounds.reduce(function(a,b){return a.score<b.score?a:b;}):null;
  document.getElementById('seasonStandings').innerHTML=yearRounds.length?
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;text-align:center;">'+
      '<div style="background:var(--panel);padding:16px;border-radius:var(--radius);"><div style="font-family:\'Inter\',serif;font-size:2rem;font-weight:700;color:var(--augusta-deep);">'+yearRounds.length+'</div><div style="font-family:\'Inter\',sans-serif;font-size:0.6rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);">Rounds</div></div>'+
      '<div style="background:var(--panel);padding:16px;border-radius:var(--radius);"><div style="font-family:\'Inter\',serif;font-size:2rem;font-weight:700;color:var(--augusta-deep);">'+played+'</div><div style="font-family:\'Inter\',sans-serif;font-size:0.6rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);">Months Active</div></div>'+
      '<div style="background:linear-gradient(135deg,#f5f0e0,#fdf8ec);border:1px solid var(--gold);padding:16px;border-radius:var(--radius);">'+
        '<div style="font-family:\'Inter\',serif;font-size:2rem;font-weight:700;color:var(--augusta-deep);">'+(bestOfYear?bestOfYear.score:'—')+'</div>'+
        '<div style="font-family:\'Inter\',sans-serif;font-size:0.6rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:var(--gold);">Best Score</div>'+
        (bestOfYear?'<div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;font-weight:300;">'+bestOfYear.course+'</div>':'')+
      '</div>'+
    '</div>':
    '<div style="color:var(--text-muted);font-style:italic;font-size:0.88rem;">No rounds in '+year+'.</div>';
}

function initMedalYearSelect(){
  var sel=document.getElementById('medalYearSelect');
  var years=[];
  rounds.forEach(function(r){var y=new Date(r.date+'T12:00:00').getFullYear();if(years.indexOf(y)===-1)years.push(y);});
  var cur=new Date().getFullYear();
  if(years.indexOf(cur)===-1) years.push(cur);
  years.sort(function(a,b){return b-a;});
  sel.innerHTML=years.map(function(y){return '<option value="'+y+'"'+(y===cur?' selected':'')+'>'+y+'</option>';}).join('');
  sel.addEventListener('change',renderMonthlyMedal);
}

