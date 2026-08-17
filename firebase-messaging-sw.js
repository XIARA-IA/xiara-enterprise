/* XIARA V8 Firebase Messaging service worker */
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBU9-uAaiYrBet2Bu1MTCaChOhWbwPoD2M",
  authDomain: "xiara-ia-auditoria.firebaseapp.com",
  projectId: "xiara-ia-auditoria",
  storageBucket: "xiara-ia-auditoria.firebasestorage.app",
  messagingSenderId: "224536298105",
  appId: "1:224536298105:web:a8d0663f9fca50b5b48aa8"
});

const messaging=firebase.messaging();
messaging.onBackgroundMessage(payload=>{
  const title=payload?.notification?.title||'XIARA Chat';
  const body=payload?.notification?.body||payload?.data?.body||'Nuevo mensaje';
  const conversationId=payload?.data?.conversationId||'';
  self.registration.showNotification(title,{
    body,
    data:{url:conversationId?`/?chat=${encodeURIComponent(conversationId)}`:'/'},
    tag:conversationId?`xiara-chat-${conversationId}`:'xiara-chat',
    renotify:true
  });
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=event.notification?.data?.url||'/';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){if('focus'in c){c.navigate(url);return c.focus();}}
    return clients.openWindow?clients.openWindow(url):null;
  }));
});
