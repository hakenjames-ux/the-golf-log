// ── PHASE 4: REVIEWS & WEATHER ────────────────────────────────────────────
var starRatings={overall:0,condition:0,value:0,difficulty:0};
var currentReviewCourseId=null;
var currentReviewCourseName=null;

function buildStarRows(){
  ['overall','condition','value','difficulty'].forEach(function(field){
    var row=document.getElementById('stars'+field.charAt(0).toUpperCase()+field.slice(1));
    if(!row) return;
    row.innerHTML=[1,2,3,4,5].map(function(v){
      return '<button class="star-btn" data-field="'+field+'" data-val="'+v+'">★</button>';
    }).join('');
  });
}

function setStarRating(field,val){
  starRatings[field]=val;
  var row=document.getElementById('stars'+field.charAt(0).toUpperCase()+field.slice(1));
  if(!row) return;
  row.querySelectorAll('.star-btn').forEach(function(btn){
    btn.classList.toggle('active',parseInt(btn.dataset.val)<=val);
  });
}

function resetStars(){
  starRatings={overall:0,condition:0,value:0,difficulty:0};
  ['overall','condition','value','difficulty'].forEach(function(field){
    var row=document.getElementById('stars'+field.charAt(0).toUpperCase()+field.slice(1));
    if(row) row.querySelectorAll('.star-btn').forEach(function(b){b.classList.remove('active');});
  });
}

async function openReviewModal(courseId,courseName,loc,county){
  currentReviewCourseId=courseId;
  currentReviewCourseName=courseName;
  document.getElementById('reviewCourseId').value=courseId;
  document.getElementById('reviewModalTitle').textContent=courseName;
  document.getElementById('reviewModalSub').textContent=loc+(county?', '+county:'');
  document.getElementById('reviewComment').value='';
  resetStars();
  buildStarRows();
  initCoursePhotoInput();
  loadCoursePhotos(courseId);
  document.getElementById('reviewModal').style.display='flex';
  // Load existing reviews
  var r=await sb.from('course_reviews').select('*').eq('course_id',courseId).order('created_at',{ascending:false});
  var revs=r.data||[];
  var el=document.getElementById('existingReviews');
  if(!revs.length){el.innerHTML='<div style="color:var(--text-muted);font-style:italic;font-size:0.82rem;">No reviews yet — be the first!</div>';return;}
  el.innerHTML='<div style="font-family:\'Inter\',sans-serif;font-size:0.65rem;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px;">'+revs.length+' Review'+(revs.length!==1?'s':'')+'</div>'+
  revs.map(function(rv){
    var stars='★'.repeat(rv.overall||0)+'☆'.repeat(5-(rv.overall||0));
    return '<div class="review-item">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">'+
        '<span class="review-author">'+( rv.display_name||'Golfer')+'</span>'+
        '<span class="review-stars">'+stars+'</span>'+
      '</div>'+
      (rv.comment?'<div class="review-comment">'+rv.comment+'</div>':'')+
      '<div style="display:flex;gap:12px;margin-top:6px;">'+
        (rv.condition?'<span style="font-size:0.7rem;color:var(--text-muted);">Condition: '+'★'.repeat(rv.condition)+'</span>':'')+
        (rv.value?'<span style="font-size:0.7rem;color:var(--text-muted);">Value: '+'★'.repeat(rv.value)+'</span>':'')+
        (rv.difficulty?'<span style="font-size:0.7rem;color:var(--text-muted);">Difficulty: '+'★'.repeat(rv.difficulty)+'</span>':'')+
      '</div>'+
    '</div>';
  }).join('');
  // Pre-fill if user already reviewed
  var mine=revs.find(function(rv){return rv.user_id===currentUser.id;});
  if(mine){
    if(mine.overall) setStarRating('overall',mine.overall);
    if(mine.condition) setStarRating('condition',mine.condition);
    if(mine.value) setStarRating('value',mine.value);
    if(mine.difficulty) setStarRating('difficulty',mine.difficulty);
    if(mine.comment) document.getElementById('reviewComment').value=mine.comment;
  }
}

