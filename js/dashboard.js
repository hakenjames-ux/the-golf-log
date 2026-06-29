// ── LEADERBOARD ───────────────────────────────────────────────────────────
async function loadLeaderboard(){
  document.getElementById('lbBody').innerHTML=skel(6,52);
  var r=await sb.from('rounds').select('user_id,diff,score').order('user_id');
  if(r.error||!r.data){document.getElementById('lbBody').innerHTML='<div class="lb-empty">Could not load.</div>';return;}
  var map={};
  r.data.forEach(function(x){if(!map[x.user_id])map[x.user_id]=[];map[x.user_id].push(x);});
  var entries=Object.entries(map).map(function(e){return{uid:e[0],hcp:calcHcp(e[1]),count:e[1].length};}).filter(function(e){return e.hcp!==null;}).sort(function(a,b){return a.hcp-b.hcp;});
  var names={};
  try{var p=await sb.from('profiles').select('id,display_name').in('id',entries.map(function(e){return e.uid;}));if(p.data)p.data.forEach(function(x){names[x.id]=x.display_name;});}catch(e){}
  var rc=['r1','r2','r3'];
  if(!entries.length){document.getElementById('lbBody').innerHTML='<div class="lb-empty">No players yet.</div>';return;}
  document.getElementById('lbBody').innerHTML=entries.map(function(e,i){
    var isYou=e.uid===currentUser.id;
    var name=names[e.uid]||(isYou?((currentUser.user_metadata&&currentUser.user_metadata.display_name)||'You'):'Golfer');
    var h=e.hcp<=0?'+'+Math.abs(e.hcp):e.hcp.toFixed(1);
    return '<div class="lb-row"><div class="lb-rank-num '+(rc[i]||'')+'">'+( i+1)+'</div><div class="lb-player">'+name+(isYou?'<span class="lb-you-tag">(you)</span>':'')+'</div><div class="lb-hcp-num">'+h+'</div><div class="lb-rds">'+e.count+' rds</div></div>';
  }).join('');
}

// ── RENDER ────────────────────────────────────────────────────────────────
function renderAll(){ rHcp(); rRecent(); rChart(); renderDashboardExtras(); renderDashFeedSlice(); }

// ── UI HELPERS: skeletons + empty states ─────────────────────────────────
function skel(n,h){
  var s='';
  for(var i=0;i<(n||3);i++){ s+='<div class="skel" style="height:'+(h||56)+'px;"></div>'; }
  return '<div class="skel-wrap">'+s+'</div>';
}
function emptyState(iconSvg,title,sub,ctaHtml){
  return '<div class="empty-state">'+
    '<div class="empty-state-icon">'+iconSvg+'</div>'+
    '<div class="empty-state-title">'+title+'</div>'+
    '<div class="empty-state-sub">'+sub+'</div>'+
    (ctaHtml||'')+
  '</div>';
}

// ── DASHBOARD: FORM, TREND, GOALS ─────────────────────────────────────────
function hcpAsOfDaysAgo(days){
  var cutoff=new Date(); cutoff.setDate(cutoff.getDate()-days);
  var subset=rounds.filter(function(r){return new Date(r.date+'T12:00:00')<=cutoff;});
  return calcHcp(subset);
}

