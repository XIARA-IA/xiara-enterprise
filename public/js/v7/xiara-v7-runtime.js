/* XIARA V7 — Runtime hardening */
(function(){
'use strict';
const V7 = window.XIARA_V7;
if(!V7) throw new Error('XIARA_V7 core no disponible');

window.XIARA_V7_RUNTIME = window.XIARA_V7_RUNTIME || {
  errors:[],
  rejections:[],
  longTasks:[],
  startedAt:new Date().toISOString()
};

const R = window.XIARA_V7_RUNTIME;

V7.once('runtime-error-hooks',()=>{
  window.addEventListener('error',e=>{
    R.errors.push({
      message:e?.message||'error',
      source:e?.filename||'',
      line:e?.lineno||0,
      at:new Date().toISOString()
    });
    if(R.errors.length>50) R.errors.splice(0,R.errors.length-50);
  });

  window.addEventListener('unhandledrejection',e=>{
    R.rejections.push({
      message:e?.reason?.message||String(e?.reason||'rejection'),
      at:new Date().toISOString()
    });
    if(R.rejections.length>50) R.rejections.splice(0,R.rejections.length-50);
  });

  try{
    if('PerformanceObserver' in window && !window.__XIARA_V7_LONGTASK_OBSERVER){
      const obs=new PerformanceObserver(list=>{
        list.getEntries().forEach(entry=>{
          R.longTasks.push({
            duration:Math.round(entry.duration),
            start:Math.round(entry.startTime)
          });
        });
        if(R.longTasks.length>50) R.longTasks.splice(0,R.longTasks.length-50);
      });
      obs.observe({entryTypes:['longtask']});
      window.__XIARA_V7_LONGTASK_OBSERVER=obs;
    }
  }catch(_e){}
});

window.xiaraV7RuntimeSnapshot=function(){
  return {
    errors:R.errors.length,
    rejections:R.rejections.length,
    longTasks:R.longTasks.length,
    legacyErrors:window.XIARA_DIAG?.errors?.length||0,
    legacyRejections:window.XIARA_DIAG?.rejections?.length||0,
    operationFailures:window.XIARA_OPS?.failures?.length||0,
    activeListeners:window.XIARA_PERF?.activeSnapshotListeners||0,
    modules:Object.keys(V7.modules||{})
  };
};

V7.register('runtime',{
  snapshot:window.xiaraV7RuntimeSnapshot
});

})();