function closeReviewModal(){
  document.getElementById('reviewModal').style.display='none';
  currentReviewCourseId=null;
}

// ── COURSE PHOTOS ─────────────────────────────────────────────────────────
function initCoursePhotoInput(){
  var input=document.getElementById('coursePhotoInput');
  if(!input||input._bound) return;
  input._bound=true;
  input.addEventListener('change',function(){
    var file=this.files[0];
    if(file) uploadCoursePhoto(file);
    this.value='';
  });
}

async function loadCoursePhotos(courseId){
  var el=document.getElementById('coursePhotoGallery');
  if(!el) return;
  el.innerHTML='<div class="skel" style="width:72px;height:72px;"></div><div class="skel" style="width:72px;height:72px;"></div><div class="skel" style="width:72px;height:72px;"></div>';
  var r=await sb.from('course_photos').select('*').eq('course_id',courseId).order('created_at',{ascending:false});
  var photos=(r.data)||[];
  if(!photos.length){ el.innerHTML='<div style="font-size:0.78rem;color:var(--text-muted);font-style:italic;">No photos yet — be the first to add one.</div>'; return; }
  el.innerHTML=photos.map(function(p){
    return '<a href="'+p.url+'" target="_blank" title="'+(p.display_name||'')+'" style="display:block;"><img src="'+p.url+'" style="width:72px;height:72px;object-fit:cover;border-radius:6px;border:1px solid var(--border);"></a>';
  }).join('');
}

var PHOTO_MIME={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',gif:'image/gif',webp:'image/webp',heic:'image/heic',heif:'image/heif'};

// Shared: upload one image to a course's gallery (handles iPhone HEIC / empty mime)
async function uploadPhotoForCourse(file,courseId,courseName){
  if(!file||!courseId) return false;
  if(file.size>15*1024*1024){toast(file.name+' is too large (max 15MB) — skipped.');return false;}
  var ext=((file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,''))||'jpg';
  var contentType=file.type||PHOTO_MIME[ext]||'image/jpeg';
  var path=courseId+'/'+currentUser.id+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)+'.'+ext;
  var up=await sb.storage.from('course-photos').upload(path,file,{contentType:contentType});
  if(up.error){toast('Photo upload failed: '+up.error.message);return false;}
  var pub=sb.storage.from('course-photos').getPublicUrl(path);
  var dname=(currentUser.user_metadata&&currentUser.user_metadata.display_name)||currentUser.email.split('@')[0];
  var ins=await sb.from('course_photos').insert({course_id:courseId,course_name:courseName,user_id:currentUser.id,display_name:dname,url:pub.data.publicUrl});
  if(ins.error){toast('Photo save failed: '+ins.error.message);return false;}
  return true;
}

async function uploadCoursePhoto(file){
  if(!currentReviewCourseId) return;
  toast('Uploading photo…');
  var ok=await uploadPhotoForCourse(file,currentReviewCourseId,currentReviewCourseName);
  if(ok){ toast('Photo added ✓'); loadCoursePhotos(currentReviewCourseId); }
}

// ── ROUND PHOTOS (staged in the Log a Round modal) ────────────────────────
var pendingRoundPhotos=[];
function initRoundPhotoInput(){
  var input=document.getElementById('roundPhotoInput');
  if(!input||input._bound) return;
  input._bound=true;
  input.addEventListener('change',function(){
    for(var i=0;i<this.files.length;i++){ pendingRoundPhotos.push(this.files[i]); }
    this.value='';
    renderRoundPhotoPreview();
  });
}
function renderRoundPhotoPreview(){
  var el=document.getElementById('roundPhotoPreview');
  if(!el) return;
  el.innerHTML=pendingRoundPhotos.map(function(f,i){
    var url=URL.createObjectURL(f);
    return '<div style="position:relative;width:64px;height:64px;">'+
      '<img src="'+url+'" style="width:64px;height:64px;object-fit:cover;border-radius:6px;border:1px solid var(--border);">'+
      '<button type="button" class="round-photo-remove" data-idx="'+i+'" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--over);color:#fff;border:none;cursor:pointer;font-size:0.7rem;line-height:1;">✕</button>'+
    '</div>';
  }).join('');
}
function removePendingRoundPhoto(idx){
  pendingRoundPhotos.splice(idx,1);
  renderRoundPhotoPreview();
}
function clearRoundPhotos(){
  pendingRoundPhotos=[];
  renderRoundPhotoPreview();
}

