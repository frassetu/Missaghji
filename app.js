
(function(){
  const AUTH_ENTITIES = ['BAO','BOBA','BOCC','BOES','BOGA','BOGB','BOPO','BOVA','AOC'];
  const GROUP_ENTITIES = ['BOBA','BOCC','BOES','BOGA','BOGB','BOPO','BOVA','AOC'];
  const FN_BY_ENTITY = { BAO:'CEX', BOBA:'CDC', BOCC:'CDT', BOES:'CDR', BOGA:'PDM', BOGB:'PDA', BOPO:'PDE', BOVA:'PDM', AOC:'PDS' };
  const COLLAB_FUNCS_BASE = ['CCO','CDC','CDT','CDR','PDM','PDA','PDE','PDS','CEX'];
  const STORAGE = { user:'missaghji:user', history:'missaghji:history', counters:'missaghji:counters', settings:'missaghji:settings' };

  const $ = (id)=>document.getElementById(id);
  const views = { auth: $('view-auth'), app: $('view-app'), history: $('view-history') };
  const idBadge = $('idBadge');
  const ls = { get(k,d){ try{ return JSON.parse(localStorage.getItem(k)) ?? d }catch(e){ return d } }, set(k,v){ localStorage.setItem(k, JSON.stringify(v)) } };

  // --- i18n ---
  const i18n = {
    fr: { identification:'Identification', authHint:'Entrez votre Nom et choisissez votre Entité.', valider:'Valider', installer:'Installer', installerHelp:'Installer ?', historique:'Historique', rafraichir:'Rafraîchir', changerEntite:'Changer entité', role:'Rôle', emetteur:'Émetteur', recepteur:'Récepteur', hh:'Heure (HH)', mm:'Minutes (MM)', actualiser:'Actualiser', numero:'N°', generer:'Générer', nom:'Nom', nomMaj:'Nom (MAJ)', fonction:'Fonction', entite:'Entité', message:'Message', enregistrer:'Enregistrer', retour:'Retour', exporter:'Exporter CSV', supprimerTout:'Supprimer tout', history:'Historique' },
    co: { identification:'Identificazione', authHint:"Mettite u vostru Nome è sceglite l'Entità.", valider:'Validà', installer:'Installà', installerHelp:'Installà ?', historique:'Storicu', rafraichir:'Rinfrescà', changerEntite:"Cambià entità", role:'Rolu', emetteur:'Emettitore', recepteur:'Ricevitore', hh:'Ora (HH)', mm:'Minuti (MM)', actualiser:'Attualizà', numero:'N°', generer:'Generà', nom:'Nome', nomMaj:'Nome (MAI)', fonction:'Funzione', entite:'Entità', message:'Messaghju', enregistrer:'Arregistrà', retour:'Ritornu', exporter:'Esporta CSV', supprimerTout:'Sguassà tuttu', history:'Storicu' }
  };
  function setText(id,txt){ const el=$(id); if(el) el.textContent=txt; }
  function applyLang(lang){ const L=i18n[lang]||i18n.fr;
    setText('btnInstall',L.installer); setText('mInstall',L.installer);
    setText('btnInstallHelp',L.installerHelp); setText('mInstallHelp',L.installerHelp);
    setText('btnHistory',L.historique); setText('mHistory',L.historique);
    setText('btnChangeEntity',L.changerEntite); setText('mChangeEntity',L.changerEntite);

    setText('titleAuth',L.identification); setText('authHint',L.authHint);
    setText('titleContext','Contexte');
    setText('titleEmetteur',L.emetteur); setText('titleRecepteur',L.recepteur);
    setText('titleMessage',L.message); setText('titleHistory',L.history||L.historique);

    setText('labelAuthName',L.nom); setText('labelAuthEntity',L.entite);
    setText('labelRole',L.role); setText('labelHH',L.hh); setText('labelMM',L.mm);
    setText('labelEmNum',L.numero); setText('labelEmName',L.nom); setText('labelEmFunc',L.fonction); setText('labelEmEntity',L.entite);
    setText('labelReNum',L.numero); setText('labelReName',L.nomMaj); setText('labelReFunc',L.fonction); setText('labelReEntity',L.entite);

    setText('btnNow',L.actualiser); setText('btnSave',L.enregistrer); setText('btnBack',L.retour); setText('btnExport',L.exporter); setText('btnClearAll',L.supprimerTout);
    $('btnRefreshInline').textContent=L.rafraichir;

    $('authName').placeholder=(lang==='co'?'U VOSTRU NOME (MAI)':'VOTRE NOM (MAJ)');
    $('emName').placeholder=(lang==='co'?'NOME EMETTITORE (MAI)':'NOM ÉMETTEUR (MAJ)');
    $('reName').placeholder=(lang==='co'?'NOME RICEVITORE (MAI)':'NOM RÉCEPTEUR (MAJ)');
    $('message').placeholder=(lang==='co'?'Scrivite u vostru messaghju (illimitatu)':'Saisissez votre message (illimité)');
  }

  // --- Router ---
  function showView(view){ Object.values(views).forEach(v=>v.classList.add('hidden')); if(view==='auth'){ document.body.classList.add('only-auth'); views.auth.classList.remove('hidden'); } else if(view==='app'){ document.body.classList.remove('only-auth'); views.app.classList.remove('hidden'); } else { document.body.classList.remove('only-auth'); views.history.classList.remove('hidden'); } }
  function route(){ const hash=location.hash.replace('#/','')||''; const user=ls.get(STORAGE.user,null); if(!user){ showView('auth'); return; } if(hash==='history') fillHistory(); showView(hash==='history'?'history':'app'); refreshBadge(); prepareApp(); }
  window.addEventListener('hashchange', route);

  function setOptions(select, list){ select.innerHTML=''; list.forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; select.appendChild(o); }); }

  // --- Auth ---
  const authName=$('authName'), authEntity=$('authEntity');
  function fillAuth(){ setOptions(authEntity, AUTH_ENTITIES); }
  authName.addEventListener('input', ()=>{ authName.value = authName.value.toUpperCase(); });
  $('authValidate').addEventListener('click', ()=>{ const name=(authName.value||'').trim(); const entity=authEntity.value; if(!name){ alert('Veuillez saisir votre nom'); return; } const user={ name, entity }; ls.set(STORAGE.user,user); const c=ls.get(STORAGE.counters,{}); if(!c[entity]) c[entity]={emetteur:1,recepteur:1}; ls.set(STORAGE.counters,c); location.hash='#/app'; route(); });

  // --- App refs ---
  const roleSelect=$('roleSelect');
  const hh=$('hh'), mm=$('mm'); const btnNow=$('btnNow');
  const emNum=$('emNum'), emGen=$('emGen'), emName=$('emName'), emFuncSel=$('emFuncSel'), emEntity=$('emEntity');
  const reNum=$('reNum'), reGen=$('reGen'), reName=$('reName'), reFuncSel=$('reFuncSel'), reEntity=$('reEntity');
  const message=$('message');

  // Preserve collaborator inputs when switching role
  function snapshotCollaborator(){
    return { name: reName.value, func: reFuncSel.value, entity: reEntity.value, emNum: emNum.value, reNum: reNum.value, msg: message.value };
  }
  function restoreCollaborator(snap){ if(!snap) return; reName.value=snap.name||''; if(reFuncSel.querySelector(`option[value="${snap.func}"]`)) reFuncSel.value=snap.func; if(reEntity.querySelector(`option[value="${snap.entity}"]`)) reEntity.value=snap.entity; emNum.value=snap.emNum||''; reNum.value=snap.reNum||''; message.value=snap.msg||''; }

  // Numeric guards
  function digitsOnly(max){ return function(){ this.value=this.value.replace(/\D/g,'').slice(0,max); }; }
  ;[emNum,reNum].forEach(inp=> inp.addEventListener('input', digitsOnly(3)) );
  hh.addEventListener('input', digitsOnly(2)); mm.addEventListener('input', digitsOnly(2));

  function zero2(n){ return (n<10?'0':'')+n }
  function setNow(){ const d=new Date(); hh.value=zero2(d.getHours()); mm.value=zero2(d.getMinutes()); }
  btnNow.addEventListener('click', setNow);
  ;[emName,reName].forEach(inp=>inp.addEventListener('input',()=>{ inp.value = inp.value.toUpperCase(); }));

  function refreshBadge(){ const user=ls.get(STORAGE.user,null); if(!user){ idBadge.textContent=''; return; } idBadge.textContent = user.name + ' · ' + user.entity; }

  function loadSettings(){ const s=ls.get(STORAGE.settings,{lang:'fr',role:'emetteur'}); $('langSelect').value=s.lang||'fr'; $('mLangSelect').value=s.lang||'fr'; roleSelect.value=s.role||'emetteur'; applyLang(s.lang||'fr'); }
  function saveSettings(){ const s=ls.get(STORAGE.settings,{}); s.lang=$('langSelect').value; s.role=roleSelect.value; ls.set(STORAGE.settings,s); applyLang(s.lang); $('mLangSelect').value=s.lang; }
  $('langSelect').addEventListener('change', saveSettings); $('mLangSelect').addEventListener('change', ()=>{ $('langSelect').value=$('mLangSelect').value; saveSettings(); });

  function prepareApp(){ const user=ls.get(STORAGE.user,null); if(!user) return; setNow(); configureByRole(); }

  function collaboratorFunctionsList(user){
    const ownFunc = FN_BY_ENTITY[user.entity]||'';
    // Remove CEX from collaborator options if it is already present in one of the two cases (own or previously selected)
    let list = COLLAB_FUNCS_BASE.slice();
    if(ownFunc==='CEX') list = list.filter(f=>f!=='CEX');
    return list;
  }

  function configureByRole(){
    const user=ls.get(STORAGE.user,null); if(!user) return; const role=roleSelect.value; const ownFunc=FN_BY_ENTITY[user.entity]||'';

    // snapshot
    const snap = snapshotCollaborator();

    // Own block
    setOptions(emFuncSel,[ownFunc]); emFuncSel.disabled=true; setOptions(emEntity,[user.entity]); emEntity.disabled=true; emName.value=user.name.toUpperCase();

    // Collaborator block
    setOptions(reFuncSel, collaboratorFunctionsList(user)); // filtered list

    if(role==='emetteur'){
      if(user.entity==='BAO'){ setOptions(reEntity, GROUP_ENTITIES); reEntity.disabled=false; }
      else { setOptions(reEntity, ['BAO']); reEntity.value='BAO'; reEntity.disabled=true; }
      emGen.style.display='inline-block'; reGen.style.display='none';
    } else {
      // as receiver: collaborator side is logically the emitter; same selectors used for collaborator (re*), we keep UI consistent to preserve data
      if(user.entity==='BAO'){ setOptions(reEntity, GROUP_ENTITIES); reEntity.disabled=false; }
      else { setOptions(reEntity, ['BAO']); reEntity.value='BAO'; reEntity.disabled=true; }
      emGen.style.display='none'; reGen.style.display='inline-block';
    }

    // Apply rules and restore
    applyCollaboratorFuncRules();
    restoreCollaborator(snap);
    applyCollaboratorFuncRules();
  }
  roleSelect.addEventListener('change', ()=>{ saveSettings(); configureByRole(); });

  function getCollaboratorFunc(){ return (reFuncSel.value||'').toUpperCase(); }
  function getCollaboratorEntitySelect(){ return reEntity; }

  function applyCollaboratorFuncRules(){
    const user=ls.get(STORAGE.user,null); if(!user) return; const f=getCollaboratorFunc(); const entitySelect=getCollaboratorEntitySelect();
    if(user.entity==='BAO'){
      if(f==='CCO'){ setOptions(entitySelect, ['DELCO']); entitySelect.value='DELCO'; entitySelect.disabled=true; }
      else if(['CDC','CDT','CDR','PDM','PDA','PDE','PDS'].includes(f)){ setOptions(entitySelect, GROUP_ENTITIES); entitySelect.disabled=false; }
      else if(f==='CEX'){ setOptions(entitySelect, ['BAO']); entitySelect.value='BAO'; entitySelect.disabled=true; }
      else { /* empty or other */ if(entitySelect.options.length===0) setOptions(entitySelect, GROUP_ENTITIES); entitySelect.disabled=false; }
    } else {
      if(f==='CCO'){ setOptions(entitySelect, ['DELCO']); entitySelect.value='DELCO'; entitySelect.disabled=true; }
      else if(f==='CEX'){ setOptions(entitySelect, ['BAO']); entitySelect.value='BAO'; entitySelect.disabled=true; }
      else { setOptions(entitySelect, ['BAO']); entitySelect.value='BAO'; entitySelect.disabled=true; }
    }
  }
  reFuncSel.addEventListener('change', applyCollaboratorFuncRules);

  // Generators
  function loadCounters(){ return ls.get(STORAGE.counters,{}); }
  function saveCounters(c){ ls.set(STORAGE.counters,c); }
  function nextNumberFor(entity, role){ const c=loadCounters(); if(!c[entity]) c[entity]={emetteur:1,recepteur:1}; const n=c[entity][role]; c[entity][role]=Math.min(999,(n||1))+1; saveCounters(c); return n||1; }
  emGen.addEventListener('click', ()=>{ const user=ls.get(STORAGE.user,null); if(!user) return; if(roleSelect.value!=='emetteur'){ alert('Le générateur actif est côté Récepteur'); return; } emNum.value = nextNumberFor(user.entity,'emetteur'); });
  reGen.addEventListener('click', ()=>{ const user=ls.get(STORAGE.user,null); if(!user) return; if(roleSelect.value!=='recepteur'){ alert('Le générateur actif est côté Émetteur'); return; } reNum.value = nextNumberFor(user.entity,'recepteur'); });

  // Refresh form
  function doRefresh(){ const user=ls.get(STORAGE.user,null); if(!user) return; roleSelect.value='emetteur'; hh.value=mm.value=''; emNum.value=''; reNum.value=''; reName.value=''; message.value=''; configureByRole(); setNow(); saveSettings(); }
  $('btnRefreshInline').addEventListener('click', doRefresh);

  // Change entity -> go auth immediately
  function gotoAuth(ev){ if(ev){ ev.preventDefault(); ev.stopPropagation(); } closeMenu(); location.hash='#/auth'; showView('auth'); setTimeout(()=>{ $('authEntity').focus(); },0); }
  $('btnChangeEntity').addEventListener('click', gotoAuth); $('mChangeEntity').addEventListener('click', gotoAuth);

  // History
  function getHistory(){ return ls.get(STORAGE.history,[]); }
  function setHistory(list){ ls.set(STORAGE.history,list); }
  function fillHistory(){ const tbody=document.querySelector('#historyTable tbody'); tbody.innerHTML=''; const hist=getHistory(); for(const row of hist){ const tr=document.createElement('tr'); const cells=[row.time,row.emNum,row.emName,row.emFunc,row.emEntity,row.reNum,row.reName,row.reFunc,row.reEntity,row.message]; cells.forEach(c=>{ const td=document.createElement('td'); td.textContent=c??''; tr.appendChild(td); }); tbody.appendChild(tr); } }
  $('btnHistory').addEventListener('click', ()=>{ location.hash='#/history'; route(); });
  $('mHistory').addEventListener('click', ()=>{ closeMenu(); location.hash='#/history'; route(); });
  $('btnBack').addEventListener('click', ()=>{ location.hash='#/app'; route(); });

  $('btnClearAll').addEventListener('click', ()=>{ if(!confirm("Supprimer tout l'historique ?")) return; setHistory([]); fillHistory(); });
  $('btnExport').addEventListener('click', ()=>{ const hist=getHistory(); const head=['heure','n_emetteur','nom_emetteur','fonction_emetteur','entite_emetteur','n_recepteur','nom_recepteur','fonction_recepteur','entite_recepteur','message']; const user=ls.get(STORAGE.user,null)||{}; const rows=hist.map(r=>[r.time,r.emNum,r.emName,r.emFunc||FN_BY_ENTITY[user.entity]||'', r.emEntity||user.entity, r.reNum,r.reName,r.reFunc,r.reEntity,(r.message||'').replace(/\n/g,' ')]); const csv=[head.join(';')].concat(rows.map(a=>a.map(v=>`"${(v??'').toString().replace('"','""')}"`).join(';'))).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='missaghji_history.csv'; a.click(); URL.revokeObjectURL(url); });

  // Save
  $('btnSave').addEventListener('click', ()=>{ const user=ls.get(STORAGE.user,null); if(!user){ alert("Identifiez-vous d'abord"); location.hash='#/auth'; route(); return; } if(!(emName.value||'').trim() || !(reName.value||'').trim()){ alert('Nom émetteur et nom récepteur requis'); return; } const time=`${(hh.value||'').padStart(2,'0')}:${(mm.value||'').padStart(2,'0')}`; const rec={ time, emNum:(emNum.value||'').trim(), emName:(emName.value||'').trim().toUpperCase(), emFunc:(FN_BY_ENTITY[user.entity]||''), emEntity:user.entity, reNum:(reNum.value||'').trim(), reName:(reName.value||'').trim().toUpperCase(), reFunc:(reFuncSel.value||'').trim(), reEntity: reEntity.value, message:(message.value||'').trim() }; if(!rec.message){ alert('Message vide'); return; } const hist=getHistory(); hist.push(rec); setHistory(hist); const hint=$('saveHint'); hint.textContent='Enregistré ✓'; setTimeout(()=>hint.textContent='',1200); doRefresh(); });

  // Menu
  const menuWrap=$('menuWrap'); const btnMenu=$('btnMenu');
  btnMenu.addEventListener('click', ()=>{ menuWrap.classList.toggle('open'); });
  function closeMenu(){ menuWrap.classList.remove('open'); }
  document.addEventListener('click', (e)=>{ if(!menuWrap.contains(e.target)) closeMenu(); });

  // Install (PWA)
  let deferredPrompt=null; function updateInstallButtons(visible){ const ids=['btnInstall','mInstall']; ids.forEach(id=>{ const el=$(id); if(el) el.classList[visible?'remove':'add']('hidden'); }); const helpIds=['btnInstallHelp','mInstallHelp']; helpIds.forEach(id=>{ const el=$(id); if(el) el.classList[visible?'add':'remove']('hidden'); }); }
  window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt=e; updateInstallButtons(true); });
  function promptInstall(){ if(!deferredPrompt){ alert("Installation non disponible pour l'instant. Utilisez le bouton d'aide."); return; } deferredPrompt.prompt(); deferredPrompt.userChoice.finally(()=>{ deferredPrompt=null; updateInstallButtons(false); }); }
  $('btnInstall').addEventListener('click', ()=>{ promptInstall(); });
  $('mInstall').addEventListener('click', ()=>{ closeMenu(); promptInstall(); });
  $('btnInstallHelp').addEventListener('click', ()=>{ alert("iPhone/iPad : Partager ▸ Ajouter à l'écran d'accueil.\nAndroid : menu ⋮ ▸ Ajouter à l'écran d'accueil."); });
  $('mInstallHelp').addEventListener('click', ()=>{ closeMenu(); alert("iPhone/iPad : Partager ▸ Ajouter à l'écran d'accueil.\nAndroid : menu ⋮ ▸ Ajouter à l'écran d'accueil."); });

  document.addEventListener('DOMContentLoaded', ()=>{ fillAuth(); const s=ls.get(STORAGE.settings,{lang:'fr',role:'emetteur'}); applyLang(s.lang||'fr'); const user=ls.get(STORAGE.user,null); if(user){ authName.value=user.name; authEntity.value=user.entity; } route(); });
})();
