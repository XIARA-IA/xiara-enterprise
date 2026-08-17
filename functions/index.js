const {setGlobalOptions}=require("firebase-functions/v2");
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {initializeApp}=require("firebase-admin/app");
const {getAuth}=require("firebase-admin/auth");
const {getFirestore,FieldValue,Timestamp}=require("firebase-admin/firestore");
const {getStorage}=require("firebase-admin/storage");
const {getMessaging}=require("firebase-admin/messaging");
const crypto=require("crypto");

initializeApp();
setGlobalOptions({region:"us-east1",maxInstances:10});
const db=getFirestore(),auth=getAuth();

const MODULES=["dashboard","notificaciones","chat","legal","finanzas","fiscalidad","compliance","documental","rrhh","socios","conferencia","agenda","firma","informes","empresas","usuarios","config"];
const ACTIONS=["ver","crear","editar","borrar","subir","descargar"];

async function access(uid){
  const s=await db.doc(`access/${uid}`).get();
  return s.exists?{uid,...s.data()}:null;
}
function isAdmin(a){return !!a&&a.activo!==false&&String(a.rol||"").toLowerCase()==="administrador";}
async function requireAdmin(req){
  if(!req.auth)throw new HttpsError("unauthenticated","Inicia sesión.");
  const a=await access(req.auth.uid);
  if(!isAdmin(a))throw new HttpsError("permission-denied","Solo Administrador.");
  return a;
}
function cleanP(raw){
  const o={};
  for(const m of MODULES){
    o[m]={};
    for(const a of ACTIONS)o[m][a]=!!raw?.[m]?.[a];
    if(ACTIONS.some(a=>a!=="ver"&&o[m][a]))o[m].ver=true;
  }
  return o;
}
function cleanC(v){return[...new Set((Array.isArray(v)?v:[]).map(String).map(x=>x.trim()).filter(Boolean))].slice(0,50);}
function companyAllowed(a,c){return isAdmin(a)||(a?.activo!==false&&Array.isArray(a?.empresas)&&a.empresas.includes(c));}
function hasPerm(a,m,act){return isAdmin(a)||!!a?.permisos?.[m]?.[act];}
async function requireChat(req,companyId,action="ver"){
  if(!req.auth)throw new HttpsError("unauthenticated","Inicia sesión.");
  const a=await access(req.auth.uid);
  if(!a||a.activo===false)throw new HttpsError("permission-denied","Usuario inactivo.");
  if(!companyAllowed(a,companyId))throw new HttpsError("permission-denied","Empresa no autorizada.");
  if(!hasPerm(a,"chat",action))throw new HttpsError("permission-denied",`Sin permiso chat:${action}.`);
  return a;
}
async function conversationFor(uid,cid,allowAdminAudit=true){
  const ref=db.doc(`chat_conversations/${cid}`),s=await ref.get();
  if(!s.exists)throw new HttpsError("not-found","Conversación no encontrada.");
  const c={id:s.id,...s.data()},a=await access(uid);
  if((c.memberUids||[]).includes(uid))return {ref,c,a};
  if(allowAdminAudit&&isAdmin(a)){
    const st=await db.doc(`chat_settings/${c.empresa_id}`).get();
    if(st.exists&&st.data().auditAdmin===true)return {ref,c,a};
  }
  throw new HttpsError("permission-denied","No perteneces a esta conversación.");
}
async function listActiveAccess(companyId){
  const snap=await db.collection("access").where("activo","==",true).where("empresas","array-contains",companyId).get();
  return snap.docs.map(d=>({uid:d.id,...d.data()}));
}
async function syncAreaMemberships(uid,a){
  const companies=a?.empresas||[];
  for(const companyId of companies){
    const qs=await db.collection("chat_conversations").where("empresa_id","==",companyId).where("type","==","area").get();
    for(const d of qs.docs){
      const c=d.data(),area=c.area;
      const should=a.activo!==false&&hasPerm(a,"chat","ver")&&(isAdmin(a)||hasPerm(a,area,"ver"));
      await d.ref.update({
        memberUids:should?FieldValue.arrayUnion(uid):FieldValue.arrayRemove(uid),
        [`memberProfiles.${uid}`]:should?{uid,name:a.nombre||a.email||"Usuario",email:a.email||""}:FieldValue.delete()
      });
    }
  }
}

