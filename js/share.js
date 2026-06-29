// ── SHARE A ROUND (Canvas scorecard) ─────────────────────────────────────
function renderShareRoundList(){
  if(!rounds.length){document.getElementById('shareRoundList').innerHTML='<div style="color:var(--text-muted);font-style:italic;font-size:0.88rem;">No rounds logged yet.</div>';return;}
  document.getElementById('shareRoundList').innerHTML=rounds.slice().reverse().map(function(r){
    var ov=r.score-r.par,ovS=ov===0?'E':(ov>0?'+'+ov:''+ov);
    return '<div class="share-round-item" data-id="'+r.id+'">'+
      '<div style="font-weight:600;color:var(--augusta-deep);font-size:0.88rem;">'+r.course+'</div>'+
      '<div style="display:flex;gap:12px;margin-top:4px;font-size:0.78rem;color:var(--text-muted);">'+
        '<span>'+fDate(r.date)+'</span>'+
        '<span>Score: <strong style="color:var(--augusta-deep);">'+r.score+'</strong></span>'+
        '<span>'+ovS+'</span>'+
        '<span>Diff: '+parseFloat(r.diff).toFixed(1)+'</span>'+
      '</div>'+
    '</div>';
  }).join('');
}

function selectShareRound(id){
  selectedShareRound=rounds.find(function(r){return r.id===id;});
  document.querySelectorAll('.share-round-item').forEach(function(el){el.classList.toggle('selected',el.dataset.id===id);});
  if(!selectedShareRound) return;
  document.getElementById('scorecardEmpty').style.display='none';
  document.getElementById('scorecardPreview').style.display='block';
  drawScorecard(selectedShareRound);
}

function scWrap(ctx,text,maxW,maxLines){
  var words=String(text).split(' '),lines=[],cur='';
  for(var i=0;i<words.length;i++){
    var test=cur?cur+' '+words[i]:words[i];
    if(ctx.measureText(test).width>maxW&&cur){ lines.push(cur); cur=words[i]; }
    else cur=test;
  }
  if(cur) lines.push(cur);
  if(lines.length>maxLines){
    lines=lines.slice(0,maxLines);
    var last=lines[maxLines-1];
    while(ctx.measureText(last+'…').width>maxW&&last.length){ last=last.slice(0,-1); }
    lines[maxLines-1]=last+'…';
  }
  return lines;
}

function drawScorecard(r){
  var canvas=document.getElementById('scorecardCanvas');
  var scale=2, W=540, H=675;
  canvas.width=W*scale; canvas.height=H*scale;
  canvas.style.width='100%'; canvas.style.aspectRatio='540 / 675';
  var ctx=canvas.getContext('2d');
  ctx.scale(scale,scale);

  var ov=r.score-r.par;
  var accent=ov<0?'#5ad65a':ov>0?'#ff6b6b':'#e8c97a';
  var P=44;

  // Background + glow
  ctx.fillStyle='#0a0a0b'; ctx.fillRect(0,0,W,H);
  var g=ctx.createRadialGradient(W*0.82,H*0.10,10,W*0.82,H*0.10,W*0.95);
  g.addColorStop(0,'rgba(47,158,91,0.30)'); g.addColorStop(1,'rgba(47,158,91,0)');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  var g2=ctx.createRadialGradient(W*0.1,H*0.96,10,W*0.1,H*0.96,W*0.8);
  g2.addColorStop(0,'rgba(255,255,255,0.05)'); g2.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g2; ctx.fillRect(0,0,W,H);

  // Top row
  ctx.textBaseline='alphabetic';
  ctx.textAlign='left'; ctx.fillStyle='#fff'; ctx.font='800 26px Inter, sans-serif';
  try{ctx.letterSpacing='1px';}catch(e){}
  ctx.fillText('LMG',P,68);
  ctx.textAlign='right'; ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='700 11px Inter, sans-serif';
  try{ctx.letterSpacing='3px';}catch(e){}
  ctx.fillText('ROUND CARD',W-P,64);
  try{ctx.letterSpacing='0px';}catch(e){}

  // Course + date
  ctx.textAlign='left'; ctx.fillStyle='#fff'; ctx.font='800 34px Inter, sans-serif';
  var lines=scWrap(ctx,r.course,W-P*2,2), cy=132;
  lines.forEach(function(ln){ ctx.fillText(ln,P,cy); cy+=38; });
  ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.font='500 15px Inter, sans-serif';
  ctx.fillText(fDate(r.date)+(r.holes_played===9?'  ·  9 holes':''),P,cy);

  // Hero score
  ctx.textAlign='center';
  ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.font='700 12px Inter, sans-serif';
  try{ctx.letterSpacing='3px';}catch(e){}
  ctx.fillText('SCORE',W/2,300);
  try{ctx.letterSpacing='0px';}catch(e){}
  ctx.fillStyle='#fff'; ctx.font='800 150px Inter, sans-serif';
  try{ctx.letterSpacing='-4px';}catch(e){}
  ctx.fillText(String(r.score),W/2,422);
  try{ctx.letterSpacing='0px';}catch(e){}
  var vsTxt=ov===0?'LEVEL PAR':(Math.abs(ov)+(ov<0?' UNDER PAR':' OVER PAR'));
  ctx.fillStyle=accent; ctx.font='800 22px Inter, sans-serif';
  ctx.fillText(vsTxt,W/2,458);

  // Stats row
  ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(P,512);ctx.lineTo(W-P,512);ctx.stroke();
  var hcp=calcHcp(rounds), hcpStr=hcp!==null?(hcp<=0?'+'+Math.abs(hcp):hcp.toFixed(1)):'—';
  var stats=[{l:'PAR',v:String(r.par)},{l:'DIFFERENTIAL',v:parseFloat(r.diff).toFixed(1)},{l:'HANDICAP',v:hcpStr}];
  var colW=(W-P*2)/3;
  stats.forEach(function(s,i){
    var x=P+colW*i+colW/2;
    ctx.fillStyle='#fff'; ctx.font='800 30px Inter, sans-serif'; ctx.textAlign='center';
    ctx.fillText(s.v,x,572);
    ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='600 10px Inter, sans-serif';
    try{ctx.letterSpacing='1.5px';}catch(e){}
    ctx.fillText(s.l,x,594);
    try{ctx.letterSpacing='0px';}catch(e){}
  });

  // Footer
  ctx.fillStyle=accent; ctx.fillRect(0,H-6,W,6);
  ctx.textAlign='left'; ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.font='700 13px Inter, sans-serif';
  ctx.fillText('logmygolf.com',P,H-28);
  var myName=(currentUser&&currentUser.user_metadata&&currentUser.user_metadata.display_name)||'';
  if(myName){ ctx.textAlign='right'; ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='500 13px Inter, sans-serif'; ctx.fillText(myName,W-P,H-28); }
}

