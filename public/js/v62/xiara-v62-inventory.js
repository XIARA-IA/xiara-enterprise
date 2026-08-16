/* XIARA V6.2 — Modularization inventory
   Solo observa y clasifica. No mueve ni elimina lógica.
*/
(function(){
'use strict';

window.XIARA_V62_MODULES = window.XIARA_V62_MODULES || {};

const STATIC = {"declaredFunctionCount": 353, "windowFunctionCount": 219, "onclickHandlerCount": 392, "staticIdCount": 485, "indexBytes": 1153614};

const GROUPS = {
  legal: ['legal','caso','judicial','laboral'],
  rrhh: ['rrhh','employee','empleado','nomina','dni','contrato'],
  finanzas: ['factura','finance','finanza','fiscal'],
  documental: ['document','ocr','pdf','scan','archivo'],
  firma: ['firma','sign'],
  agenda: ['agenda','tarea','conference','conferencia'],
  socios: ['socio','gobierno'],
  sistema: ['xiara','render','save','load','audit','diag','health','context']
};

function classifyName(name){
  const n=String(name||'').toLowerCase();
  const hits=[];
  Object.entries(GROUPS).forEach(([group, words])=>{
    if(words.some(w=>n.includes(w))) hits.push(group);
  });
  return hits.length ? hits : ['otros'];
}

function runtimeFunctions(){
  const names=[];
  try{
    Object.getOwnPropertyNames(window).forEach(name=>{
      try{
        if(typeof window[name]==='function' && (
          name.startsWith('xiara') ||
          name.startsWith('render') ||
          name.startsWith('open') ||
          name.startsWith('save') ||
          name.startsWith('upload') ||
          name.startsWith('delete') ||
          name.startsWith('download')
        )) names.push(name);
      }catch(_e){}
    });
  }catch(_e){}
  return [...new Set(names)].sort();
}

function buildInventory(){
  const funcs=runtimeFunctions();
  const groups={};
  funcs.forEach(name=>{
    classifyName(name).forEach(group=>{
      groups[group]=groups[group]||[];
      groups[group].push(name);
    });
  });

  const result={
    ok:true,
    static:STATIC,
    runtimeFunctionCount:funcs.length,
    runtimeGroups:Object.fromEntries(
      Object.entries(groups).map(([k,v])=>[k,{count:v.length,names:v.slice(0,80)}])
    ),
    contextOk:!!window.XIARA_CONTEXT_API,
    architectureOk:!!window.XIARA_V62_MODULES?.architecture,
    observabilityOk:!!window.XIARA_V62_MODULES?.observability,
    checkedAt:new Date().toISOString()
  };

  window.XIARA_V62_MODULE_INVENTORY=result;
  return result;
}

window.XIARA_V62_MODULES.inventory={
  version:'6.2.0',
  loadedAt:new Date().toISOString(),
  status:'loaded',
  buildInventory
};

window.xiaraV62ModuleInventory=function(){
  const r=buildInventory();
  const groupLines=Object.entries(r.runtimeGroups)
    .sort((a,b)=>b[1].count-a[1].count)
    .map(([g,v])=>g+': '+v.count)
    .join('\n');

  alert(
    'INVENTARIO MODULAR V6.2\n\n'+
    'Funciones estáticas declaradas: '+r.static.declaredFunctionCount+'\n'+
    'Funciones window estáticas: '+r.static.windowFunctionCount+'\n'+
    'Handlers onclick: '+r.static.onclickHandlerCount+'\n'+
    'Funciones runtime clasificadas: '+r.runtimeFunctionCount+'\n'+
    'Tamaño index: '+Math.round(r.static.indexBytes/1024)+' KB\n\n'+
    'GRUPOS RUNTIME\n'+groupLines+'\n\n'+
    'No se modificó ninguna función.'
  );
  return r;
};

window.xiaraV62ExtractionCandidates=function(){
  const r=buildInventory();
  const candidates=[];

  Object.entries(r.runtimeGroups).forEach(([group,data])=>{
    if(group==='sistema'){
      data.names.forEach(name=>{
        const low=name.toLowerCase();
        if(
          low.includes('audit') ||
          low.includes('diag') ||
          low.includes('health') ||
          low.includes('context')
        ){
          candidates.push({name,group,priority:'alta',reason:'infraestructura/diagnóstico'});
        }
      });
    }
  });

  window.XIARA_V62_EXTRACTION_CANDIDATES=candidates;

  alert(
    'CANDIDATOS DE EXTRACCIÓN V6.2\n\n'+
    'Candidatos técnicos detectados: '+candidates.length+'\n'+
    candidates.slice(0,18).map(x=>'• '+x.name).join('\n')+
    (candidates.length>18?'\n...':'')+
    '\n\nEsto es solo inventario; no se extrajo código.'
  );

  return candidates;
};

})();
