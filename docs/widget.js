/* HornetChat SaaS widget
   Embed on any website (before </body>):
   <script>window.HORNET_PROJECT = "YOUR_PROJECT_ID";</script>
   <script src="https://YOURUSER.github.io/hornet-livechat/firebase-config.js"></script>
   <script src="https://YOURUSER.github.io/hornet-livechat/widget.js"></script>
   Project ID milta hai dashboard se (agent.html → your project → Embed code)
*/
(function () {
  var cfg = window.HORNET_FIREBASE_CONFIG;
  var st = window.HORNET_CHAT_SETTINGS || {};
  var PROJECT_ID = window.HORNET_PROJECT || "";
  if (!cfg) { console.warn("[HornetChat] Missing firebase-config.js"); return; }
  if (!PROJECT_ID) { console.warn("[HornetChat] Set window.HORNET_PROJECT before loading widget.js"); return; }
  var MAX_KB = st.maxFileKB || 700;

  var ICON = {
    chat: '<svg viewBox="0 0 24 24" width="28" height="28" fill="#fff"><path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.6 1.3 4.9 3.4 6.5-.2.9-.8 2.3-1.9 3.3 0 0 2.7-.3 4.7-1.6 1.2.4 2.5.6 3.8.6 5.5 0 10-3.9 10-8.8S17.5 3 12 3z"/></svg>',
    send: '<svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M3.4 20.4l17.4-7.5c.9-.4.9-1.6 0-2L3.4 3.4c-.8-.4-1.6.4-1.3 1.2L4.6 11c.1.3.4.5.7.5h6.2c.3 0 .3.5 0 .5H5.3c-.3 0-.6.2-.7.5l-2.5 6.6c-.3.9.5 1.7 1.3 1.3z"/></svg>',
    clip: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#667" stroke-width="1.8" stroke-linecap="round"><path d="M21 12.5l-8.2 8.2a5.5 5.5 0 01-7.8-7.8L13.5 4.4a3.7 3.7 0 015.2 5.2l-8.3 8.3a1.8 1.8 0 01-2.6-2.6l7.6-7.6"/></svg>',
    file: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>'
  };

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
    .then(boot)
    .catch(function (e) { console.error("[HornetChat] SDK load failed", e); });

  function beep() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = 0.08;
      o.start(); o.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  }

  function boot() {
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    var db = firebase.firestore();
    var auth = firebase.auth();

    auth.signInAnonymously().then(function () {
      return db.collection("projects").doc(PROJECT_ID).get();
    }).then(function (doc) {
      if (!doc.exists) {
        console.warn("[HornetChat] Project not found: " + PROJECT_ID);
        return;
      }
      var p = doc.data();
      init(db, {
        ownerUid: p.ownerUid,
        brand: p.name || "Support",
        color: p.color || "#057DE2",
        welcome: p.welcome || "Hi! How can we help you today?",
        position: p.position === "left" ? "left" : "right"
      });
    }).catch(function (e) {
      console.error("[HornetChat] Could not load project — check Anonymous auth + rules", e);
    });

    function init(db, P) {
      var COLOR = P.color, SIDE = P.position;

      function emailId(em) {
        return em.toLowerCase().trim().replace(/[^a-z0-9]/g, "_").slice(0, 70);
      }
      var lsKey = "hornet_" + PROJECT_ID + "_";
      var vid = localStorage.getItem(lsKey + "vid");
      if (!vid) {
        vid = "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        localStorage.setItem(lsKey + "vid", vid);
      }
      var savedEmail = localStorage.getItem(lsKey + "email") || "";
      var convId = PROJECT_ID + "__" + (savedEmail ? "e_" + emailId(savedEmail) : vid);
      var vname = localStorage.getItem(lsKey + "name") || "";

      var css = document.createElement("style");
      css.textContent =
        "#hc-bubble{position:fixed;bottom:22px;" + SIDE + ":22px;width:58px;height:58px;border-radius:50%;background:" + COLOR + ";box-shadow:0 6px 24px rgba(0,0,0,.28);cursor:pointer;z-index:999999;display:flex;align-items:center;justify-content:center;transition:transform .15s;}" +
        "#hc-bubble:hover{transform:scale(1.07);}" +
        "#hc-badge{position:absolute;top:-4px;right:-4px;background:#E24B4A;color:#fff;font:700 11px/18px sans-serif;min-width:18px;height:18px;border-radius:9px;text-align:center;padding:0 4px;display:none;}" +
        "#hc-panel{position:fixed;bottom:92px;" + SIDE + ":22px;width:360px;max-width:calc(100vw - 32px);height:540px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.24);z-index:999999;display:none;flex-direction:column;overflow:hidden;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;}" +
        "#hc-head{background:" + COLOR + ";color:#fff;padding:16px 18px;flex-shrink:0;}" +
        "#hc-head b{font-size:16px;display:block;}" +
        "#hc-head span{font-size:12px;opacity:.85;}" +
        "#hc-msgs{flex:1;overflow-y:auto;padding:14px;background:#F4F6F9;display:flex;flex-direction:column;gap:8px;}" +
        ".hc-m{max-width:80%;padding:9px 13px;border-radius:14px;font-size:14px;line-height:1.45;word-break:break-word;white-space:pre-wrap;}" +
        ".hc-me{align-self:flex-end;background:" + COLOR + ";color:#fff;border-bottom-right-radius:4px;}" +
        ".hc-them{align-self:flex-start;background:#fff;color:#1a1a1a;border-bottom-left-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,.08);}" +
        ".hc-m img{max-width:100%;border-radius:8px;display:block;margin-top:4px;}" +
        ".hc-filelink{display:inline-flex;align-items:center;gap:6px;font-size:13px;text-decoration:underline;color:inherit;cursor:pointer;margin-top:4px;}" +
        "#hc-form{display:flex;gap:6px;padding:12px;border-top:1px solid #e8e8e8;background:#fff;flex-shrink:0;align-items:center;}" +
        "#hc-in{flex:1;border:1.5px solid #ddd;border-radius:22px;padding:10px 15px;font-size:14px;outline:none;font-family:inherit;min-width:0;}" +
        "#hc-in:focus{border-color:" + COLOR + ";}" +
        "#hc-send{width:42px;height:42px;border-radius:50%;border:none;background:" + COLOR + ";cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;}" +
        "#hc-attach{width:38px;height:38px;border-radius:50%;border:none;background:#F0F2F5;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;}" +
        "#hc-name-wrap{padding:20px;display:flex;flex-direction:column;gap:10px;}" +
        "#hc-name-wrap input{border:1.5px solid #ddd;border-radius:10px;padding:11px 14px;font-size:14px;outline:none;}" +
        "#hc-name-wrap button{background:" + COLOR + ";color:#fff;border:none;border-radius:10px;padding:12px;font-size:14.5px;font-weight:600;cursor:pointer;}" +
        "@media(max-width:480px){#hc-panel{bottom:0;" + SIDE + ":0;width:100vw;max-width:100vw;height:100vh;max-height:100vh;border-radius:0;}}";
      document.head.appendChild(css);

      var bubble = document.createElement("div");
      bubble.id = "hc-bubble";
      bubble.innerHTML = ICON.chat + '<span id="hc-badge"></span>';
      document.body.appendChild(bubble);

      var panel = document.createElement("div");
      panel.id = "hc-panel";
      panel.innerHTML =
        '<div id="hc-head"><b>' + P.brand.replace(/</g, "&lt;") + '</b><span>We typically reply within a few minutes</span></div>' +
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
          document.title = on ? baseTitle : "New message — " + P.brand;
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
          '<div style="font-size:14px;color:#444;line-height:1.5;">' + P.welcome.replace(/</g, "&lt;") + '</div>' +
          '<input id="hc-nm" placeholder="Your name" maxlength="40"/>' +
          '<input id="hc-em" placeholder="Email (to continue previous chats)" maxlength="80"/>' +
          '<button id="hc-go">Start chat</button></div>';
        body.querySelector("#hc-go").onclick = function () {
          var n = body.querySelector("#hc-nm").value.trim();
          if (!n) return;
          vname = n;
          localStorage.setItem(lsKey + "name", n);
          var em = body.querySelector("#hc-em").value.trim();
          if (em) {
            localStorage.setItem(lsKey + "email", em);
            convId = PROJECT_ID + "__e_" + emailId(em);
          }
          startChat(em);
        };
      }

      var msgsEl, inEl, fileInput;
      function chatUI() {
        body.innerHTML =
          '<div id="hc-msgs"></div>' +
          '<div id="hc-form">' +
          '<button id="hc-attach" title="Attach a file">' + ICON.clip + '</button>' +
          '<input id="hc-in" placeholder="Type a message…" maxlength="1000"/>' +
          '<button id="hc-send" title="Send">' + ICON.send + '</button>' +
          '<input type="file" id="hc-file" style="display:none"/></div>';
        msgsEl = body.querySelector("#hc-msgs");
        inEl = body.querySelector("#hc-in");
        fileInput = body.querySelector("#hc-file");
        body.querySelector("#hc-send").onclick = sendText;
        body.querySelector("#hc-attach").onclick = function () { fileInput.click(); };
        fileInput.addEventListener("change", sendFile);
        inEl.addEventListener("keydown", function (e) { if (e.key === "Enter") sendText(); });
      }

      function scrollDown() { if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight; }

      function render(msgs) {
        if (!msgsEl) return;
        msgsEl.innerHTML = "";
        var w = document.createElement("div");
        w.className = "hc-m hc-them";
        w.textContent = P.welcome;
        msgsEl.appendChild(w);
        msgs.forEach(function (m) {
          var d = document.createElement("div");
          d.className = "hc-m " + (m.from === "visitor" ? "hc-me" : "hc-them");
          if (m.file) {
            if ((m.file.type || "").indexOf("image/") === 0) {
              var img = document.createElement("img");
              img.src = m.file.data; img.alt = m.file.name;
              d.appendChild(img);
            } else {
              var a = document.createElement("a");
              a.className = "hc-filelink";
              a.href = m.file.data; a.download = m.file.name;
              a.innerHTML = ICON.file + " " + m.file.name.replace(/</g, "&lt;");
              d.appendChild(a);
            }
          }
          if (m.text) {
            var t = document.createElement("div");
            t.textContent = m.text;
            d.appendChild(t);
          }
          msgsEl.appendChild(d);
        });
        scrollDown();
      }

      var convRef, lastCount = -1;
      function heartbeat() {
        if (!convRef) return;
        convRef.set({ lastSeenVisitor: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      }
      function touchConv(preview) {
        convRef.set({
          lastMsg: preview.slice(0, 120),
          visitorName: vname,
          projectId: PROJECT_ID,
          ownerUid: P.ownerUid,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastSeenVisitor: firebase.firestore.FieldValue.serverTimestamp(),
          unreadForAgent: firebase.firestore.FieldValue.increment(1),
          msgCount: firebase.firestore.FieldValue.increment(1),
          status: "open"
        }, { merge: true });
      }

      function startChat(email) {
        convRef = db.collection("conversations").doc(convId);
        convRef.set({
          visitorName: vname,
          visitorEmail: email || localStorage.getItem(lsKey + "email") || "",
          page: location.href,
          projectId: PROJECT_ID,
          ownerUid: P.ownerUid,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastSeenVisitor: firebase.firestore.FieldValue.serverTimestamp(),
          status: "open"
        }, { merge: true });
        chatUI();
        setInterval(heartbeat, 30000);
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
      }

      function sendText() {
        var t = inEl.value.trim();
        if (!t || !convRef) return;
        inEl.value = "";
        convRef.collection("messages").add({
          from: "visitor", text: t,
          ts: firebase.firestore.FieldValue.serverTimestamp()
        });
        touchConv(t);
      }
      function sendFile() {
        var f = fileInput.files[0];
        fileInput.value = "";
        if (!f || !convRef) return;
        if (f.size > MAX_KB * 1024) {
          alert("File too large. Maximum size is " + MAX_KB + " KB.");
          return;
        }
        var r = new FileReader();
        r.onload = function () {
          convRef.collection("messages").add({
            from: "visitor", text: "",
            file: { name: f.name.slice(0, 120), type: f.type || "application/octet-stream", data: r.result },
            ts: firebase.firestore.FieldValue.serverTimestamp()
          });
          touchConv("Attachment: " + f.name);
        };
        r.readAsDataURL(f);
      }

      if (vname) startChat("");
      else askName();
    }
  }
})();
