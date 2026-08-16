/* XIARA V7 — Core foundation
   Capa no destructiva sobre V6.2 estable.
*/
(function(){
'use strict';

window.XIARA_V7 = window.XIARA_V7 || {};
const V7 = window.XIARA_V7;

V7.version = '7.0.0-enterprise-dev';
V7.startedAt = V7.startedAt || new Date().toISOString();
V7.modules = V7.modules || {};
V7.flags = V7.flags || {
  safeMode:true,
  legacyCompatibility:true,
  destructiveMigration:false,
  autoDeleteLegacy:false,
  modularExtraction:false
};
V7.events = V7.events || new Map();
V7.onceKeys = V7.onceKeys || new Set();

V7.register = function(name, api){
  V7.modules[name] = {
    ...(api||{}),
    name,
    loadedAt:new Date().toISOString(),
    status:'loaded'
  };
  return V7.modules[name];
};

V7.once = function(key, fn){
  if(V7.onceKeys.has(key)) return false;
  V7.onceKeys.add(key);
  fn?.();
  return true;
};

V7.safe = async function(label, fn, fallback=null){
  try{
    return await fn();
  }catch(e){
    console.error('[XIARA V7]',label,e);
    window.XIARA_V7_RUNTIME = window.XIARA_V7_RUNTIME || {errors:[]};
    window.XIARA_V7_RUNTIME.errors.push({
      label,
      message:e?.message||String(e),
      at:new Date().toISOString()
    });
    return fallback;
  }
};

V7.on = function(event, handler){
  if(!V7.events.has(event)) V7.events.set(event,new Set());
  V7.events.get(event).add(handler);
  return ()=>V7.events.get(event)?.delete(handler);
};

V7.emit = function(event, payload){
  (V7.events.get(event)||[]).forEach(fn=>{
    try{ fn(payload); }catch(e){ console.warn('[XIARA V7 event]',event,e); }
  });
};

V7.getContext = function(){
  return window.XIARA_CONTEXT_API || null;
};

V7.getDB = function(){
  try{return V7.getContext()?.getDb?.()||null;}catch(_e){return null;}
};

V7.register('core',{
  version:V7.version,
  safeMode:true
});

})();