// -------- Existing RBAC --------
exports.adminCreateXiaraUser=onCall(async req=>{
  await requireAdmin(req);
  const d=req.data||{},email=String(d.email||"").trim().toLowerCase(),displayName=String(d.displayName||"").trim(),empresas=cleanC(d.empresas);
  if(!email||!displayName||!empresas.length)throw new HttpsError("invalid-argument","Nombre, email y empresa obligatorios.");
  let u;
  try{u=await auth.createUser({email,displayName,password:crypto.randomBytes(24).toString("base64url"),disabled:false});}
  catch(e){if(e.code==="auth/email-already-exists")throw new HttpsError("already-exists","Ese email ya existe.");throw e;}
  const a={uid:u.uid,email,nombre:displayName,rol:String(d.rol||"Personalizado"),activo:true,empresas,permisos:cleanP(d.permisos),createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()};
  await db.doc(`access/${u.uid}`).set(a,{merge:true});
  await db.doc(`usuarios/${u.uid}`).set({id:u.uid,authUid:u.uid,email,nombre:displayName,rol:a.rol,empresa_id:empresas[0],empresas,activo:true,updatedAt:FieldValue.serverTimestamp()},{merge:true});
  await syncAreaMemberships(u.uid,a).catch(()=>{});
  let resetLink=null;try{resetLink=await auth.generatePasswordResetLink(email);}catch(_e){}
  return{ok:true,uid:u.uid,resetLink};
});
exports.adminUpdateXiaraAccess=onCall(async req=>{
  await requireAdmin(req);
  const d=req.data||{},uid=String(d.uid||"").trim(),empresas=cleanC(d.empresas);
  if(!uid||!empresas.length)throw new HttpsError("invalid-argument","UID y empresa requeridos.");
  const p={nombre:String(d.displayName||"").trim(),rol:String(d.rol||"Personalizado"),activo:d.activo!==false,empresas,permisos:cleanP(d.permisos),updatedAt:FieldValue.serverTimestamp()};
  await db.doc(`access/${uid}`).set(p,{merge:true});
  await db.doc(`usuarios/${uid}`).set({id:uid,authUid:uid,nombre:p.nombre,rol:p.rol,empresa_id:empresas[0],empresas,activo:p.activo,updatedAt:FieldValue.serverTimestamp()},{merge:true});
  await auth.updateUser(uid,{displayName:p.nombre||undefined,disabled:!p.activo});
  await syncAreaMemberships(uid,{uid,...p}).catch(()=>{});
  return{ok:true};
});
exports.adminSetXiaraUserDisabled=onCall(async req=>{
  await requireAdmin(req);
  const uid=String(req.data?.uid||"").trim(),disabled=!!req.data?.disabled;
  if(uid===req.auth.uid&&disabled)throw new HttpsError("failed-precondition","No puedes desactivarte.");
  await auth.updateUser(uid,{disabled});
  await db.doc(`access/${uid}`).set({activo:!disabled,updatedAt:FieldValue.serverTimestamp()},{merge:true});
  const a=await access(uid);if(a)await syncAreaMemberships(uid,a).catch(()=>{});
  return{ok:true};
});
exports.adminListXiaraUsers=onCall(async req=>{
  await requireAdmin(req);
  const p=await auth.listUsers(500),refs=p.users.map(u=>db.doc(`access/${u.uid}`)),sn=refs.length?await db.getAll(...refs):[],map={};
  sn.forEach(s=>{if(s.exists)map[s.id]=s.data();});
  return{users:p.users.map(u=>({uid:u.uid,email:u.email||"",displayName:u.displayName||"",disabled:!!u.disabled,access:map[u.uid]||null}))};
});

