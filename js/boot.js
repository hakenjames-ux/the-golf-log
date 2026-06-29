// ── BOOT ──────────────────────────────────────────────────────────────────
setTimeout(function(){
  try{ sb=supabase.createClient(SURL,SKEY); } catch(e){ showErr('Failed to connect: '+e.message); return; }
  var booted=false;
  sb.auth.getSession().then(function(r){
    if(r.data.session){booted=true;bootApp(r.data.session.user);}
  });
  sb.auth.onAuthStateChange(function(event,session){
    if(event==='SIGNED_IN'&&session&&!booted){booted=true;bootApp(session.user);}
    if(event==='TOKEN_REFRESHED'&&session) currentUser=session.user;
    if(event==='SIGNED_OUT') showAuthScreen();
  });
}, 200);

async function bootApp(u){
  currentUser=u;
  if(typeof Sentry!=='undefined'&&Sentry.getClient&&Sentry.getClient()){ Sentry.setUser({id:u.id}); }
  var name=u.user_metadata&&u.user_metadata.display_name ? u.user_metadata.display_name : u.email.split('@')[0];
  document.getElementById("userPill").textContent=name;
  var drawerName=document.getElementById("drawerUserName"); if(drawerName) drawerName.textContent=name;
  var dashName=document.getElementById("dashUserName"); if(dashName) dashName.textContent=name;
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appShell').style.display='block';
  document.getElementById('fDate').valueAsDate=new Date();
  buildHoles();
  await loadRounds();
  await loadFollowing();
  renderAll();
  initPhase8();
  // Navigate to the section in the URL hash (or default to dashboard)
  var startSection=location.hash.replace('#','').split('?')[0]||'dashboard';
  showSection(startSection,null,true);
  history.replaceState({section:startSection},'','#'+startSection);
  // First-run onboarding for brand-new users
  checkOnboarding();
}

function showAuthScreen(){
  currentUser=null; rounds=[];
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('appShell').style.display='none';
}

function showErr(msg){
  var el=document.getElementById('authError');
  if(el){ el.textContent=msg; el.style.display='block'; }
}