function renderDashboardExtras(){
  var hcp=calcHcp(rounds);

  // Handicap trend vs ~30 days ago
  var trendEl=document.getElementById('hcpTrend');
  if(trendEl){
    var past=hcpAsOfDaysAgo(30);
    if(hcp!==null&&past!==null&&Math.abs(hcp-past)>=0.1){
      var delta=Math.round((hcp-past)*10)/10;
      var improved=delta<0; // lower handicap = better
      trendEl.style.display='block';
      trendEl.style.background=improved?'rgba(47,158,91,0.18)':'rgba(255,107,107,0.15)';
      trendEl.style.color=improved?'var(--augusta)':'var(--over)';
      trendEl.textContent=(improved?'▼ ':'▲ ')+Math.abs(delta).toFixed(1)+' this month';
    } else {
      trendEl.style.display='none';
    }
  }

  // Form strip — last 5 rounds as coloured dots
  var strip=document.getElementById('formStrip');
  var last5=rounds.slice(-5);
  if(strip){
    if(!last5.length){
      strip.innerHTML='<span style="font-size:0.82rem;color:var(--text-muted);font-style:italic;">No rounds yet — log one to see your form.</span>';
    } else {
      strip.innerHTML=last5.map(function(r){
        var ov=r.score-r.par;
        var ovS=ov===0?'E':(ov>0?'+'+ov:''+ov);
        var col=ov<0?'var(--under)':ov<=2?'var(--gold-light)':ov<=6?'#d9a441':'var(--over)';
        var txtCol=(ov>=-1&&ov<=2)?'#0a0a0b':'#fff';
        return '<div title="'+r.course+' · '+r.score+'" style="flex:1;text-align:center;">'+
          '<div style="width:38px;height:38px;border-radius:50%;background:'+col+';color:'+txtCol+';display:flex;align-items:center;justify-content:center;margin:0 auto;font-family:\'Inter\',sans-serif;font-weight:800;font-size:0.78rem;">'+ovS+'</div>'+
          '<div style="font-size:0.58rem;color:var(--text-muted);margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:54px;">'+(r.course.length>8?r.course.slice(0,8)+'…':r.course)+'</div>'+
        '</div>';
      }).join('');
    }
  }

  // Form streak — consecutive most-recent rounds at or under par-relative threshold
  // (rounds where score-par is better than the user's running average over-par)
  var streakEl=document.getElementById('formStreak');
  if(streakEl){
    if(rounds.length){
      var avgOver=rounds.reduce(function(s,r){return s+(r.score-r.par);},0)/rounds.length;
      var streak=0;
      for(var i=rounds.length-1;i>=0;i--){
        if((rounds[i].score-rounds[i].par)<=avgOver){streak++;}else{break;}
      }
      streakEl.textContent=streak+(streak===1?' rd':' rds');
    } else { streakEl.textContent='—'; }
  }

  // Best of last 5
  var bestEl=document.getElementById('formRecentBest');
  if(bestEl){
    bestEl.textContent=last5.length?Math.min.apply(null,last5.map(function(r){return r.score;})):'—';
  }

  // Next milestone / goal
  renderGoalCard(hcp);
}

function renderGoalCard(hcp){
  var el=document.getElementById('goalCard');
  if(!el) return;
  if(!rounds.length){
    el.innerHTML='<div style="font-size:0.85rem;color:var(--text-muted);font-style:italic;padding:8px 0;">Log a few rounds to unlock goals and milestones.</div>';
    return;
  }
  var bestScore=Math.min.apply(null,rounds.map(function(r){return r.score;}));
  var goals=[];

  // Handicap milestones
  if(hcp!==null){
    if(hcp>10) goals.push({label:'Single Figures',detail:'Reach a handicap under 10',current:hcp,target:10,unit:'',remain:(hcp-10),pct:Math.max(0,Math.min(100,(54-hcp)/(54-10)*100))});
    else if(hcp>5) goals.push({label:'Get to 5',detail:'Reach a handicap of 5',current:hcp,target:5,unit:'',remain:(hcp-5),pct:Math.max(0,Math.min(100,(10-hcp)/(10-5)*100))});
    else if(hcp>0) goals.push({label:'Scratch Golfer',detail:'Reach a handicap of 0',current:hcp,target:0,unit:'',remain:hcp,pct:Math.max(0,Math.min(100,(5-hcp)/5*100))});
  }
  // Score milestones
  var scoreTargets=[100,90,80,70];
  for(var i=0;i<scoreTargets.length;i++){
    if(bestScore>=scoreTargets[i]){
      goals.push({label:'Break '+scoreTargets[i],detail:'Best round so far: '+bestScore,current:bestScore,target:scoreTargets[i],unit:' shots',remain:(bestScore-scoreTargets[i]+1),pct:0,isScore:true});
      break;
    }
  }

  if(!goals.length){
    el.innerHTML='<div style="font-size:0.95rem;color:var(--augusta-deep);font-weight:600;padding:8px 0;">You\'ve hit every milestone — you\'re playing elite golf!</div>';
    return;
  }

  // Show the primary handicap goal (or first goal)
  var g=goals[0];
  var remainStr=g.isScore?(g.remain+(g.remain===1?' shot to go':' shots to go')):(g.remain.toFixed(1)+' to go');
  el.innerHTML=
    '<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;">'+
      '<span style="font-family:\'Inter\',sans-serif;font-size:1.1rem;font-weight:800;color:var(--augusta-deep);">'+g.label+'</span>'+
      '<span style="font-family:\'Inter\',sans-serif;font-size:0.8rem;font-weight:700;color:var(--augusta);">'+remainStr+'</span>'+
    '</div>'+
    '<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:14px;">'+g.detail+'</div>'+
    '<div style="height:8px;background:var(--ink-soft);border-radius:5px;overflow:hidden;">'+
      '<div style="height:100%;width:'+Math.round(g.pct)+'%;background:linear-gradient(90deg,var(--augusta-mid),var(--augusta));border-radius:5px;transition:width 0.6s;"></div>'+
    '</div>'+
    (goals.length>1?'<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);font-size:0.82rem;color:var(--text-mid);">Also chasing: <strong style="color:var(--augusta-deep);">'+goals[1].label+'</strong> — '+(goals[1].isScore?goals[1].remain+' shots':goals[1].remain.toFixed(1))+' to go</div>':'');
}