// -------- Chat --------
exports.chatHealth=onCall(async req=>{
  if(!req.auth)throw new HttpsError("unauthenticated","Inicia sesión.");
  const a=await access(req.auth.uid);
  return{ok:!!a&&a.activo!==false,uid:req.auth.uid,version:"8.0.0-enterprise-rc1"};
});
exports.chatListPeers=onCall(async req=>{
  const companyId=String(req.data?.companyId||"");
  const me=await requireChat(req,companyId,"ver");
  const rows=await listActiveAccess(companyId);
  return{users:rows.filter(x=>x.uid!==req.auth.uid&&hasPerm(x,"chat","ver")).map(x=>({uid:x.uid,name:x.nombre||x.email,email:x.email||"",rol:x.rol||""}))};
});
exports.chatEnsureDirect=onCall(async req=>{
  const companyId=String(req.data?.companyId||""),otherUid=String(req.data?.otherUid||"");
  const me=await requireChat(req,companyId,"crear"),other=await access(otherUid);
  if(!other||other.activo===false||!companyAllowed(other,companyId)||!hasPerm(other,"chat","ver"))throw new HttpsError("failed-precondition","El usuario destino no está disponible para chat en esta empresa.");
  const ids=[req.auth.uid,otherUid].sort(),directKey=`${companyId}_${ids.join("_")}`;
  const q=await db.collection("chat_conversations").where("directKey","==",directKey).limit(1).get();
  if(!q.empty)return{conversationId:q.docs[0].id,created:false};
  const ref=db.collection("chat_conversations").doc();
  await ref.set({
    empresa_id:companyId,type:"direct",directKey,memberUids:ids,
    memberProfiles:{
      [req.auth.uid]:{uid:req.auth.uid,name:me.nombre||me.email||"Usuario",email:me.email||""},
      [otherUid]:{uid:otherUid,name:other.nombre||other.email||"Usuario",email:other.email||""}
    },
    unreadBy:{[req.auth.uid]:0,[otherUid]:0},pinnedBy:[],mutedBy:[],lastReadAtBy:{},lastDeliveredAtBy:{},
    createdBy:req.auth.uid,createdAt:FieldValue.serverTimestamp(),lastMessageAt:FieldValue.serverTimestamp(),lastMessageText:""
  });
  return{conversationId:ref.id,created:true};
});
exports.chatEnsureArea=onCall(async req=>{
  const companyId=String(req.data?.companyId||""),area=String(req.data?.area||""),name=String(req.data?.name||`Área ${area}`);
  const me=await requireChat(req,companyId,"crear");
  if(!isAdmin(me)&&!hasPerm(me,area,"ver"))throw new HttpsError("permission-denied","No perteneces a esa área.");
  const key=`${companyId}_${area}`;
  const q=await db.collection("chat_conversations").where("areaKey","==",key).limit(1).get();
  if(!q.empty)return{conversationId:q.docs[0].id,created:false};
  const users=await listActiveAccess(companyId);
  const members=users.filter(x=>hasPerm(x,"chat","ver")&&(isAdmin(x)||hasPerm(x,area,"ver")));
  const memberUids=members.map(x=>x.uid),profiles={},unread={};
  members.forEach(x=>{profiles[x.uid]={uid:x.uid,name:x.nombre||x.email||"Usuario",email:x.email||""};unread[x.uid]=0;});
  const ref=db.collection("chat_conversations").doc();
  await ref.set({
    empresa_id:companyId,type:"area",area,areaKey:key,name,memberUids,memberProfiles:profiles,
    unreadBy:unread,pinnedBy:[],mutedBy:[],lastReadAtBy:{},lastDeliveredAtBy:{},
    createdBy:req.auth.uid,createdAt:FieldValue.serverTimestamp(),lastMessageAt:FieldValue.serverTimestamp(),lastMessageText:""
  });
  return{conversationId:ref.id,created:true};
});
exports.chatSendMessage=onCall(async req=>{
  const d=req.data||{},cid=String(d.conversationId||""),messageId=String(d.messageId||crypto.randomUUID());
  const {ref,c,a}=await conversationFor(req.auth?.uid,cid,false);
  await requireChat(req,c.empresa_id,"crear");
  const text=String(d.text||"").trim().slice(0,10000),attachment=d.attachment||null;
  if(!text&&!attachment)throw new HttpsError("invalid-argument","Mensaje vacío.");
  const msgRef=ref.collection("messages").doc(messageId);
  const msg={
    senderUid:req.auth.uid,senderName:a.nombre||a.email||"Usuario",text,
    type:attachment?(String(attachment.mime||"").startsWith("image/")?"image":"file"):"text",
    attachment:attachment||null,replyTo:d.replyTo||null,createdAt:FieldValue.serverTimestamp(),deletedAt:null
  };
  await msgRef.set(msg);
  const patch={lastMessageAt:FieldValue.serverTimestamp(),lastMessageText:text||`📎 ${attachment?.name||"Adjunto"}`};
  for(const member of c.memberUids||[]){
    if(member!==req.auth.uid)patch[`unreadBy.${member}`]=FieldValue.increment(1);
  }
  patch[`unreadBy.${req.auth.uid}`]=0;
  await ref.update(patch);

  const settings=await db.doc(`chat_settings/${c.empresa_id}`).get();
  if(settings.exists&&settings.data().auditAdmin===true){
    await db.collection("chat_audit").add({empresa_id:c.empresa_id,conversationId:cid,messageId,senderUid:req.auth.uid,event:"message_sent",createdAt:FieldValue.serverTimestamp()});
  }

  const recipients=(c.memberUids||[]).filter(x=>x!==req.auth.uid&&!((c.mutedBy||[]).includes(x)));
  if(recipients.length){
    const devices=await db.collection("chat_devices").where("uid","in",recipients.slice(0,30)).get().catch(()=>null);
    const tokens=devices?devices.docs.map(x=>x.data().token).filter(Boolean):[];
    if(tokens.length){
      const res=await getMessaging().sendEachForMulticast({
        tokens:tokens.slice(0,500),
        notification:{title:`XIARA — ${a.nombre||a.email||"Nuevo mensaje"}`,body:(text||`Adjunto: ${attachment?.name||"archivo"}`).slice(0,180)},
        data:{conversationId:cid,companyId:c.empresa_id,body:(text||"Nuevo adjunto").slice(0,180)},
        webpush:{fcmOptions:{link:`https://xiara-ia-auditoria.web.app/?chat=${encodeURIComponent(cid)}`}}
      }).catch(()=>null);
      if(res){
        const bad=[];res.responses.forEach((r,i)=>{if(!r.success&&tokens[i])bad.push(tokens[i]);});
        if(bad.length){
          const qs=await db.collection("chat_devices").where("token","in",bad.slice(0,30)).get().catch(()=>null);
          if(qs){const batch=db.batch();qs.docs.forEach(d=>batch.delete(d.ref));await batch.commit().catch(()=>{});}
        }
      }
    }
  }
  return{ok:true,messageId};
});
exports.chatDeleteOwnMessage=onCall(async req=>{
  const cid=String(req.data?.conversationId||""),mid=String(req.data?.messageId||"");
  const {ref,c}=await conversationFor(req.auth?.uid,cid,false);
  const mr=ref.collection("messages").doc(mid),s=await mr.get();
  if(!s.exists)throw new HttpsError("not-found","Mensaje no encontrado.");
  const m=s.data();
  if(m.senderUid!==req.auth.uid)throw new HttpsError("permission-denied","Solo puedes borrar tu propio mensaje.");
  await mr.update({text:"",attachment:null,deletedAt:FieldValue.serverTimestamp(),deletedBy:req.auth.uid});
  if(m.attachment?.path){await getStorage().bucket().file(m.attachment.path).delete({ignoreNotFound:true}).catch(()=>{});}
  return{ok:true};
});
exports.chatMarkDelivered=onCall(async req=>{
  const cid=String(req.data?.conversationId||""),{ref}=await conversationFor(req.auth?.uid,cid,false);
  await ref.update({[`lastDeliveredAtBy.${req.auth.uid}`]:FieldValue.serverTimestamp()});
  return{ok:true};
});
exports.chatMarkRead=onCall(async req=>{
  const cid=String(req.data?.conversationId||""),{ref}=await conversationFor(req.auth?.uid,cid,false);
  await ref.update({[`lastReadAtBy.${req.auth.uid}`]:FieldValue.serverTimestamp(),[`lastDeliveredAtBy.${req.auth.uid}`]:FieldValue.serverTimestamp(),[`unreadBy.${req.auth.uid}`]:0});
  return{ok:true};
});
exports.chatTyping=onCall(async req=>{
  const cid=String(req.data?.conversationId||""),typing=!!req.data?.typing,{c,a}=await conversationFor(req.auth?.uid,cid,false);
  const ref=db.doc(`chat_typing/${cid}_${req.auth.uid}`);
  if(!typing){await ref.delete().catch(()=>{});return{ok:true};}
  await ref.set({conversationId:cid,empresa_id:c.empresa_id,uid:req.auth.uid,name:a.nombre||a.email||"Usuario",expiresAtMs:Date.now()+5000,updatedAt:FieldValue.serverTimestamp()},{merge:true});
  return{ok:true};
});
exports.chatSetOption=onCall(async req=>{
  const cid=String(req.data?.conversationId||""),option=String(req.data?.option||""),value=!!req.data?.value,{ref}=await conversationFor(req.auth?.uid,cid,false);
  const field=option==="pin"?"pinnedBy":option==="mute"?"mutedBy":null;
  if(!field)throw new HttpsError("invalid-argument","Opción inválida.");
  await ref.update({[field]:value?FieldValue.arrayUnion(req.auth.uid):FieldValue.arrayRemove(req.auth.uid)});
  return{ok:true};
});
exports.chatRegisterPush=onCall(async req=>{
  const companyId=String(req.data?.companyId||""),token=String(req.data?.token||"");
  await requireChat(req,companyId,"ver");
  if(!token)throw new HttpsError("invalid-argument","Token requerido.");
  const id=crypto.createHash("sha256").update(token).digest("hex");
  await db.doc(`chat_devices/${id}`).set({uid:req.auth.uid,empresa_id:companyId,token,userAgent:String(req.data?.userAgent||"").slice(0,500),updatedAt:FieldValue.serverTimestamp()},{merge:true});
  return{ok:true};
});
exports.chatGetSettings=onCall(async req=>{
  const companyId=String(req.data?.companyId||"");
  const a=await requireChat(req,companyId,"ver");
  const s=await db.doc(`chat_settings/${companyId}`).get(),d=s.exists?s.data():{};
  return{auditAdmin:!!d.auditAdmin,vapidPublicKey:String(d.vapidPublicKey||"")};
});
exports.chatSetSettings=onCall(async req=>{
  const a=await requireAdmin(req),companyId=String(req.data?.companyId||"");
  if(!companyAllowed(a,companyId))throw new HttpsError("permission-denied","Empresa no autorizada.");
  await db.doc(`chat_settings/${companyId}`).set({auditAdmin:!!req.data?.auditAdmin,vapidPublicKey:String(req.data?.vapidPublicKey||"").trim(),updatedAt:FieldValue.serverTimestamp()},{merge:true});
  return{ok:true};
});
