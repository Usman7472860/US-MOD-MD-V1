# US MOD MD - Fresh Bot

**Developed & Owned by: USMAN KHAN CHACHAR**
*Credit must remain intact in all copies/forks. See [LICENSE](./LICENSE).*

Clean fresh bot with only 2 commands.

## Setup

```bash
npm install
npm start
```

## Commands

| Command | Description |
|---------|-------------|
| `.ping` | Bot speed & uptime check |
| `.menu` or `.help` | Show command list |

## Config

Edit `settings.js`:
- `botName` — Bot ka naam
- `ownerNumber` — Aapka number (country code ke sath, e.g. `923001234567`)
- `version` — Bot version
- `prefix` — Command prefix (default `.`)

## Deployment

- **Pairing:** `ownerNumber` set karo `settings.js` mein, bot automatically pairing code generate karega
- **Panel:** `npm run start:panel` use karo

## Adding Commands Later

1. `commands/` mein naya `.js` file banao
2. `main.js` mein import karo aur switch-case mein add karo

3. US MOD MD - Custom License
 
## Copyright ©️ 
Copyright (c) 2026 USMAN KHAN CHACHAR

This software ("US MOD MD") and its source code are the original work of
USMAN KHAN CHACHAR.

Permission is granted to use, modify, and run this software for personal
or non-commercial purposes, subject to the following conditions:

1. CREDIT MUST BE RETAINED
The developer credit ("Developed & Owned by: USMAN KHAN CHACHAR") in
the source code headers, console startup banner, README, and bot
menu/help output must NOT be removed, altered, or replaced.

2. NO MISREPRESENTATION OF AUTHORSHIP
You may not claim this software, in whole or in part, as your own
original work. Redistribution under a different author's name is a
violation of this license.

3. REDISTRIBUTION
You may share or fork this project, including on GitHub or other
platforms, only if this LICENSE file and all credit headers remain
intact and unmodified.

4. NO WARRANTY
This software is provided "as is", without warranty of any kind,
express or implied. The author is not liable for any damages or
issues arising from its use.

Violation of these terms (e.g. removing credit and republishing as your
own work) may be reported to the platform hosting the violating content
(e.g. GitHub DMCA takedown, app store reporting) as a copyright/credit
violation.

## ⚠️ Disclaimer / Terms of Use

- Yeh bot sirf **educational aur personal use** ke liye banaya gaya hai.
- **Developer/Owner (USMAN KHAN CHACHAR)** is bot ke kisi bhi **galat istemal (misuse)** ka zimmedar nahi hai — jaise spam, harassment, scam, fraud, ya kisi bhi illegal activity ke liye is bot ka use karna.
- Yeh bot WhatsApp ki official **Terms of Service** ke khilaf ja sakta hai (unofficial API/library use karne ki wajah se). Apna number **ban/restrict** hone ka risk **khud user** ki zimmedari hai.
- Jo bhi shakhs is bot ko **deploy, host, ya use** karta hai, woh khud apne actions ka, apne use ka, aur apne hosted instance se hone wali kisi bhi activity ka **mukammal taur par zimmedar (fully responsible)** hoga.
- Is code ko modify, redistribute, ya kisi aur project mein use karte waqt bhi yeh disclaimer aur credit (dekhiye [LICENSE](./LICENSE)) intact rehna chahiye.
- Developer kisi bhi direct, indirect, ya consequential damage/loss ke liye liable nahi hoga jo is software ke use se ho.

**Use at your own risk.**