async function loadMyPhotos(){
  var grid=document.getElementById('myPhotosGrid');
  if(!grid) return;
  var r=await sb.from('course_photos').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false});
  var photos=(r.data)||[];
  var cnt=document.getElementById('myPhotoCount'); if(cnt) cnt.textContent=photos.length;
  if(!photos.length){ grid.innerHTML='<div style="font-size:0.82rem;color:var(--text-muted);font-style:italic;">No photos yet. Add some from a course’s Review window.</div>'; return; }
  grid.innerHTML=photos.map(function(p){
    return '<div style="position:relative;">'+
      '<a href="'+p.url+'" target="_blank" style="display:block;">'+
        '<img src="'+p.url+'" style="width:100%;height:90px;object-fit:cover;border-radius:6px;border:1px solid var(--border);">'+
        '<div style="font-size:0.62rem;color:var(--text-muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(p.course_name||'')+'</div>'+
      '</a>'+
      '<button class="my-photo-del" data-id="'+p.id+'" data-url="'+p.url+'" title="Remove photo" style="position:absolute;top:5px;right:5px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,0.62);color:#fff;border:none;cursor:pointer;font-size:0.68rem;line-height:1;display:flex;align-items:center;justify-content:center;">✕</button>'+
    '</div>';
  }).join('');
}

function storagePathFromUrl(url){
  var marker='/course-photos/';
  var i=url.indexOf(marker);
  if(i<0) return null;
  return url.slice(i+marker.length).split('?')[0];
}

async function deleteMyPhoto(id,url){
  if(!confirm('Remove this photo? It will be removed from your profile and the course gallery.')) return;
  var del=await sb.from('course_photos').delete().eq('id',id).eq('user_id',currentUser.id);
  if(del.error){toast('Error removing photo: '+del.error.message);return;}
  var path=storagePathFromUrl(url);
  if(path){ try{ await sb.storage.from('course-photos').remove([path]); }catch(e){} }
  toast('Photo removed');
  loadMyPhotos();
}

async function submitReview(){
  if(!currentReviewCourseId){toast('No course selected.');return;}
  if(!starRatings.overall){toast('Please give an overall star rating.');return;}
  var dname=(currentUser.user_metadata&&currentUser.user_metadata.display_name)||currentUser.email.split('@')[0];
  var payload={
    course_id:currentReviewCourseId,user_id:currentUser.id,display_name:dname,
    overall:starRatings.overall||null,condition:starRatings.condition||null,
    value:starRatings.value||null,difficulty:starRatings.difficulty||null,
    comment:document.getElementById('reviewComment').value.trim()||null
  };
  var r=await sb.from('course_reviews').upsert(payload,{onConflict:'user_id,course_id'});
  if(r.error){toast('Error: '+r.error.message);return;}
  toast('Review submitted ✓');
  closeReviewModal();
  renderCoursesBrowser();
}

function bookTeeTime(name,loc){
  // Search Google for the course booking page
  var query=encodeURIComponent(name+' '+(loc||'')+' tee time booking');
  window.open('https://www.google.com/search?q='+query,'_blank');
}

// ── WEATHER ────────────────────────────────────────────────────────────────
var WEATHER_KEY='demo'; // Uses open-meteo (free, no key needed)

