/* HornetChat visitor widget v2
   Naya: online presence, notification sound, same-email user = same conversation
*/
(function () {
  var cfg = window.HORNET_FIREBASE_CONFIG;
  var st = window.HORNET_CHAT_SETTINGS || {};
  if (!cfg || cfg.apiKey === "PASTE_YOUR_API_KEY") {
    console.warn("[HornetChat] firebase-config.js mein apna Firebase config paste karo.");
    return;
  }
  var BRAND = st.brandName || "Support";
  var COLOR = st.brandColor || "#057DE2";
  var SIDE = st.position === "left" ? "left" : "right";

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  var FB = "https://www.gstatic.com/firebasejs/10.12.2/";
  Promise.resolve()
    .then(function () { return window.firebase ? null : loadScript(FB + "firebase-app-compat.js"); })
    .then(function () { return loadScript(FB + "firebase-auth-compat.js"); })
    .then(function () { return loadScript(FB + "firebase-firestore-compat.js"); })
    .then(init)
    .catch(function (e) { console.error("[HornetChat] SDK load failed", e); });

  // notification beep (no audio file needed)
  function beep() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = 0.08;
      o.start(); o.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  }

  function init() {
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    var db = firebase.firestore();
    var auth = firebase.auth();

    // ---- identity: email milta hai toh email-based ID (same user = same conversation, kisi bhi device se) ----
    function emailId(em) {
      return "e_" + em.toLowerCase().trim().replace(/[^a-z0-9]/g, "_").slice(0, 80);
    }
    var vid = localStorage.getItem("hornet_vid");
    if (!vid) {
      vid = "v_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      localStorage.setItem("hornet_vid", vid);
    }
    var savedEmail = localStorage.getItem("hornet_vemail") || "";
    if (savedEmail) vid = emailId(savedEmail);
    var vname = localStorage.getItem("hornet_vname") || "";

    // ---- styles ----
    var css = document.createElement("style");
    css.textContent =
      "#hc-bubble{position:fixed;bottom:22px;" + SIDE + ":22px;width:58px;height:58px;border-radius:50%;background:" + COLOR + ";box-shadow:0 6px 24px rgba(0,0,0,.28);cursor:pointer;z-index:999999;display:flex;align-items:center;justify-content:center;transition:transform .15s;}" +
      "#hc-bubble:hover{transform:scale(1.07);}" +
      "#hc-bubble svg{width:28px;height:28px;fill:#fff;}" +
      "#hc-badge{position:absolute;top:-4px;right:-4px;background:#E24B4A;color:#fff;font:700 11px/18px sans-serif;min-width:18px;height:18px;border-radius:9px;text-align:center;padding:0 4px;display:none;}" +
      "#hc-panel{position:fixed;bottom:92px;" + SIDE + ":22px;width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.24);z-index:999999;display:none;flex-direction:column;overflow:hidden;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;}" +
      "#hc-head{background:" + COLOR + ";color:#fff;padding:16px 18px;flex-shrink:0;}" +
      "#hc-head b{font-size:16px;display:block;}" +
      "#hc-head span{font-size:12px;opacity:.85;}" +
      "#hc-msgs{flex:1;overflow-y:auto;padding:14px;background:#F4F6F9;display:flex;flex-direction:column;gap:8px;}" +
      ".hc-m{max-width:80%;padding:9px 13px;border-radius:14px;font-size:14px;line-height:1.45;word-break:break-word;white-space:pre-wrap;}" +
      ".hc-me{align-self:flex-end;background:" + COLOR + ";color:#fff;border-bottom-right-radius:4px;}" +
      ".hc-them{align-self:flex-start;background:#fff;color:#1a1a1a;border-bottom-left-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,.08);}" +
      "#hc-form{display:flex;gap:8px;padding:12px;border-top:1px solid #e8e8e8;background:#fff;flex-shrink:0;}" +
      "#hc-in{flex:1;border:1.5px solid #ddd;border-radius:22px;padding:10px 15px;font-size:14px;outline:none;font-family:inherit;}" +
      "#hc-in:focus{border-color:" + COLOR + ";}" +
      "#hc-send{width:42px;height:42px;border-radius:50%;border:none;background:" + COLOR + ";color:#fff;cursor:pointer;font-size:16px;flex-shrink:0;}" +
      "#hc-name-wrap{padding:20px;display:flex;flex-direction:column;gap:10px;}" +
      "#hc-name-wrap input{border:1.5px solid #ddd;border-radius:10px;padding:11px 14px;font-size:14px;outline:none;}" +
      "#hc-name-wrap button{background:" + COLOR + ";color:#fff;border:none;border-radius:10px;padding:12px;font-size:14.5px;font-weight:600;cursor:pointer;}" +
      "@media(max-width:480px){#hc-panel{bottom:0;" + SIDE + ":0;width:100vw;max-width:100vw;height:100vh;max-height:100vh;border-radius:0;}}";
    document.head.appendChild(css);

    var bubble = document.createElement("div");
    bubble.id = "hc-bubble";
    bubble.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.6 1.3 4.9 3.4 6.5-.2.9-.8 2.3-1.9 3.3 0 0 2.7-.3 4.7-1.6 1.2.4 2.5.6 3.8.6 5.5 0 10-3.9 10-8.8S17.5 3 12 3z"/></svg>' +
      '<span id="hc-badge"></span>';
    document.body.appendChild(bubble);

    var panel = document.createElement("div");
    panel.id = "hc-panel";
    panel.innerHTML =
      '<div id="hc-head"><b>' + BRAND + '</b><span>Typically replies in a few minutes</span></div>' +
      '<div id="hc-body" style="flex:1;display:flex;flex-direction:column;min-height:0;"></div>';
    document.body.appendChild(panel);
    var body = panel.querySelector("#hc-body");

    var open = false, unread = 0;
    var badge = bubble.querySelector("#hc-badge");
    var baseTitle = document.title, titleTimer = null;

    function flashTitle() {
      if (titleTimer) return;
      var on = false;
      titleTimer = setInterval(function () {
        document.title = on ? baseTitle : "💬 New message!";
        on = !on;
      }, 1200);
    }
    function stopFlash() {
      if (titleTimer) { clearInterval(titleTimer); titleTimer = null; document.title = baseTitle; }
    }

    bubble.onclick = function () {
      open = !open;
      panel.style.display = open ? "flex" : "none";
      if (open) { unread = 0; badge.style.display = "none"; stopFlash(); scrollDown(); }
    };

    function askName() {
      body.innerHTML =
        '<div id="hc-name-wrap">' +
        '<div style="font-size:14px;color:#444;line-height:1.5;">' + (st.welcomeMessage || "Hi! Apna naam batayein aur chat shuru karein.") + '</div>' +
        '<input id="hc-nm" placeholder="Aapka naam" maxlength="40"/>' +
        '<input id="hc-em" placeholder="Email (same email = purani chat continue)" maxlength="80"/>' +
        '<button id="hc-go">Start chat</button></div>';
      body.querySelector("#hc-go").onclick = function () {
        var n = body.querySelector("#hc-nm").value.trim();
        if (!n) return;
        vname = n;
        localStorage.setItem("hornet_vname", n);
        var em = body.querySelector("#hc-em").value.trim();
        if (em) {
          localStorage.setItem("hornet_vemail", em);
          vid = emailId(em);
        }
        startChat(em);
      };
    }

    var msgsEl, inEl;
    function chatUI() {
      body.innerHTML =
        '<div id="hc-msgs"></div>' +
        '<div id="hc-form"><input id="hc-in" placeholder="Type a message…" maxlength="1000"/><button id="hc-send">➤</button></div>';
      msgsEl = body.querySelector("#hc-msgs");
      inEl = body.querySelector("#hc-in");
      body.querySelector("#hc-send").onclick = sendMsg;
      inEl.addEventListener("keydown", function (e) { if (e.key === "Enter") sendMsg(); });
    }

    function scrollDown() { if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight; }

    function render(msgs) {
      if (!msgsEl) return;
      msgsEl.innerHTML = "";
      var w = document.createElement("div");
      w.className = "hc-m hc-them";
      w.textContent = st.welcomeMessage || "Hi!";
      msgsEl.appendChild(w);
      msgs.forEach(function (m) {
        var d = document.createElement("div");
        d.className = "hc-m " + (m.from === "visitor" ? "hc-me" : "hc-them");
        d.textContent = m.text;
        msgsEl.appendChild(d);
      });
      scrollDown();
    }

    var convRef, lastCount = -1, hb = null;
    function heartbeat() {
      if (!convRef) return;
      convRef.set({ lastSeenVisitor: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }

    function startChat(email) {
      auth.signInAnonymously().then(function () {
        convRef = db.collection("conversations").doc(vid);
        convRef.set({
          visitorName: vname,
          visitorEmail: email || localStorage.getItem("hornet_vemail") || "",
          page: location.href,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastSeenVisitor: firebase.firestore.FieldValue.serverTimestamp(),
          status: "open"
        }, { merge: true });
        chatUI();

        // presence heartbeat — har 30s, jab tak page khula hai
        hb = setInterval(heartbeat, 30000);
        document.addEventListener("visibilitychange", function () {
          if (!document.hidden) heartbeat();
        });

        convRef.collection("messages").orderBy("ts").limit(500)
          .onSnapshot(function (snap) {
            var msgs = [];
            snap.forEach(function (d) { msgs.push(d.data()); });
            render(msgs);
            var last = msgs[msgs.length - 1];
            if (lastCount >= 0 && msgs.length > lastCount && last && last.from === "agent") {
              beep();
              if (!open) {
                unread += msgs.length - lastCount;
                badge.textContent = unread;
                badge.style.display = "block";
                flashTitle();
              }
            }
            lastCount = msgs.length;
          });
      }).catch(function (e) {
        console.error("[HornetChat] auth failed — Firebase console mein Anonymous sign-in enable karo", e);
      });
    }

    function sendMsg() {
      var t = inEl.value.trim();
      if (!t || !convRef) return;
      inEl.value = "";
      convRef.collection("messages").add({
        from: "visitor",
        text: t,
        ts: firebase.firestore.FieldValue.serverTimestamp()
      });
      convRef.set({
        lastMsg: t.slice(0, 120),
        visitorName: vname,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastSeenVisitor: firebase.firestore.FieldValue.serverTimestamp(),
        unreadForAgent: firebase.firestore.FieldValue.increment(1),
        status: "open"
      }, { merge: true });
    }

    if (vname) startChat("");
    else askName();
  }
})();
