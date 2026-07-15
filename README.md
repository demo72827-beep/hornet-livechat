# HornetChat 💬

Apna khud ka live chat software — Tawk.to / Zoho SalesIQ jaisa. **Zero hosting cost:**
GitHub Pages par frontend, Firebase Firestore (free Spark plan) par realtime backend.

- `docs/widget.js` — visitor chat bubble, kisi bhi website par 2 lines se embed
- `docs/agent.html` — team ka inbox dashboard (login ke saath), realtime replies
- `docs/index.html` — demo page
- `firestore.rules` — security rules (zaroor lagana!)

---

## Setup — 15 minute, step by step

### Step 1 — Firebase project banao (free)
1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → naam do (e.g. `hornet-livechat`) → Analytics off kar sakte ho → Create
2. Project khulne par **</> (Web)** icon → app register karo → jo `firebaseConfig` object mile, use copy karo
3. `docs/firebase-config.js` kholo aur apna config paste karo

### Step 2 — Firestore + Auth enable karo
1. Left menu → **Build → Firestore Database** → Create database → **Production mode** → region `asia-south1` (Mumbai)
2. **Build → Authentication → Get started** → Sign-in methods mein do cheezein enable karo:
   - **Anonymous** (visitors ke liye)
   - **Email/Password** (agents ke liye)
3. Authentication → Users → **Add user** → apna email + strong password (yeh agent login hai)

### Step 3 — Security rules lagao (skip mat karna!)
Firestore Database → **Rules** tab → is repo ke `firestore.rules` ka content paste karo → Publish.
Bina iske koi bhi aapka data padh sakta hai.

### Step 4 — GitHub par push + Pages on karo
```bash
git init
git add .
git commit -m "HornetChat live chat"
git branch -M main
git remote add origin https://github.com/YOURUSER/hornet-livechat.git
git push -u origin main
```
Phir GitHub repo → **Settings → Pages** → Source: `Deploy from a branch` → Branch: `main`, folder: `/docs` → Save.
2-3 minute mein live: `https://YOURUSER.github.io/hornet-livechat/`

### Step 5 — Firebase ko apna domain batao
Firebase console → Authentication → Settings → **Authorized domains** → Add:
- `YOURUSER.github.io`
- `visament.com`, `savetaxs.com` (jahan bhi widget lagana hai)

### Step 6 — Test karo
1. `https://YOURUSER.github.io/hornet-livechat/` kholo → chat bubble → visitor message bhejo
2. Dusre tab mein `/agent.html` → login → reply karo → dono taraf realtime dikhega ✅

---

## Apni sites par lagana

Closing `</body>` se pehle:
```html
<script src="https://YOURUSER.github.io/hornet-livechat/firebase-config.js"></script>
<script src="https://YOURUSER.github.io/hornet-livechat/widget.js"></script>
```

**Visament (Laravel):** `resources/views/layouts/app.blade.php` ke footer mein.
**SaveTaxs (Next.js):**
```jsx
import Script from "next/script";
// layout ke andar:
<Script src="https://YOURUSER.github.io/hornet-livechat/firebase-config.js" strategy="afterInteractive" />
<Script src="https://YOURUSER.github.io/hornet-livechat/widget.js" strategy="afterInteractive" />
```

Branding `firebase-config.js` ke `HORNET_CHAT_SETTINGS` mein: brand name, color
(Visament `#057DE2`, SaveTaxs `#6A0DAD`), welcome message, left/right position.

---

## Free tier limits (Firebase Spark)
- 50,000 reads + 20,000 writes **per day** — chhote/medium traffic ke liye kaafi hai
- 1 GB storage, 10 GB/month bandwidth
- Limit cross hui toh chat us din band, koi charge nahi (Spark par card hi nahi lagta)

## Kya nahi hai (abhi)
- Email notifications on new message (Firebase Cloud Functions se add ho sakta hai — Blaze plan)
- File/image sharing, typing indicators, canned replies, multi-agent assignment
- Yeh sab add karna ho toh next iteration mein banate hain

Built for Hornet Dynamics 🐝
