// ── STATS ─────────────────────────────────────────────────────────────────
var hcpHistoryChartObj=null, breakdownChartObj=null, statTrendChartObj=null, currentStatChart='putts';

function renderStats(){
  renderHcpGauge();
  if(!rounds.length) return;
  // Small delay ensures canvas elements are painted and sized before Chart.js runs
  setTimeout(function(){
    renderHcpHistory();
    renderBreakdown();
    renderStatTrend('putts');
  }, 50);
}

function renderHcpGauge(){
  var el=document.getElementById('hcpGauge'); if(!el) return;
  var hcp=calcHcp(rounds);
  var R=84, circ=2*Math.PI*R, track=circ*0.75;
  var frac=hcp===null?0:Math.max(0,Math.min(1,(36-hcp)/36));
  var fill=track*frac;
  var col=hcp===null?'rgba(255,255,255,0.25)':(hcp<5?'#5ad65a':hcp<15?'#2f9e5b':'#3fb06b');
  var hcpStr=hcp===null?'—':(hcp<=0?'+'+Math.abs(hcp):hcp.toFixed(1));
  el.innerHTML='<svg viewBox="0 0 200 200" style="width:210px;max-width:62%;height:auto;">'+
    '<circle cx="100" cy="100" r="84" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="14" stroke-linecap="round" stroke-dasharray="'+track+' '+circ+'" transform="rotate(135 100 100)"/>'+
    '<circle cx="100" cy="100" r="84" fill="none" stroke="'+col+'" stroke-width="14" stroke-linecap="round" stroke-dasharray="'+fill+' '+circ+'" transform="rotate(135 100 100)"/>'+
    '<text x="100" y="96" text-anchor="middle" fill="#fff" font-family="Inter,sans-serif" font-size="46" font-weight="800" letter-spacing="-1">'+hcpStr+'</text>'+
    '<text x="100" y="120" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-family="Inter,sans-serif" font-size="9.5" font-weight="600" letter-spacing="1.5">HANDICAP INDEX</text>'+
  '</svg>';
  var sub=document.getElementById('hcpGaugeSub');
  if(sub){
    if(hcp===null){ sub.textContent=rounds.length+' of 3 rounds needed to calculate'; }
    else { var bd=Math.min.apply(null,rounds.map(function(r){return r.diff;})); sub.textContent='Best differential '+parseFloat(bd).toFixed(1)+' · '+rounds.length+' rounds logged'; }
  }
}

function renderHcpHistory(){
  var ctx=document.getElementById('hcpHistoryChart').getContext('2d');
  if(hcpHistoryChartObj) hcpHistoryChartObj.destroy();
  // Calculate handicap after each round
  var labels=[], data=[];
  rounds.forEach(function(_,i){
    var slice=rounds.slice(0,i+1);
    var h=calcHcp(slice);
    if(h!==null){labels.push(rounds[i].course.length>10?rounds[i].course.slice(0,10)+'…':rounds[i].course);data.push(h);}
  });
  hcpHistoryChartObj=new Chart(ctx,{
    type:'line',
    data:{
      labels:labels,
      datasets:[{label:'Handicap Index',data:data,borderColor:'#c9a84c',backgroundColor:'rgba(47,158,91,0.08)',pointBackgroundColor:'#c9a84c',pointBorderColor:'#fff',pointBorderWidth:2,pointRadius:4,borderWidth:2,tension:0.35,fill:true}]
    },
    options:{responsive:true,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{backgroundColor:'#161719',bodyFont:{family:'Inter',size:12},padding:10,cornerRadius:2}},scales:{x:{ticks:{font:{family:'Inter',size:10,weight:'600'},color:'#aaa',maxRotation:30},grid:{color:'rgba(255,255,255,0.05)'},border:{display:false}},y:{ticks:{font:{family:'Inter',size:10,weight:'600'},color:'#aaa'},grid:{color:'rgba(255,255,255,0.05)'},border:{display:false},reverse:false}}}
  });
}

function renderBreakdown(){
  // Count score types vs par using score-par diff per round
  // Eagles(-2+), Birdies(-1), Pars(0), Bogeys(+1), Doubles(+2), Worse(+3+)
  // We only have total score vs par — so use that as approximation
  var counts={eagle:0,birdie:0,par:0,bogey:0,double:0,worse:0};
  rounds.forEach(function(r){
    var diff=r.score-r.par;
    if(diff<=-2) counts.eagle++;
    else if(diff===-1) counts.birdie++;
    else if(diff===0) counts.par++;
    else if(diff===1) counts.bogey++;
    else if(diff===2) counts.double++;
    else counts.worse++;
  });
  var ctx=document.getElementById('breakdownChart').getContext('2d');
  if(breakdownChartObj) breakdownChartObj.destroy();
  var labels=['Eagle or better','Birdie','Par','Bogey','Double','Triple+'];
  var values=[counts.eagle,counts.birdie,counts.par,counts.bogey,counts.double,counts.worse];
  var colors=['#e8c97a','#5ad65a','#2f9e5b','#b08a5a','#ff6b6b','#a04545'];
  breakdownChartObj=new Chart(ctx,{
    type:'doughnut',
    data:{labels:labels,datasets:[{data:values,backgroundColor:colors,borderWidth:2,borderColor:'#161719'}]},
    options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false},tooltip:{backgroundColor:'#161719',bodyFont:{family:'Inter',size:12},padding:10,cornerRadius:2}},cutout:'60%'}
  });
  // Legend
  var leg=document.getElementById('breakdownLegend');
  leg.innerHTML=labels.map(function(l,i){
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'+
      '<div style="width:10px;height:10px;border-radius:50%;background:'+colors[i]+';flex-shrink:0;"></div>'+
      '<span style="font-size:0.78rem;color:var(--text-mid);">'+l+'</span>'+
      '<span style="margin-left:auto;font-family:\'Inter\',serif;font-size:1rem;font-weight:700;color:var(--augusta-deep);">'+values[i]+'</span>'+
    '</div>';
  }).join('');
}

