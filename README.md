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

## ⚠️ Disclaimer / Terms of Use

- Yeh bot sirf **educational aur personal use** ke liye banaya gaya hai.
- **Developer/Owner (USMAN KHAN CHACHAR)** is bot ke kisi bhi **galat istemal (misuse)** ka zimmedar nahi hai — jaise spam, harassment, scam, fraud, ya kisi bhi illegal activity ke liye is bot ka use karna.
- Yeh bot WhatsApp ki official **Terms of Service** ke khilaf ja sakta hai (unofficial API/library use karne ki wajah se). Apna number **ban/restrict** hone ka risk **khud user** ki zimmedari hai.
- Jo bhi shakhs is bot ko **deploy, host, ya use** karta hai, woh khud apne actions ka, apne use ka, aur apne hosted instance se hone wali kisi bhi activity ka **mukammal taur par zimmedar (fully responsible)** hoga.
- Is code ko modify, redistribute, ya kisi aur project mein use karte waqt bhi yeh disclaimer aur credit (dekhiye [LICENSE](./LICENSE)) intact rehna chahiye.
- Developer kisi bhi direct, indirect, ya consequential damage/loss ke liye liable nahi hoga jo is software ke use se ho.

**Use at your own risk.**
