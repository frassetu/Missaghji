
(function(){
  const ENTITIES = ['BAO','DELCO','BOBA','BOCC','BOES','BOGA','BOGB','BOPO','BOVA','AOC'];
  const BO_ENTS = ['BOBA','BOCC','BOES','BOGA','BOGB','BOPO','BOVA','AOC'];
  const F_BY_ENTITY = {
    BAO: ['CEX'],
    DELCO: ['CCO'],
    BOBA: ['CDC','CDT','CDR','PDA','PDE','PDM','PDS'],
    BOCC: ['CDC','CDT','CDR','PDA','PDE','PDM','PDS'],
    BOES: ['CDC','CDT','CDR','PDA','PDE','PDM','PDS'],
    BOGA: ['CDC','CDT','CDR','PDA','PDE','PDM','PDS'],
    BOGB: ['CDC','CDT','CDR','PDA','PDE','PDM','PDS'],
    BOPO: ['CDC','CDT','CDR','PDA','PDE','PDM','PDS'],
    BOVA: ['CDC','CDT','CDR','PDA','PDE','PDM','PDS'],
    AOC:  ['CDC','CDT','CDR','PDA','PDE','PDM','PDS']
  };

  const STORAGE = { user:'miss:user', history:'miss:history', settings:'miss:settings', counters:'miss:counters' };
  const $=id=>document.getElementById(id);
  const views={auth:$('view-auth'), app:$('view-app'), history:$('view-history')};
  const idBadge=$('idBadge');
  const ls={ get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}}, set(k,v){localStorage.setItem(k,JSON.stringify(v))} };

  // i18n minimal
  const i18n={ fr:{ identification:'Identification',authHint:'Entrez votre Nom et choisissez votre Entité.',valider:'Valider',historique:'Historique',changerEntite:'Changer entité',role:'Rôle',hh:'Heure (HH)',mm:'Minutes (MM)',actualiser:'Actualiser',numero:'N°',nom:'Nom',message:'Message',enregistrer:'Enregistrer',retour:'Retour',exporter:'Exporter CSV',supprimerTout:'Supprimer tout' }, co:{ identification:'Identificazione',authHint:"Mettite u vostru Nome è sceglite l'Entità.",valider:'Validà',historique:'Storicu',changerEntite:"Cambià entità",role:'Rolu',hh:'Ora (HH)',mm:'Minuti (MM)',actualiser:'Attualizà',numero:'N°',nom:'Nome',message:'Messaghju',enregistrer:'Arregistrà',retour:'Ritornu',exporter:'Esporta CSV',supprimerTout:'Sguassà tuttu' } };
  function setText(id,txt){const el=$(id); if(el) el.textContent=txt}
  function applyLang(lang){const L=i18n[lang]||i18n.fr; setText('titleAuth',L.identification); setText('authHint',L.authHint); setText('labelRole',L.role); setText('labelHH',L.hh); setText('labelMM',L.mm); setText('labelEmNum',L.numero); setText('labelEmName',L.nom); setText('labelReNum',L.numero); setText('labelReName',L.nom); setText('titleMessage',L.message); setText('btnSave',L.enregistrer); setText('btnBack',L.retour); setText('btnExport',L.exporter); setText('btnClearAll',L.supprimerTout); setText('btnNow',L.actualiser); $('btnRefreshInline').textContent=L.actualiser; setText('btnHistory',L.historique); setText('mHistory',L.historique); setText('btnChangeEntity',L.changerEntite); setText('mChangeEntity',L.changerEntite); $('authName').placeholder=(lang==='co'?'U VOSTRU NOME (MAI)':'VOTRE NOM (MAJ)'); $('emName').placeholder=(lang==='co'?'NOME EMETTITORE (MAI)':'NOM ÉMETTEUR (MAJ)'); $('reName').placeholder=(lang==='co'?'NOME RICEVITORE (MAI)':'NOM RÉCEPTEUR (MAJ)'); }

  function setOptions(sel, list){ sel.innerHTML=''; list.forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o); }); }

  function show(view){ Object.values(views).forEach(v=>v.classList.add('hidden')); if(view==='auth'){document.body.classList.add('only-auth');views.auth.classList.remove('hidden')} else if(view==='app'){document.body.classList.remove('only-auth');views.app.classList.remove('hidden')} else {document.body.classList.remove('only-auth');views.history.classList.remove('hidden')} }
  function route(){ const user=ls.get(STORAGE.user,null); const hash=(location.hash||'').replace('#/',''); if(!user){ show('auth'); return; } if(hash==='history') fillHistory(); show(hash==='history'?'history':'app'); refreshBadge(); prepareApp(); }
  window.addEventListener('hashchange', route);

  // Auth
  const authName=$('authName'), authEntity=$('authEntity');
  function fillAuth(){ setOptions(authEntity, ENTITIES); }
  authName.addEventListener('input',()=>{authName.value=authName.value.toUpperCase()});
  $('authValidate').addEventListener('click',()=>{ const name=(authName.value||'').trim(); const entity=authEntity.value; if(!name){alert('Veuillez saisir votre nom');return} const user={name,entity}; ls.set(STORAGE.user,user); const c=ls.get(STORAGE.counters,{}); if(!c[entity]) c[entity]={emetteur:1,recepteur:1}; ls.set(STORAGE.counters,c); location.hash='#/app'; route(); });

  // App refs
  const roleSelect=$('roleSelect');
  const hh=$('hh'), mm=$('mm'); $('btnNow').addEventListener('click',()=>{ const d=new Date(); const z=n=>n<10?'0'+n:n; hh.value=z(d.getHours()); mm.value=z(d.getMinutes()); });
  const emNum=$('emNum'), reNum=$('reNum'), emGen=$('emGen'), reGen=$('reGen');
  const emName=$('emName'), reName=$('reName');
  [emName,reName].forEach(i=>i.addEventListener('input',()=>i.value=i.value.toUpperCase()));

  const emFuncOwn=$('emFuncOwn'), emEntityOwn=$('emEntityOwn');
  const reFuncOwn=$('reFuncOwn'), reEntityOwn=$('reEntityOwn');
  const emColRow=$('emColRow'), reColRow=$('reColRow');
  const emFuncCol=$('emFuncCol'), emEntityCol=$('emEntityCol');
  const reFuncCol=$('reFuncCol'), reEntityCol=$('reEntityCol');

  function refreshBadge(){ const u=ls.get(STORAGE.user,null); idBadge.textContent=u? (u.name+' · '+u.entity):'' }

  function counterpartEntitiesFor(userEntity){
    if(userEntity==='BAO') return ['DELCO',...BO_ENTS];
    if(BO_ENTS.includes(userEntity)) return ['BAO','DELCO'];
    if(userEntity==='DELCO') return ['BAO',...BO_ENTS];
    return ['BAO','DELCO'];
  }
  function allowedFunctionsForCounterpart(userEntity){
    if(userEntity==='BAO') return ['CCO',...F_BY_ENTITY.BOBA];
    if(BO_ENTS.includes(userEntity)) return ['CEX','CCO'];
    if(userEntity==='DELCO') return ['CEX',...F_BY_ENTITY.BOBA];
    return ['CEX','CCO'];
  }

  function digitsOnly(max){ return function(){ this.value=this.value.replace(/\D/g,'').slice(0,max); } }
  ;[emNum,reNum,hh,mm].forEach((inp,i)=>{ const m=[3,3,2,2][i]; inp.addEventListener('input',digitsOnly(m)); });

  function snapshot(){ return { colName: currentColName().value, colFunc: currentColFunc().value, colEnt: currentColEntity().value, emNum: emNum.value, reNum: reNum.value, msg: ($('message').value||'') }; }
  function restore(s){ if(!s) return; currentColName().value=s.colName||''; if(optionExists(currentColFunc(),s.colFunc)) currentColFunc().value=s.colFunc; if(optionExists(currentColEntity(),s.colEnt)) currentColEntity().value=s.colEnt; emNum.value=s.emNum||''; reNum.value=s.reNum||''; $('message').value=s.msg||''; }
  function optionExists(sel,val){ return !!sel.querySelector(`option[value="${val}"]`) }

  function currentColFunc(){ return roleSelect.value==='emetteur' ? reFuncCol : emFuncCol }
  function currentColEntity(){ return roleSelect.value==='emetteur' ? reEntityCol : emEntityCol }
  function currentColName(){ return roleSelect.value==='emetteur' ? reName : emName }

  function prepareApp(){ const user=ls.get(STORAGE.user,null); if(!user) return; const s=ls.get(STORAGE.settings,{lang:'fr',role:'emetteur'}); $('langSelect').value=s.lang||'fr'; $('mLangSelect').value=s.lang||'fr'; roleSelect.value=s.role||'emetteur'; applyLang(s.lang||'fr'); configure(); }

  function configure(){
    const snap=snapshot();
    const user=ls.get(STORAGE.user,null); if(!user) return;
    // Own side
    setOptions(emEntityOwn,[user.entity]); setOptions(reEntityOwn,[user.entity]);
    setOptions(emFuncOwn, F_BY_ENTITY[user.entity]||[]); setOptions(reFuncOwn, F_BY_ENTITY[user.entity]||[]);
    emFuncOwn.disabled = reFuncOwn.disabled = true; emEntityOwn.disabled = reEntityOwn.disabled=true;
    emName.value = user.name.toUpperCase();

    // Which block is collaborator
    if(roleSelect.value==='emetteur'){
      reColRow.classList.remove('hidden'); emColRow.classList.add('hidden');
    } else {
      emColRow.classList.remove('hidden'); reColRow.classList.add('hidden');
    }

    // Fill collaborator entity list based on user entity
    const colEntSel=currentColEntity();
    const colFuncSel=currentColFunc();
    const ents = counterpartEntitiesFor(user.entity);
    setOptions(colEntSel, ents);

    // Fill collaborator function list per allowed set (filter out CEX when own is BAO so no CEX↔CEX)
    const funcs = allowedFunctionsForCounterpart(user.entity);
    setOptions(colFuncSel, funcs);

    // Apply directional constraints between entity and function
    applyEntityFunctionCoupling();

    // Restore after lists are ready, then re-apply coupling to validate
    restore(snap);
    applyEntityFunctionCoupling();

    // own receiver name if role=recepteur
    if(roleSelect.value==='recepteur'){ reName.value=user.name.toUpperCase(); }

    // generators visibility
    emGen.style.display = (roleSelect.value==='emetteur')?'inline-block':'none';
    reGen.style.display = (roleSelect.value==='recepteur')?'inline-block':'none';
  }

  // When collaborator changes entity or function, adapt the other
  function applyEntityFunctionCoupling(){
    const user=ls.get(STORAGE.user,null); if(!user) return;
    const colEntSel=currentColEntity();
    const colFuncSel=currentColFunc();
    let ent=colEntSel.value; let fn=colFuncSel.value;

    // If function chosen first forces entity
    if(fn==='CEX'){ setOptions(colEntSel,['BAO']); ent='BAO'; colEntSel.disabled=true; }
    else if(fn==='CCO'){ setOptions(colEntSel,['DELCO']); ent='DELCO'; colEntSel.disabled=true; }
    else {
      // BO functions -> must be BO entity; but only if BO entities are allowed for counterpart
      const allowedEnts = counterpartEntitiesFor(user.entity);
      const boAllowed = BO_ENTS.filter(e=>allowedEnts.includes(e));
      if(F_BY_ENTITY.BOBA.includes(fn)){
        if(boAllowed.length){ setOptions(colEntSel, boAllowed); colEntSel.disabled=false; if(!boAllowed.includes(ent)) ent = boAllowed[0]; }
        else { // not allowed (e.g., user is BO) -> fallback to first allowed (BAO or DELCO)
          const fallback = allowedEnts;
          setOptions(colEntSel, fallback); ent=fallback[0]; colEntSel.disabled=false; // function list will be pruned by configure()
        }
      } else {
        // No function yet -> keep entity list per counterpart rule
        setOptions(colEntSel, allowedEnts);
        colEntSel.disabled=false;
      }
    }

    // If entity chosen first forces function set
    ent = colEntSel.value; // after possible reset
    if(ent==='BAO'){ setOptions(colFuncSel,['CEX']); colFuncSel.disabled=true; }
    else if(ent==='DELCO'){ setOptions(colFuncSel,['CCO']); colFuncSel.disabled=true; }
    else if(BO_ENTS.includes(ent)){
      setOptions(colFuncSel, F_BY_ENTITY[ent]); colFuncSel.disabled=false;
    }
  }

  reFuncCol.addEventListener('change', applyEntityFunctionCoupling);
  reEntityCol.addEventListener('change', applyEntityFunctionCoupling);
  emFuncCol.addEventListener('change', applyEntityFunctionCoupling);
  emEntityCol.addEventListener('change', applyEntityFunctionCoupling);

  roleSelect.addEventListener('change', ()=>{ const s=ls.get(STORAGE.settings,{}); s.role=roleSelect.value; ls.set(STORAGE.settings,s); configure(); });

  // Generators
  function loadCounters(){ return ls.get(STORAGE.counters,{}); }
  function saveCounters(c){ ls.set(STORAGE.counters,c); }
  function nextNumberFor(entity, role){ const c=loadCounters(); if(!c[entity]) c[entity]={emetteur:1,recepteur:1}; const n=c[entity][role]||1; c[entity][role]=Math.min(999,n+1); saveCounters(c); return n; }
  emGen.addEventListener('click',()=>{ const u=ls.get(STORAGE.user,null); if(!u) return; if(roleSelect.value!=='emetteur'){alert('Le générateur actif est côté Récepteur'); return;} emNum.value=nextNumberFor(u.entity,'emetteur'); });
  reGen.addEventListener('click',()=>{ const u=ls.get(STORAGE.user,null); if(!u) return; if(roleSelect.value!=='recepteur'){alert('Le générateur actif est côté Émetteur'); return;} reNum.value=nextNumberFor(u.entity,'recepteur'); });

  // Save & Refresh inline
  $('btnRefreshInline').addEventListener('click',()=>{ const u=ls.get(STORAGE.user,null); if(!u) return; emNum.value=reNum.value=''; $('message').value=''; const s=ls.get(STORAGE.settings,{}); s.role='emetteur'; ls.set(STORAGE.settings,s); roleSelect.value='emetteur'; configure(); });
  $('btnSave').addEventListener('click',()=>{ const u=ls.get(STORAGE.user,null); if(!u){alert("Identifiez-vous d'abord"); location.hash='#/auth'; route(); return;} if(!(emName.value||'').trim() || !(reName.value||'').trim()){ alert('Nom émetteur et nom récepteur requis'); return;} const time=`${(hh.value||'').padStart(2,'0')}:${(mm.value||'').padStart(2,'0')}`; const colEnt=currentColEntity().value; const colFunc=currentColFunc().value; const ownFunc=F_BY_ENTITY[u.entity][0]||''; // single value based on mapping
    // Determine which side is collaborator for saving
    const rec={ time, emNum:emNum.value.trim(), emName:emName.value.trim().toUpperCase(), emFunc: ownFunc, emEntity:u.entity, reNum:reNum.value.trim(), reName:reName.value.trim().toUpperCase(), reFunc: colFunc, reEntity: colEnt, message: ($('message').value||'').trim() };
    if(!rec.message){ alert('Message vide'); return; }
    // Guards: forbid BO<->BO and CEX<->CEX
    const isBO=e=>BO_ENTS.includes(e);
    if( (isBO(rec.emEntity) && isBO(rec.reEntity)) || (rec.emFunc==='CEX' && rec.reFunc==='CEX')){ alert('Combinaison non autorisée'); return; }
    const hist=ls.get(STORAGE.history,[]); hist.push(rec); ls.set(STORAGE.history,hist); const hint=$('saveHint'); hint.textContent='Enregistré ✓'; setTimeout(()=>hint.textContent='',1200); $('btnRefreshInline').click(); });

  // History
  function fillHistory(){ const tb=document.querySelector('#historyTable tbody'); tb.innerHTML=''; const hist=ls.get(STORAGE.history,[]); hist.forEach(r=>{ const tr=document.createElement('tr'); [r.time,r.emNum,r.emName,r.emFunc,r.emEntity,r.reNum,r.reName,r.reFunc,r.reEntity,r.message].forEach(v=>{ const td=document.createElement('td'); td.textContent=v??''; tr.appendChild(td); }); tb.appendChild(tr); }); }
  $('btnHistory').addEventListener('click',()=>{ location.hash='#/history'; route(); }); $('mHistory').addEventListener('click',()=>{ location.hash='#/history'; route(); }); $('btnBack').addEventListener('click',()=>{ location.hash='#/app'; route(); });
  $('btnClearAll').addEventListener('click',()=>{ if(!confirm("Supprimer tout l'historique ?")) return; ls.set(STORAGE.history,[]); fillHistory(); });
  $('btnExport').addEventListener('click',()=>{ const hist=ls.get(STORAGE.history,[]); const head=['heure','n_emetteur','nom_emetteur','fonction_emetteur','entite_emetteur','n_recepteur','nom_recepteur','fonction_recepteur','entite_recepteur','message']; const rows=hist.map(r=>[r.time,r.emNum,r.emName,r.emFunc,r.emEntity,r.reNum,r.reName,r.reFunc,r.reEntity,(r.message||'').replace(/\n/g,' ')]); const csv=[head.join(';')].concat(rows.map(a=>a.map(v=>`"${(v??'').toString().replaceAll('"','""')}"`).join(';'))).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='missaghji_history.csv'; a.click(); URL.revokeObjectURL(url); });

  // Menu / install / change entity
  const menuWrap=$('menuWrap'); $('btnMenu').addEventListener('click',()=>menuWrap.classList.toggle('open')); document.addEventListener('click',e=>{ if(!menuWrap.contains(e.target)) menuWrap.classList.remove('open'); });
  $('btnChangeEntity').addEventListener('click',gotoAuth); $('mChangeEntity').addEventListener('click',gotoAuth); function gotoAuth(e){ if(e){e.preventDefault();e.stopPropagation();} menuWrap.classList.remove('open'); location.hash='#/auth'; show('auth'); setTimeout(()=>$('authEntity').focus(),0); }

  let deferredPrompt=null; window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferredPrompt=e; $('btnInstall').classList.remove('hidden'); $('mInstall').classList.remove('hidden'); $('btnInstallHelp').classList.add('hidden'); $('mInstallHelp').classList.add('hidden'); });
  function promptInstall(){ if(!deferredPrompt){ alert("Installation non disponible pour l'instant. Utilisez le bouton d'aide."); return; } deferredPrompt.prompt(); deferredPrompt.userChoice.finally(()=>{ deferredPrompt=null; $('btnInstall').classList.add('hidden'); $('mInstall').classList.add('hidden'); }); }
  $('btnInstall').addEventListener('click',promptInstall); $('mInstall').addEventListener('click',()=>{ menuWrap.classList.remove('open'); promptInstall(); });
  $('btnInstallHelp').addEventListener('click',()=>{ alert("iPhone/iPad : Partager ▸ Ajouter à l'écran d'accueil.\nAndroid : menu ⋮ ▸ Ajouter à l'écran d'accueil."); }); $('mInstallHelp').addEventListener('click',()=>{ menuWrap.classList.remove('open'); alert("iPhone/iPad : Partager ▸ Ajouter à l'écran d'accueil.\nAndroid : menu ⋮ ▸ Ajouter à l'écran d'accueil."); });

  document.addEventListener('DOMContentLoaded',()=>{ fillAuth(); const s=ls.get(STORAGE.settings,{lang:'fr',role:'emetteur'}); applyLang(s.lang||'fr'); const u=ls.get(STORAGE.user,null); if(u){ authName.value=u.name; authEntity.value=u.entity; } route(); });
})();