// ── ROUND CALENDAR ───────────────────────────────────────────────────────
var calYear=new Date().getFullYear(), calMonth=new Date().getMonth();

function initCalendar(){
  // Attach prev/next buttons once
  var prev=document.getElementById('calPrev');
  var next=document.getElementById('calNext');
  if(prev&&!prev._bound){
    prev._bound=true;
    prev.addEventListener('click',function(){
      calMonth--;
      if(calMonth<0){calMonth=11;calYear--;}
      renderCalendar();
    });
  }
  if(next&&!next._bound){
    next._bound=true;
    next.addEventListener('click',function(){
      calMonth++;
      if(calMonth>11){calMonth=0;calYear++;}
      renderCalendar();
    });
  }
  renderCalendar();
}

function renderCalendar(){
  var grid=document.getElementById('calGrid');
  var label=document.getElementById('calMonthLabel');
  var detail=document.getElementById('calDayDetail');
  var summary=document.getElementById('calSummary');
  if(!grid) return;

  var monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
  label.textContent=monthNames[calMonth]+' '+calYear;
  detail.style.display='none';

  // Build a map: "YYYY-MM-DD" → [rounds]
  var roundMap={};
  rounds.forEach(function(r){
    var key=r.date.slice(0,10);
    if(!roundMap[key]) roundMap[key]=[];
    roundMap[key].push(r);
  });

  // First day of month (Monday=0 based)
  var first=new Date(calYear,calMonth,1);
  var startDow=first.getDay(); // 0=Sun
  // Convert to Mon-start: Mon=0 … Sun=6
  var offset=(startDow+6)%7;
  var daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  var today=new Date();
  var todayKey=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');

  var cells='';
  // Leading empty cells from previous month
  var prevDays=new Date(calYear,calMonth,0).getDate();
  for(var i=0;i<offset;i++){
    var d=prevDays-offset+1+i;
    cells+='<div class="cal-day other-month"><div class="cal-day-num">'+d+'</div></div>';
  }
  // Days of this month
  for(var d=1;d<=daysInMonth;d++){
    var key=calYear+'-'+String(calMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    var dayRounds=roundMap[key]||[];
    var hasRound=dayRounds.length>0;
    var isToday=key===todayKey;
    var cls='cal-day'+(hasRound?' has-round':'')+(isToday?' today':'');
    var inner='<div class="cal-day-num">'+d+'</div>';
    if(hasRound){
      inner+='<div class="cal-round-dot"></div>';
      inner+='<div class="cal-round-mini">'+dayRounds[0].course+(dayRounds.length>1?' +'+( dayRounds.length-1):'')+'</div>';
    }
    cells+='<div class="'+cls+'" data-key="'+key+'" data-date="'+d+'">'+inner+'</div>';
  }
  // Trailing cells to complete last row
  var total=offset+daysInMonth;
  var trailing=(7-total%7)%7;
  for(var t=1;t<=trailing;t++){
    cells+='<div class="cal-day other-month"><div class="cal-day-num">'+t+'</div></div>';
  }
  grid.innerHTML=cells;

  // Click handler for days with rounds
  grid.querySelectorAll('.cal-day.has-round').forEach(function(cell){
    cell.addEventListener('click',function(){
      grid.querySelectorAll('.cal-day').forEach(function(c){c.classList.remove('selected');});
      this.classList.add('selected');
      var key=this.dataset.key;
      var dayRounds=roundMap[key]||[];
      var parts=key.split('-');
      var dateStr=parseInt(parts[2])+'/'+parseInt(parts[1])+'/'+parts[0];
      detail.style.display='block';
      detail.innerHTML=dayRounds.map(function(r){
        var ov=r.score-r.par, ovS=ov===0?'E':(ov>0?'+'+ov:''+ov);
        var cls=ov<0?'var(--under)':ov>0?'var(--over)':'var(--gold)';
        return '<div style="display:flex;align-items:center;gap:12px;'+(dayRounds.length>1?'padding-bottom:10px;border-bottom:1px solid var(--border);margin-bottom:10px;':'')+'">'+
          
          '<div style="flex:1;">'+
            '<div style="font-weight:700;color:var(--augusta-deep);font-size:0.9rem;">'+r.course+'</div>'+
            '<div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px;">'+dateStr+' · '+r.holes_played+'H · Par '+r.par+'</div>'+
          '</div>'+
          '<div style="text-align:right;">'+
            '<div style="font-family:\'Inter\',serif;font-size:1.6rem;font-weight:700;color:var(--augusta-deep);line-height:1;">'+r.score+'</div>'+
            '<div style="font-size:0.72rem;font-weight:700;color:'+cls+';">'+ovS+'</div>'+
          '</div>'+
        '</div>';
      }).join('');
    });
  });

  // Month summary bar
  var monthRounds=rounds.filter(function(r){
    var d=new Date(r.date+'T12:00:00');
    return d.getFullYear()===calYear&&d.getMonth()===calMonth;
  });
  if(monthRounds.length){
    var best=monthRounds.reduce(function(a,b){return a.score<b.score?a:b;});
    var avgS=Math.round(monthRounds.reduce(function(a,r){return a+r.score;},0)/monthRounds.length);
    summary.innerHTML=[
      {val:monthRounds.length,lbl:'Rounds'},
      {val:best.score,lbl:'Best Score'},
      {val:avgS,lbl:'Avg Score'},
      {val:parseFloat(Math.min.apply(null,monthRounds.map(function(r){return r.diff;}))).toFixed(1),lbl:'Best Diff'}
    ].map(function(s){
      return '<div style="flex:1;min-width:80px;background:var(--panel);border-radius:var(--radius);padding:10px 12px;text-align:center;">'+
        '<div style="font-family:\'Inter\',serif;font-size:1.5rem;font-weight:700;color:var(--augusta-deep);">'+s.val+'</div>'+
        '<div style="font-family:\'Inter\',sans-serif;font-size:0.58rem;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:var(--text-muted);margin-top:2px;">'+s.lbl+'</div>'+
      '</div>';
    }).join('');
  } else {
    summary.innerHTML='<div style="font-size:0.82rem;color:var(--text-muted);font-style:italic;">No rounds logged in '+monthNames[calMonth]+'.</div>';
  }
}

function setStatChart(type,btn){
  currentStatChart=type;
  document.querySelectorAll('#statChartPutts,#statChartFairways,#statChartGIR,#statChartPenalties').forEach(function(b){b.classList.remove('active');});
  if(btn) btn.classList.add('active');
  renderStatTrend(type);
}

function renderStatTrend(type){
  var ctx=document.getElementById('statTrendChart').getContext('2d');
  if(statTrendChartObj) statTrendChartObj.destroy();
  var map={putts:{key:'putts',label:'Putts',color:'#2f9e5b'},fairways:{key:'fairways_hit',label:'Fairways Hit',color:'#e8c97a'},gir:{key:'greens_in_regulation',label:'Greens in Regulation',color:'#5ad65a'},penalties:{key:'penalties',label:'Penalties',color:'#ff6b6b'}};
  var cfg=map[type];
  var data=rounds.filter(function(r){return r[cfg.key]!=null;});
  statTrendChartObj=new Chart(ctx,{
    type:'bar',
    data:{
      labels:data.map(function(r){return r.course.length>12?r.course.slice(0,12)+'…':r.course;}),
      datasets:[{label:cfg.label,data:data.map(function(r){return r[cfg.key];}),backgroundColor:cfg.color+'33',borderColor:cfg.color,borderWidth:2,borderRadius:2}]
    },
    options:{responsive:true,plugins:{legend:{display:false},tooltip:{backgroundColor:'#161719',bodyFont:{family:'Inter',size:12},padding:10,cornerRadius:2}},scales:{x:{ticks:{font:{family:'Inter',size:10,weight:'600'},color:'#aaa',maxRotation:30},grid:{display:false},border:{display:false}},y:{ticks:{font:{family:'Inter',size:10,weight:'600'},color:'#aaa'},grid:{color:'rgba(255,255,255,0.05)'},border:{display:false}}}}
  });
}

function runCalculator(){
  var hcp=calcHcp(rounds);
  var rating=parseFloat(document.getElementById('calcRating').value);
  var slope=parseInt(document.getElementById('calcSlope').value);
  var par=parseInt(document.getElementById('calcPar').value);
  if(!rating||!slope||!par){toast('Please fill in all three fields.');return;}
  if(hcp===null){toast('You need at least 3 rounds to calculate a playing handicap.');return;}
  // WHS Playing Handicap = Handicap Index × (Slope/113) + (Course Rating - Par)
  var playingHcp=Math.round(hcp*(slope/113)+(rating-par));
  var targetScore=par+playingHcp;
  // Stableford points = 36 + playing handicap (approx for 18 holes at par)
  var stableford=36+playingHcp;
  document.getElementById('calcPlayingHcp').textContent=playingHcp;
  document.getElementById('calcTargetScore').textContent=targetScore;
  document.getElementById('calcStableford').textContent=stableford;
  document.getElementById('calcResult').style.display='grid';
}