async function renderDashFeedSlice(){
  var wrap=document.getElementById('dashFeedWrap');
  var el=document.getElementById('dashFeedSlice');
  if(!wrap||!el) return;
  if(!followingSet||followingSet.size===0){ wrap.style.display='none'; return; }
  var r=await sb.from('rounds').select('id,user_id,course,score,par,diff,date,holes_played,notes')
    .in('user_id',Array.from(followingSet)).order('date',{ascending:false}).limit(3);
  if(r.error||!r.data||!r.data.length){ wrap.style.display='none'; return; }
  var uids=[...new Set(r.data.map(function(x){return x.user_id;}))];
  var profiles={};
  var pr=await sb.from('profiles').select('id,display_name,avatar_url').in('id',uids);
  if(pr.data) pr.data.forEach(function(p){profiles[p.id]=p;});
  wrap.style.display='block';
  el.innerHTML=r.data.map(function(round){
    var prof=profiles[round.user_id]||{};
    var name=prof.display_name||'Golfer';
    var init=name.charAt(0).toUpperCase();
    var ov=round.score-round.par,ovS=ov===0?'E':(ov>0?'+'+ov:''+ov);
    var ovCol=ov<0?'var(--under)':ov>0?'var(--over)':'var(--gold)';
    var avatarHtml=prof.avatar_url
      ?'<img src="'+prof.avatar_url+'" style="width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'">'
      :'<div class="feed-avatar" style="width:34px;height:34px;">'+init+'</div>';
    return '<div class="panel" style="display:flex;align-items:center;gap:12px;padding:12px 16px;margin-bottom:10px;">'+
      avatarHtml+
      '<div style="flex:1;"><div style="font-weight:600;color:var(--augusta-deep);font-size:0.85rem;">'+name+'</div>'+
      '<div style="font-size:0.72rem;color:var(--text-muted);">'+round.course+' · '+fDate(round.date)+'</div></div>'+
      '<div style="text-align:right;"><div style="font-family:\'Inter\',serif;font-size:1.4rem;font-weight:700;color:var(--augusta-deep);line-height:1;">'+round.score+'</div>'+
      '<div style="font-size:0.7rem;font-weight:700;color:'+ovCol+';">'+ovS+'</div></div>'+
    '</div>';
  }).join('');
}

function rHcp(){
  var hcp=calcHcp(rounds);
  var el=document.getElementById('hcpDisplay'), sub=document.getElementById('hcpSubtitle');
  if(hcp===null){
    el.textContent='—';
    sub.textContent=rounds.length<3?rounds.length+' rounds logged — need 3 to calculate':'No rounds yet';
  }else{
    var hcpStr=(hcp<=0?'+':'')+Math.abs(hcp).toFixed(1);
    el.textContent=hcpStr;
    sub.textContent='WHS · Best differentials from '+Math.min(20,rounds.length)+' rounds';
  }
  document.getElementById('statRounds').textContent=rounds.length;
  if(rounds.length){
    var scores=rounds.map(function(r){return r.score;});
    var best=Math.min.apply(null,scores);
    var avg=Math.round(scores.reduce(function(a,b){return a+b;},0)/scores.length);
    var bd=Math.min.apply(null,rounds.map(function(r){return r.diff;}));
    document.getElementById('statBest').textContent=best;
    document.getElementById('statAvg').textContent=avg;
    document.getElementById('statDiff').textContent=bd<=0?'+'+Math.abs(bd):parseFloat(bd).toFixed(1);
    // Animate counters
    setTimeout(function(){
      animateCounter(document.getElementById('statRounds'),rounds.length,600,0,'');
      animateCounter(document.getElementById('statBest'),best,700,0,'');
      animateCounter(document.getElementById('statAvg'),avg,700,0,'');
      if(hcp!==null) animateCounter(el,Math.abs(hcp),800,1,hcp<=0?'+':'');
    },50);
  } else {
    ['statBest','statAvg','statDiff'].forEach(function(id){document.getElementById(id).textContent='—';});
  }
}

