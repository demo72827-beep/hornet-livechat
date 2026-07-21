// ============================================================
// HornetChat v3 — Firebase config (hornet-livechat project)
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
  // ---- Websites (CRM sites) ----
  // Har website ka ek id + label + brand color.
  // Widget embed karte waqt: <script>window.HORNET_SITE="visament"</script> widget.js se PEHLE.
  sites: [
    { id: "visament", label: "Visament", color: "#057DE2" },
    { id: "savetaxs", label: "SaveTaxs", color: "#6A0DAD" }
  ],
  defaultSite: "visament",

  brandName: "Visament Support",          // widget header (site color auto-lagega)
  welcomeMessage: "Hi! 👋 How can we help you today? Type your question and we'll reply shortly.",
  position: "right",

  // ---- Invite codes (BADAL DO, sirf team ko do) ----
  agentInviteCode: "HORNET2026",   // normal agent — sirf apni site ka inbox
  adminInviteCode: "HORNETADMIN",  // admin — saari sites + Reports

  maxFileKB: 700                    // attachment size limit (Firestore free plan ke liye)
};