function openWeatherModal(courseName,loc){
  document.getElementById('weatherModalTitle').textContent=courseName;
  document.getElementById('weatherSearchInput').value=loc||'';
  document.getElementById('weatherResult').style.display='none';
  document.getElementById('weatherError').style.display='none';
  document.getElementById('weatherLoading').style.display='none';
  document.getElementById('weatherModal').style.display='flex';
  // Auto-fetch for the course location
  if(loc) fetchWeatherForLocation(loc);
}

function closeWeatherModal(){
  document.getElementById('weatherModal').style.display='none';
}

function fetchWeatherBySearch(){
  var q=document.getElementById('weatherSearchInput').value.trim();
  if(!q){toast('Please enter a location.');return;}
  fetchWeatherForLocation(q);
}

function fetchWeatherByLocation(){
  if(!navigator.geolocation){toast('Geolocation not supported by your browser.');return;}
  showWeatherLoading();
  navigator.geolocation.getCurrentPosition(function(pos){
    fetchWeatherByCoords(pos.coords.latitude,pos.coords.longitude,'Your Location');
  },function(){
    hideWeatherLoading();
    showWeatherError('Could not get your location. Please search manually.');
  });
}

function showWeatherLoading(){
  document.getElementById('weatherLoading').style.display='block';
  document.getElementById('weatherResult').style.display='none';
  document.getElementById('weatherError').style.display='none';
}
function hideWeatherLoading(){document.getElementById('weatherLoading').style.display='none';}
function showWeatherError(msg){document.getElementById('weatherError').textContent=msg;document.getElementById('weatherError').style.display='block';hideWeatherLoading();}

async function fetchWeatherForLocation(locationName){
  showWeatherLoading();
  try{
    // Geocode using Open-Meteo's geocoding API (free, no key)
    var geoUrl='https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(locationName)+'&count=1&language=en&format=json';
    var geoRes=await fetch(geoUrl);
    var geoData=await geoRes.json();
    if(!geoData.results||!geoData.results.length){showWeatherError('Location "'+locationName+'" not found. Try a nearby town.');return;}
    var geo=geoData.results[0];
    fetchWeatherByCoords(geo.latitude,geo.longitude,geo.name+(geo.country?', '+geo.country:''));
  }catch(e){showWeatherError('Error fetching location: '+e.message);}
}

async function fetchWeatherByCoords(lat,lon,locName){
  try{
    var url='https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=mph&temperature_unit=celsius&timezone=auto';
    var res=await fetch(url);
    var data=await res.json();
    hideWeatherLoading();
    if(!data.current){showWeatherError('Could not fetch weather data.');return;}
    var c=data.current;
    var iconMap={0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',51:'🌦',53:'🌦',55:'🌧',61:'🌧',63:'🌧',65:'🌧',71:'🌨',73:'🌨',75:'🌨',80:'🌦',81:'🌧',82:'🌧',95:'⛈',96:'⛈',99:'⛈'};
    var descMap={0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Icy fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',75:'Heavy snow',80:'Showers',81:'Heavy showers',82:'Violent showers',95:'Thunderstorm',96:'Thunderstorm',99:'Thunderstorm'};
    document.getElementById('weatherIcon').textContent=iconMap[c.weather_code]||'🌡';
    document.getElementById('weatherTemp').textContent=Math.round(c.temperature_2m)+'°C';
    document.getElementById('weatherDesc').textContent=descMap[c.weather_code]||'Unknown';
    document.getElementById('weatherLoc').textContent=locName;
    document.getElementById('weatherWind').textContent=Math.round(c.wind_speed_10m);
    document.getElementById('weatherHumidity').textContent=c.relative_humidity_2m+'%';
    document.getElementById('weatherFeels').textContent=Math.round(c.apparent_temperature)+'°C';
    document.getElementById('weatherResult').style.display='block';
  }catch(e){showWeatherError('Weather fetch failed: '+e.message);}
}

