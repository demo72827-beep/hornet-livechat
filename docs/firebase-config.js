// ============================================================
// HornetChat SaaS — Firebase config
// ============================================================
window.HORNET_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDlsgkbk9H625uJaiRGS6c942PIA5W_-94",
  authDomain: "hornet-livechat.firebaseapp.com",
  projectId: "hornet-livechat",
  storageBucket: "hornet-livechat.firebasestorage.app",
  messagingSenderId: "479639856377",
  appId: "1:479639856377:web:3b3751181d06344c196e28"
};

window.HORNET_CHAT_SETTINGS = {
  productName: "HornetChat",
  // MASTER ADMIN — apna email daalo (wahi jo aapke Firebase agent account ka hai).
  // Yahi email firestore.rules mein bhi daalna hai (dono jagah SAME hona chahiye).
  superAdminEmail: "masterpanel@gmail.com",
  maxFileKB: 700
};
