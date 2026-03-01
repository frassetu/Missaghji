
(function(){
  // --- Data ---
  const BO = ['BOBA','BOCC','BOES','BOGA','BOGB','BOPO','BOVA','AOC'];
  const AUTH = ['BAO', ...BO]; // DELCO n'est pas sur l'accueil
  const F_BY_E = {
    BAO:['CEX'], DELCO:['CCO'],
    BOBA:['CDC','CDT','CDR','PDA','PDE','PDM','PDS'], BOCC:['CDC','CDT','CDR','PDA','PDE','PDM','PDS'], BOES:['CDC','CDT','CDR','PDA','PDE','PDM','PDS'],
    BOGA:['CDC','CDT','CDR','PDA','PDE','PDM','PDS'], BOGB:['CDC','CDT','CDR','PDA','PDE','PDM','PDS'], BOPO:['CDC','CDT','CDR','PDA','PDE','PDM','PDS'],
    BOVA:['CDC','CDT','CDR','PDA','PDE','PDM','PDS'], AOC:['CDC','CDT','CDR','PDA','PDE','PDM','PDS']
  };
  const STORAGE={user:'miss:u',settings:'miss:s',hist:'miss:h',cnt:'miss:c',snap:'miss:snap'};

  // --- Helpers ---
  const $=id=>document.getElementById(id);
  const views={auth:$('view-auth'),app:$('view-app'),history:$('view-history')};
  const ls={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}}, set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
  const setOptions=(sel,list)=>{ sel.innerHTML=''; list.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o);}); };
  const isBO=e=>BO.includes(e);

  // --- i18n ---
  const i18n={
    fr:{Identification:'Identification',AuthHint:'Entrez votre Nom et choisissez votre Entité.',Installer:'Installer',InstallerQ:'Installer ?',Historique:'Historique',ChangerEntite:'Changer entité',Role:'Rôle',Heure:'Heure (HH)',Minutes:'Minutes (MM)',Numero:'N°',Nom:'Nom',NomMaj:'Nom (MAJ)',Fonction:'Fonction',Entite:'Entité',Message:'Message',Enregistrer:'Enregistrer',Rafraichir:'Rafraîchir',Retour:'Retour',Exporter:'Exporter CSV',SupprimerTout:'Supprimer tout',Actualiser:'Actualiser'},
    co:{Identification:'Identificazione',AuthHint:"Mettite u vostru Nome è sceglite l'Entità.",Installer:'Installà',InstallerQ:'Installà ?',Historique:'Storicu',ChangerEntite:'Cambià entità',Role:'Rolu',Heure:'Ora (HH)',Minutes:'Minuti (MM)',Numero:'N°',Nom:'Nome',NomMaj:'Nome (MAI)',Fonction:'Funzione',Entite:'Entità',Message:'Messaghju',Enregistrer:'Arregistrà',Rafraichir:'Rinfrescà',Retour:'Ritornu',Exporter:'Esporta CSV',SupprimerTout:'Sguassà tuttu',Actualiser:'Attualizà'}
  };
  function t(){ const s=ls.get(STORAGE.settings,{lang:'fr'}); return i18n[s.lang||'fr']; }
  function applyLang(){ const L=t();
    // header & menus
    $('btnInstall').textContent=L.Installer; $('mInstall').textContent=L.Installer;
    $('btnInstallHelp').textContent=L.InstallerQ; $('mInstallHelp').textContent=L.InstallerQ;
    $('btnHistory').textContent=L.Historique; $('mHistory').textContent=L.Historique;
    $('btnChangeEntity').textContent=L.ChangerEntite; $('mChangeEntity').textContent=L.ChangerEntite;
    // auth
    $('titleAuth').textContent=L.Identification; $('authHint').textContent=L.AuthHint;
    $('labelAuthName').textContent=L.Nom; $('labelAuthEntity').textContent=L.Entite; $('authValidate').textContent='Valider';
    // app labels
    $('titleContext').textContent='Contexte'; $('labelRole').textContent=L.Role; $('labelHH').textContent=L.Heure; $('labelMM').textContent=L.Minutes; $('btnNow').textContent=L.Actualiser;
    $('titleEmetteur').textContent='Émetteur'; $('titleRecepteur').textContent='Récepteur';
    $('labelEmNum').textContent=L.Numero; $('labelEmName').textContent=L.Nom; $('labelEmFunc').textContent=L.Fonction; $('labelEmEntity').textContent=L.Entite;
    $('labelReNum').textContent=L.Numero; $('labelReName').textContent=L.NomMaj; $('labelReFunc').textContent=L.Fonction; $('labelReEntity').textContent=L.Entite;
    $('titleMessage').textContent=L.Message; $('btnSave').textContent=L.Enregistrer; $('btnRefreshInline').textContent=L.Rafraichir;
    // placeholders
    $('authName').placeholder = (L===i18n.co?'U VOSTRU NOME (MAI)':'VOTRE NOM (MAJ)');
    $('emName').placeholder = (L===i18n.co?'NOME EMETTITORE (MAI)':'NOM ÉMETTEUR (MAJ)');
    $('reName').placeholder = (L===i18n.co?'NOME RICEVITORE (MAI)':'NOM RÉCEPTEUR (MAJ)');
  }

  // --- Router ---
  function show(view){ Object.values(views).forEach(v=>v.classList.add('hidden')); if(view==='auth'){document.body.classList.add('only-auth');views.auth.classList.remove('hidden')} else if(view==='app'){document.body.classList.remove('only-auth');views.app.classList.remove('hidden')} else {document.body.classList.remove('only-auth');views.history.classList.remove('hidden')} }
  function route(){ const u=ls.get(STORAGE.user,null); if(!u){ show('auth'); return;} const hash=(location.hash||'').replace('#/',''); if(hash==='history') fillHistory(); show(hash==='history'?'history':'app'); refreshBadge(); prepareApp(); }
  window.addEventListener('hashchange', route);

  // --- Auth ---
  const authName=$('authName'), authEntity=$('authEntity');
  function fillAuth(){ setOptions(authEntity, AUTH); }
  authName.addEventListener('input',()=>authName.value=authName.value.toUpperCase());
  $('authValidate').addEventListener('click',()=>{ const name=(authName.value||'').trim(); const entity=authEntity.value; if(!name){alert('Veuillez saisir votre nom'); return;} const u={name,entity}; ls.set(STORAGE.user,u); const c=ls.get(STORAGE.cnt,{}); if(!c[entity]) c[entity]={emetteur:1,recepteur:1}; ls.set(STORAGE.cnt,c); location.hash='#/app'; route(); });

  // --- App refs ---
  const roleSelect=$('roleSelect');
  const hh=$('hh'), mm=$('mm'), btnNow=$('btnNow');
  const emNum=$('emNum'), reNum=$('reNum'), emGen=$('emGen'), reGen=$('reGen');
  const emName=$('emName'), reName=$('reName');
  const emFunc=$('emFunc'), emEntity=$('emEntity');
  const reFunc=$('reFunc'), reEntity=$('reEntity');
  const message=$('message');

  // Lang setting
  const langSelect=$('langSelect'), mLangSelect=$('mLangSelect');
  function saveLang(){ const s=ls.get(STORAGE.settings,{}); s.lang=langSelect.value; ls.set(STORAGE.settings,s); mLangSelect.value=s.lang; applyLang(); }
  langSelect.addEventListener('change', saveLang); mLangSelect.addEventListener('change', ()=>{ langSelect.value=mLangSelect.value; saveLang(); });

  // Digits only
  function digitsOnly(max){ return function(){ this.value=this.value.replace(/\D/g,'').slice(0,max); } }
  ;[emNum,reNum].forEach(inp=>inp.addEventListener('input',digitsOnly(3))); hh.addEventListener('input',digitsOnly(2)); mm.addEventListener('input',digitsOnly(2));

  // Time now
  function setNow(){ const d=new Date(); const z=n=>n<10?'0'+n:n; hh.value=z(d.getHours()); mm.value=z(d.getMinutes()); }
  btnNow.addEventListener('click', setNow);

  // Name uppercase
  ;[emName,reName].forEach(i=>i.addEventListener('input',()=>i.value=i.value.toUpperCase()));

  function refreshBadge(){ const u=ls.get(STORAGE.user,null); $('idBadge').textContent=u? (u.name+' · '+u.entity):'' }

  function counterpartEntitiesFor(userEntity){
    // BAO -> DELCO ou BO*, BO* -> BAO ou DELCO
    if(userEntity==='BAO') return ['DELCO', ...BO];
    if(BO.includes(userEntity)) return ['BAO','DELCO'];
    return ['BAO','DELCO'];
  }

  // Own/Collab pointers depend on role
  function own(){ return roleSelect.value==='emetteur' ? {func:emFunc, ent:emEntity, name:emName, num:emNum} : {func:reFunc, ent:reEntity, name:reName, num:reNum}; }
  function col(){ return roleSelect.value==='emetteur' ? {func:reFunc, ent:reEntity, name:reName, num:reNum} : {func:emFunc, ent:emEntity, name:emName, num:emNum}; }

  function prepareApp(){ const u=ls.get(STORAGE.user,null); if(!u) return; // lang
    const s=ls.get(STORAGE.settings,{lang:'fr',role:'emetteur'}); langSelect.value=s.lang||'fr'; mLangSelect.value=s.lang||'fr'; roleSelect.value=s.role||'emetteur'; applyLang();
    setNow(); // heure par défaut
    // Init own side (locked to user)
    if(roleSelect.value==='emetteur'){
      setOptions(emEntity,[u.entity]); emEntity.disabled=true; setOptions(emFunc, F_BY_E[u.entity]); emFunc.disabled = (F_BY_E[u.entity].length===1); emName.value=u.name.toUpperCase();
      setOptions(reEntity, counterpartEntitiesFor(u.entity)); reEntity.disabled=false; applyCouplingFromEntity(reEntity,reFunc,u.entity);
    } else {
      setOptions(reEntity,[u.entity]); reEntity.disabled=true; setOptions(reFunc, F_BY_E[u.entity]); reFunc.disabled = (F_BY_E[u.entity].length===1); reName.value=u.name.toUpperCase();
      setOptions(emEntity, counterpartEntitiesFor(u.entity)); emEntity.disabled=false; applyCouplingFromEntity(emEntity,emFunc,u.entity);
    }
    // Generators position
    emGen.style.display = (roleSelect.value==='emetteur')?'inline-block':'none';
    reGen.style.display = (roleSelect.value==='recepteur')?'inline-block':'none';
  }

  roleSelect.addEventListener('change', ()=>{ const s=ls.get(STORAGE.settings,{}); s.role=roleSelect.value; ls.set(STORAGE.settings,s); // snapshot collaborator
    const C=col(); ls.set(STORAGE.snap,{name:C.name.value,func:C.func.value,ent:C.ent.value,num:C.num.value,msg:message.value});
    prepareApp(); // restore
    const snap=ls.get(STORAGE.snap,null); if(snap){ const C2=col(); if([...C2.func.options].some(o=>o.value===snap.func)) C2.func.value=snap.func; if([...C2.ent.options].some(o=>o.value===snap.ent)) C2.ent.value=snap.ent; C2.name.value=snap.name||''; C2.num.value=snap.num||''; message.value=snap.msg||''; }
  });

  // Coupling
  function applyCouplingFromEntity(entSel, funcSel, userEntity){
    const ent=entSel.value; if(ent==='BAO'){ setOptions(funcSel,['CEX']); funcSel.disabled=true; }
    else if(ent==='DELCO'){ setOptions(funcSel,['CCO']); funcSel.disabled=true; }
    else if(BO.includes(ent)){ setOptions(funcSel, F_BY_E[ent]); funcSel.disabled=false; }
    // also ensure entity list respects counterpart rule from userEntity
    const allowed = counterpartEntitiesFor(userEntity);
    const list = [...funcSel.options].map(o=>o.value);
    // If a BO function is selected but BO not allowed (shouldn't happen), fallback
    if(list.length>0 && !allowed.includes(ent) && ent!=='BAO' && ent!=='DELCO'){
      // fallback to first allowed
      setOptions(entSel, allowed); entSel.value=allowed[0]; applyCouplingFromEntity(entSel,funcSel,userEntity);
    }
  }
  function applyCouplingFromFunction(funcSel, entSel, userEntity){
    const fn=funcSel.value; if(fn==='CEX'){ setOptions(entSel,['BAO']); entSel.disabled=true; }
    else if(fn==='CCO'){ setOptions(entSel,['DELCO']); entSel.disabled=true; }
    else { const allowed=counterpartEntitiesFor(userEntity); const boAllowed=BO.filter(e=>allowed.includes(e)); setOptions(entSel, boAllowed); entSel.disabled=false; }
  }

  // Wire coupling for both sides
  reEntity.addEventListener('change', ()=>{ const u=ls.get(STORAGE.user,null); applyCouplingFromEntity(reEntity,reFunc,u.entity); });
  reFunc.addEventListener('change', ()=>{ const u=ls.get(STORAGE.user,null); applyCouplingFromFunction(reFunc,reEntity,u.entity); });
  emEntity.addEventListener('change', ()=>{ const u=ls.get(STORAGE.user,null); applyCouplingFromEntity(emEntity,emFunc,u.entity); });
  emFunc.addEventListener('change', ()=>{ const u=ls.get(STORAGE.user,null); applyCouplingFromFunction(emFunc,emEntity,u.entity); });

  // Generators
  function loadCounters(){ return ls.get(STORAGE.cnt,{}); }
  function saveCounters(c){ ls.set(STORAGE.cnt,c); }
  function nextNumberFor(entity, role){ const c=loadCounters(); if(!c[entity]) c[entity]={emetteur:1,recepteur:1}; const n=c[entity][role]||1; c[entity][role]=Math.min(999,n+1); saveCounters(c); return n; }
  emGen.addEventListener('click', ()=>{ const u=ls.get(STORAGE.user,null); if(!u) return; if(roleSelect.value!=='emetteur'){ alert('Le générateur actif est côté Récepteur'); return; } emNum.value = nextNumberFor(u.entity,'emetteur'); });
  reGen.addEventListener('click', ()=>{ const u=ls.get(STORAGE.user,null); if(!u) return; if(roleSelect.value!=='recepteur'){ alert('Le générateur actif est côté Émetteur'); return; } reNum.value = nextNumberFor(u.entity,'recepteur'); });

  // Save + Refresh
  function doRefresh(){ const u=ls.get(STORAGE.user,null); if(!u) return; // keep role
    const r=roleSelect.value; emNum.value=reNum.value=''; message.value=''; reName.value=''; if(r==='emetteur'){ emName.value=u.name.toUpperCase(); } else { reName.value=u.name.toUpperCase(); }
    setNow(); prepareApp(); }
  $('btnRefreshInline').addEventListener('click', doRefresh);

  $('btnSave').addEventListener('click', ()=>{ const u=ls.get(STORAGE.user,null); if(!u){ alert("Identifiez-vous d'abord"); location.hash='#/auth'; route(); return; }
    const O=own(), C=col(); if(!(O.name.value||'').trim() || !(C.name.value||'').trim()){ alert('Nom émetteur et nom récepteur requis'); return; }
    const time=`${(hh.value||'').padStart(2,'0')}:${(mm.value||'').padStart(2,'0')}`;
    // Determine emitter/receiver sides according to selected role
    const rec = (roleSelect.value==='emetteur')
      ? { time, emNum:(emNum.value||'').trim(), emName:emName.value.trim().toUpperCase(), emFunc:emFunc.value, emEntity:emEntity.value, reNum:(reNum.value||'').trim(), reName:reName.value.trim().toUpperCase(), reFunc:reFunc.value, reEntity:reEntity.value, message:(message.value||'').trim() }
      : { time, emNum:(emNum.value||'').trim(), emName:reName.value.trim().toUpperCase(), emFunc:reFunc.value, emEntity:reEntity.value, reNum:(reNum.value||'').trim(), reName:emName.value.trim().toUpperCase(), reFunc:emFunc.value, reEntity:emEntity.value, message:(message.value||'').trim() };
    if(!rec.message){ alert('Message vide'); return; }
    // Guards
    if( (rec.emFunc==='CEX' && rec.reFunc==='CEX') || (isBO(rec.emEntity) && isBO(rec.reEntity)) ) { alert('Combinaison non autorisée'); return; }
    const hist=ls.get(STORAGE.hist,[]); hist.push(rec); ls.set(STORAGE.hist,hist);
    const hint=$('saveHint'); hint.textContent='Enregistré ✓'; setTimeout(()=>hint.textContent='',1200);
    doRefresh(); // 🔄 rafraîchir après enregistrer
  });

  // History
  function fillHistory(){ const tb=document.querySelector('#historyTable tbody'); tb.innerHTML=''; const hist=ls.get(STORAGE.hist,[]); hist.forEach(r=>{ const tr=document.createElement('tr'); [r.time,r.emNum,r.emName,r.emFunc,r.emEntity,r.reNum,r.reName,r.reFunc,r.reEntity,r.message].forEach(v=>{ const td=document.createElement('td'); td.textContent=v??''; tr.appendChild(td); }); tb.appendChild(tr); }); }
  $('btnHistory').addEventListener('click', ()=>{ location.hash='#/history'; route(); }); $('mHistory').addEventListener('click', ()=>{ location.hash='#/history'; route(); }); $('btnBack').addEventListener('click', ()=>{ location.hash='#/app'; route(); });
  $('btnClearAll').addEventListener('click', ()=>{ if(!confirm("Supprimer tout l'historique ?")) return; ls.set(STORAGE.hist,[]); fillHistory(); });
  $('btnExport').addEventListener('click', ()=>{ const hist=ls.get(STORAGE.hist,[]); const head=['heure','n_emetteur','nom_emetteur','fonction_emetteur','entite_emetteur','n_recepteur','nom_recepteur','fonction_recepteur','entite_recepteur','message']; const rows=hist.map(r=>[r.time,r.emNum,r.emName,r.emFunc,r.emEntity,r.reNum,r.reName,r.reFunc,r.reEntity,(r.message||'').replace(/\n/g,' ')]); const csv=[head.join(';')].concat(rows.map(a=>a.map(v=>`"${(v??'').toString().replaceAll('"','""')}"`).join(';'))).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='missaghji_history.csv'; a.click(); URL.revokeObjectURL(url); });

  // Menu: stack + change entity
  const menuWrap=$('menuWrap'); $('btnMenu').addEventListener('click',()=>menuWrap.classList.toggle('open')); document.addEventListener('click',e=>{ if(!menuWrap.contains(e.target)) menuWrap.classList.remove('open'); });
  function gotoAuth(ev){ if(ev){ev.preventDefault();ev.stopPropagation();} menuWrap.classList.remove('open'); location.hash='#/auth'; show('auth'); setTimeout(()=>$('authEntity').focus(),0); }
  $('btnChangeEntity').addEventListener('click', gotoAuth); $('mChangeEntity').addEventListener('click', gotoAuth);

  // Install
  let deferredPrompt=null; window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt=e; $('btnInstall').classList.remove('hidden'); $('mInstall').classList.remove('hidden'); $('btnInstallHelp').classList.add('hidden'); $('mInstallHelp').classList.add('hidden'); });
  function promptInstall(){ if(!deferredPrompt){ alert("Installation non disponible pour l'instant. Utilisez le bouton d'aide."); return; } deferredPrompt.prompt(); deferredPrompt.userChoice.finally(()=>{ deferredPrompt=null; $('btnInstall').classList.add('hidden'); $('mInstall').classList.add('hidden'); }); }
  $('btnInstall').addEventListener('click', ()=>promptInstall()); $('mInstall').addEventListener('click', ()=>{ menuWrap.classList.remove('open'); promptInstall(); });

  document.addEventListener('DOMContentLoaded', ()=>{ fillAuth(); const s=ls.get(STORAGE.settings,{lang:'fr',role:'emetteur'}); langSelect.value=s.lang||'fr'; mLangSelect.value=s.lang||'fr'; applyLang(); const u=ls.get(STORAGE.user,null); if(u){ authName.value=u.name; if(AUTH.includes(u.entity)) $('authEntity').value=u.entity; } route(); });
})();