function rRecent(){
  var body=document.getElementById('roundsBody');
  var meta=document.getElementById('recentMeta');
  var recent=rounds.slice(-10).reverse();
  meta.textContent=rounds.length+' round'+(rounds.length!==1?'s':'');
  if(!recent.length){
    body.innerHTML=emptyState(
      '<svg viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
      'No rounds yet',
      'Your scores and handicap will appear here once you log a round.',
      '<button class="log-btn" onclick="openLogModal()" style="width:auto;padding:11px 28px;">Log Your First Round</button>'
    );
    return;
  }
  var minS=Math.min.apply(null,rounds.map(function(r){return r.score;}));
  body.innerHTML=recent.map(function(r,i){
    var ov=r.score-r.par, ovS=ov===0?'E':(ov>0?'+'+ov:''+ov);
    var ovCol=ov<0?'var(--under)':ov>0?'var(--over)':'var(--gold)';
    var badge=(r.score===minS&&rounds.length>1)?'<span class="badge badge-gold">Best</span>':(i===0?'<span class="badge badge-new">Latest</span>':'');
    return '<div class="round-card round-row" data-id="'+r.id+'">'+
      '<div class="rc-main">'+
        '<div class="rc-course">'+r.course+' '+badge+'</div>'+
        '<div class="rc-date">'+fDate(r.date)+(r.holes_played===9?' · 9 holes':'')+' · Diff '+parseFloat(r.diff).toFixed(1)+'</div>'+
      '</div>'+
      '<div class="rc-vspar" style="color:'+ovCol+';">'+ovS+'</div>'+
      '<div class="rc-score">'+r.score+'</div>'+
      '<div class="rc-chev">›</div>'+
    '</div>';
  }).join('');
}


function rChart(){
  var ctx=document.getElementById('trendChart').getContext('2d');
  var data=rounds.slice(-20);
  if(trendChart) trendChart.destroy();
  trendChart=new Chart(ctx,{
    type:'line',
    data:{
      labels:data.map(function(r){return r.course.length>14?r.course.slice(0,14)+'…':r.course;}),
      datasets:[
        {label:'Score',data:data.map(function(r){return r.score;}),borderColor:'#2f9e5b',backgroundColor:'rgba(47,158,91,0.08)',pointBackgroundColor:'#2f9e5b',pointBorderColor:'#0d0e10',pointBorderWidth:2,pointRadius:5,pointHoverRadius:7,borderWidth:2,tension:0.35,fill:true},
        {label:'Par',data:data.map(function(r){return r.par;}),borderColor:'#c9a84c',borderWidth:1.5,borderDash:[5,4],pointRadius:0,tension:0,fill:false}
      ]
    },
    options:{
      responsive:true,interaction:{mode:'index',intersect:false},
      plugins:{
        legend:{labels:{font:{family:'Inter',size:11,weight:'600'},color:'#7a9a8a',padding:20}},
        tooltip:{backgroundColor:'#161719',titleFont:{family:'Inter',size:14},bodyFont:{family:'Inter',size:12},padding:12,cornerRadius:2,borderColor:'rgba(47,158,91,0.3)',borderWidth:1}
      },
      scales:{
        x:{ticks:{font:{family:'Inter',size:10,weight:'500'},color:'#aaa',maxRotation:30},grid:{color:'rgba(255,255,255,0.05)'},border:{display:false}},
        y:{ticks:{font:{family:'Inter',size:10,weight:'500'},color:'#aaa'},grid:{color:'rgba(255,255,255,0.05)'},border:{display:false}}
      }
    }
  });
}

