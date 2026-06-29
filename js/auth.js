// ── AUTH ──────────────────────────────────────────────────────────────────
function switchTab(t){
  document.getElementById('loginForm').style.display=t==='login'?'':'none';
  document.getElementById('registerForm').style.display=t==='register'?'':'none';
  document.getElementById('tabLogin').classList.toggle('active',t==='login');
  document.getElementById('tabRegister').classList.toggle('active',t==='register');
  clearAuthMsgs();
}
function clearAuthMsgs(){
  ['authError','authSuccess'].forEach(function(id){
    var el=document.getElementById(id); if(el){el.style.display='none';el.textContent='';}
  });
}
function showAuthError(msg){ var e=document.getElementById('authError'); if(e){e.textContent=msg;e.style.display='block';} document.getElementById('authSuccess').style.display='none'; }
function showAuthSuccess(msg){ var e=document.getElementById('authSuccess'); if(e){e.textContent=msg;e.style.display='block';} document.getElementById('authError').style.display='none'; }

async function doLogin(){
  var btn=document.getElementById('loginBtn');
  var email=document.getElementById('loginEmail').value.trim();
  var pass=document.getElementById('loginPass').value;
  if(!email||!pass){showAuthError('Please fill in all fields.');return;}
  btn.innerHTML='<span class="spinner"></span>Signing in…'; btn.disabled=true; clearAuthMsgs();
  var r=await sb.auth.signInWithPassword({email:email,password:pass});
  btn.innerHTML='Sign In'; btn.disabled=false;
  if(r.error) showAuthError(r.error.message);
}
async function doRegister(){
  var btn=document.getElementById('registerBtn');
  var name=document.getElementById('regName').value.trim();
  var email=document.getElementById('regEmail').value.trim();
  var pass=document.getElementById('regPass').value;
  if(!name||!email||!pass){showAuthError('Please fill in all fields.');return;}
  if(pass.length<6){showAuthError('Password must be at least 6 characters.');return;}
  btn.innerHTML='<span class="spinner"></span>Creating…'; btn.disabled=true; clearAuthMsgs();
  var r=await sb.auth.signUp({email:email,password:pass,options:{data:{display_name:name}}});
  btn.innerHTML='Create Account'; btn.disabled=false;
  if(r.error) showAuthError(r.error.message);
  else showAuthSuccess('Account created! Check your email to confirm, then sign in.');
}
async function doSignOut(){ if(typeof Sentry!=='undefined'&&Sentry.setUser){ Sentry.setUser(null); } await sb.auth.signOut(); }

// ── LOG FORM EXPANDERS ────────────────────────────────────────────────────
function toggleExpand(panelId, btnId){
  var panel=document.getElementById(panelId);
  var btn=document.getElementById(btnId);
  if(!panel) return;
  var open=panel.style.display==='block';
  panel.style.display=open?'none':'block';
  if(btn) btn.classList.toggle('open',!open);
  // Change ＋ to －
  btn.innerHTML=btn.innerHTML.replace(open?'－':'＋', open?'＋':'－');
}