// ── EVENT DELEGATION ──────────────────────────────────────────────────────
document.addEventListener('click',function(e){
  var id=e.target.id;
  // Auth
  if(id==='tabLogin'){switchTab('login');return;}
  if(id==='tabRegister'){switchTab('register');return;}
  if(id==='loginBtn'){doLogin();return;}
  if(id==='registerBtn'){doRegister();return;}
  // Nav
  if(id==='signOutBtn'){doSignOut();return;}
  if(id==='navDashboard'){showSection('dashboard',e.target);return;}
  if(id==='navCourses'){showSection('courses',e.target);return;}
  if(id==='navLog'){openLogModal();return;}
  if(id==='celebrateShareBtn'){shareCelebratedRound();return;}
  if(id==='celebrateDoneBtn'||id==='celebrateOverlay'){closeCelebrate();return;}
  if(id==='navSocial'){showSection('social',e.target);return;}
  if(id==='navProfile'){showSection('profile',e.target);return;}
  // Stats / Leaderboard reachable via buttons (no longer top-nav)
  if(id==='dashStatsBtn'||id==='profileStatsBtn'){showSection('stats',null);return;}
  if(id==='statsBackBtn'){showSection('dashboard',document.getElementById('navDashboard'));return;}
  // Log modal
  if(id==='openLogModalBtn'){openLogModal();return;}
  if(id==='closeLogModalBtn'||e.target.id==='logRoundModal'){closeLogModal();return;}
  // Account settings
  if(id==='saveDisplayNameBtn'){saveDisplayName();return;}
  if(id==='changePasswordBtn'){changePassword();return;}
  if(id==='exportCsvBtn'){exportCsv();return;}
  if(id==='exportFullBtn'){exportFullProfile();return;}
  if(id==='deleteAccountBtn'){deleteAccount();return;}
  // Unified social tabs
  if(id==='sfFeed'||id==='sfMembers'||id==='sfLeaderboard'||id==='sfSocieties'||id==='sfCompete'||id==='sfShare'){showSocialTab(id);return;}
  // Compete sub-tabs
  if(id==='scChallenges'||id==='scTournaments'||id==='scMatchPlay'){showCompeteTab(id);return;}
  // Feed filter
  if(id==='feedFilterFollowing'){setFeedFilter('following',e.target);return;}
  if(id==='feedFilterAll'){setFeedFilter('all',e.target);return;}
  if(id==='refreshFeedBtn'){loadFeed();return;}
  // Likes
  var lb=e.target.closest('.like-btn');
  if(lb&&lb.dataset.id){toggleLike(lb.dataset.id,lb);return;}
  // Follow
  var fb=e.target.closest('.follow-btn');
  if(fb&&fb.dataset.id){toggleFollow(fb.dataset.id,fb);return;}
  if(id==='issueChallengeBtn'){issueChallenge();return;}
  if(id==='clearChallengeOpponent'){clearChallengeOpponent();return;}
  if(id==='clearChallengeCourse'){clearChallengeCourse();return;}
  var acceptBtn=e.target.closest('.accept-challenge-btn');
  if(acceptBtn&&acceptBtn.dataset.id){respondChallenge(acceptBtn.dataset.id,'accepted');return;}
  var declineBtn=e.target.closest('.decline-challenge-btn');
  if(declineBtn&&declineBtn.dataset.id){respondChallenge(declineBtn.dataset.id,'declined');return;}
  if(id==='createTourneyBtn'){createTourney();return;}
  var tc=e.target.closest('.tourney-card');
  if(tc&&tc.dataset.id){openTourney(tc.dataset.id,tc.dataset.name,tc.dataset.dates,tc.dataset.format);return;}
  if(id==='submitBtn'){logRound();return;}
  if(id==='submitTourneyBtn'){submitTourneyScore();return;}
  // Societies
  if(id==='createSocietyBtn'){createSociety();return;}
  if(id==='joinSocietyBtn'){joinSociety();return;}
  if(id==='sendInviteBtn'){sendEmailInvite();return;}
  if(id==='copySocietyCodeBtn'){copySocietyCode();return;}
  if(id==='leaveSocietyBtn'){leaveSociety();return;}
  var sc=e.target.closest('.society-card');
  if(sc&&sc.dataset.id){openSociety(sc.dataset.id,sc.dataset.name,sc.dataset.code);return;}
  // Match play
  if(id==='logMatchBtn'){logMatch();return;}
  var md=e.target.closest('.match-delete');
  if(md&&md.dataset.id){deleteMatch(md.dataset.id);return;}
  // Share round
  var sri=e.target.closest('.share-round-item');
  if(sri&&sri.dataset.id){selectShareRound(sri.dataset.id);return;}
  if(id==='downloadCardBtn'){downloadScorecard();return;}
  if(id==='profilePublicToggle'){toggleProfilePublic();return;}
  // Profile course dropdowns
  var hopt=e.target.closest('#homeCourseDropdown .csearch-opt');
  if(hopt&&hopt.dataset.idx){pickHomeCourse(hopt.dataset.idx);return;}
  var fopt=e.target.closest('#favCourseDropdown .csearch-opt');
  if(fopt&&fopt.dataset.idx){addFavourite(fopt.dataset.idx,fopt.dataset.name);return;}
  var obh=e.target.closest('#obHomeDropdown .csearch-opt');
  if(obh&&obh.dataset.idx){obPickHome(obh.dataset.idx);return;}
  var obf=e.target.closest('#obFavDropdown .csearch-opt');
  if(obf&&obf.dataset.idx){obAddFav(obf.dataset.idx,obf.dataset.name);return;}
  var fremove=e.target.closest('.fav-remove');
  if(fremove&&fremove.dataset.id){removeFavourite(fremove.dataset.id);return;}
  var mpd=e.target.closest('.my-photo-del');
  if(mpd&&mpd.dataset.id){deleteMyPhoto(mpd.dataset.id,mpd.dataset.url);return;}
  if(id==='homeClearBtn'){clearHomeCourse();return;}
  if(id==='clearCourseBtn'){clearCourseSelection();return;}
  // Course search dropdown (log form only — exclude profile/challenge dropdowns)
  var opt=e.target.closest('#courseDropdown .csearch-opt');
  if(opt&&opt.dataset.idx){pickCourse(opt.dataset.idx);return;}
  if(!e.target.closest('.csearch-wrap')){
    var dd=document.getElementById('courseDropdown');
    if(dd) dd.classList.remove('open');
  }
  // Course filters
  if(id==='filterAll'){setCourseFilter('all',e.target);return;}
  if(id==='filter18'){setCourseFilter('18',e.target);return;}
  if(id==='filter9'){setCourseFilter('9',e.target);return;}
  if(id==='filterLinks'){setCourseFilter('links',e.target);return;}
  if(id==='filterParkland'){setCourseFilter('parkland',e.target);return;}
  if(id==='filterHeathland'){setCourseFilter('heathland',e.target);return;}
  if(id==='filterMoorland'){setCourseFilter('moorland',e.target);return;}
  if(id==='filterDownland'){setCourseFilter('downland',e.target);return;}
  if(id==='addCourseBtn'){openAddCourse();return;}
  // Course reviews & weather
  var rb=e.target.closest('.review-btn');
  if(rb){openReviewModal(rb.dataset.id,rb.dataset.name,rb.dataset.loc,rb.dataset.county);return;}
  var wb=e.target.closest('.weather-btn');
  if(wb){openWeatherModal(wb.dataset.name,wb.dataset.loc);return;}
  var bb=e.target.closest('.book-btn');
  if(bb){bookTeeTime(bb.dataset.name,bb.dataset.loc);return;}
  var sb2=e.target.closest('.star-btn');
  if(sb2){setStarRating(sb2.dataset.field,parseInt(sb2.dataset.val));return;}
  if(id==='reviewModal'){closeReviewModal();return;}
  if(id==='weatherModal'){closeWeatherModal();return;}
  // Add course modal
  if(id==='addCourseModal'){closeAddCourse();return;}
  // Leaderboard
  if(id==='refreshLbBtn'){loadLeaderboard();return;}
  // History
  if(id==='clearAllBtn'){clearAllRounds();return;}
  // Round detail modal
  var rrow=e.target.closest('.round-row');
  if(rrow&&rrow.dataset.id){openRoundModal(rrow.dataset.id);return;}
  if(id==='closeRoundDetailBtn'||id==='roundDetailModal'){closeRoundModal();return;}
  if(id==='rdEditBtn'){editCurrentRound();return;}
  if(id==='rdDeleteBtn'){confirmDeleteCurrentRound();return;}
  if(id==='addCoursePhotoBtn'){document.getElementById('coursePhotoInput').click();return;}
  if(id==='addRoundPhotoBtn'){document.getElementById('roundPhotoInput').click();return;}
  var rpr=e.target.closest('.round-photo-remove');
  if(rpr&&rpr.dataset.idx){removePendingRoundPhoto(parseInt(rpr.dataset.idx));return;}
  // Delete round (legacy inline buttons, if any remain)
  var del=e.target.closest('.row-del');
  if(del&&del.dataset.id){deleteRound(del.dataset.id);return;}
});

document.addEventListener('input',function(e){
  if(e.target.id==='fCourseSearch'){searchCourses(e.target.value);return;}
  if(e.target.id==='courseBrowserSearch'){renderCoursesBrowser();return;}
  if(e.target.id==='homeCourseSearch'){searchProfileCourses('home',e.target.value);return;}
  if(e.target.id==='favCourseSearch'){searchProfileCourses('fav',e.target.value);return;}
  if(e.target.id==='obHomeSearch'){obSearchCourses('home',e.target.value);return;}
  if(e.target.id==='obFavSearch'){obSearchCourses('fav',e.target.value);return;}
  if(e.target.id==='challengeOpponentSearch'){searchMembers(e.target.value);return;}
  if(e.target.id==='challengeCourseSearch'){searchChallengeCourse(e.target.value);return;}
});

document.addEventListener('keydown',function(e){
  if(e.key==='Enter'){
    if(e.target.id==='loginPass'){doLogin();return;}
    if(e.target.id==='regPass'){doRegister();return;}
  }
  if(e.key==='Escape'){ closeAddCourse(); closeReviewModal(); closeWeatherModal(); closeRoundModal(); closeLogModal(); }
});