function downloadScorecard(){
  if(!selectedShareRound) return;
  var canvas=document.getElementById('scorecardCanvas');
  var link=document.createElement('a');
  link.download='golf-log-'+selectedShareRound.course.replace(/\s+/g,'-').toLowerCase()+'.png';
  link.href=canvas.toDataURL('image/png');
  link.click();
  toast('Scorecard downloaded ✓');
}

// ── MILESTONE CELEBRATIONS ────────────────────────────────────────────────
var celebrateRoundId=null;

function maybeCelebrate(round){
  if(!round) return;
  var id=round.id;
  if(rounds.length===1){ celebrate('First round logged!','Welcome to LMG — '+round.course+'. Your handicap journey starts here.',id); return; }
  var is18=round.holes_played!==9;
  if(is18){
    var prev18=rounds.filter(function(r){return r.id!==id&&r.holes_played!==9;});
    var thresholds=[70,80,90,100];
    for(var i=0;i<thresholds.length;i++){
      var t=thresholds[i];
      if(round.score<t&&!prev18.some(function(r){return r.score<t;})){
        celebrate('You broke '+t+'!','First time under '+t+' — '+round.score+' at '+round.course+'.',id); return;
      }
    }
    if(prev18.length){
      var prevMin=Math.min.apply(null,prev18.map(function(r){return r.score;}));
      if(round.score<prevMin){ celebrate('New Personal Best!',round.score+' at '+round.course+' — your lowest 18-hole round yet.',id); return; }
    }
  }
  if(rounds.length===10){ celebrate('10 rounds logged!','You\'ve got a real handicap now. Keep it rolling.',id); return; }
  if(rounds.length===25){ celebrate('25 rounds!','A quarter-century of golf in the books.',id); return; }
  if(rounds.length===50){ celebrate('50 rounds!','That is serious dedication to the game.',id); return; }
}

function celebrate(title,sub,roundId){
  document.getElementById('celebrateTitle').textContent=title;
  document.getElementById('celebrateSub').textContent=sub;
  celebrateRoundId=roundId||null;
  document.getElementById('celebrateOverlay').style.display='flex';
  setTimeout(fireConfetti,40);
}
function closeCelebrate(){ document.getElementById('celebrateOverlay').style.display='none'; }
function shareCelebratedRound(){
  var rid=celebrateRoundId;
  closeCelebrate();
  if(!rid) return;
  showSection('social',document.getElementById('navSocial'));
  setTimeout(function(){ showSocialTab('sfShare'); setTimeout(function(){ selectShareRound(rid); },120); },100);
}

function fireConfetti(){
  var c=document.getElementById('confettiCanvas');
  if(!c) return;
  var W=c.width=c.offsetWidth, H=c.height=c.offsetHeight;
  var ctx=c.getContext('2d');
  var colors=['#2f9e5b','#5ad65a','#e8c97a','#ffffff','#7de87d'];
  var parts=[];
  for(var i=0;i<150;i++){
    parts.push({x:W/2+(Math.random()-0.5)*140,y:H*0.42,vx:(Math.random()-0.5)*13,vy:Math.random()*-15-5,g:0.32+Math.random()*0.22,w:5+Math.random()*6,c:colors[(Math.random()*colors.length)|0],rot:Math.random()*6.28,vr:(Math.random()-0.5)*0.45});
  }
  var start=performance.now();
  function frame(t){
    var el=t-start;
    ctx.clearRect(0,0,W,H);
    var alpha=el<1800?1:Math.max(0,1-(el-1800)/900);
    parts.forEach(function(p){
      p.vy+=p.g; p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.globalAlpha=alpha; ctx.fillStyle=p.c;
      ctx.fillRect(-p.w/2,-p.w/2,p.w,p.w*0.55);
      ctx.restore();
    });
    if(el<2700&&document.getElementById('celebrateOverlay').style.display!=='none') requestAnimationFrame(frame);
    else ctx.clearRect(0,0,W,H);
  }
  requestAnimationFrame(frame);
}

