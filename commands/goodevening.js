const goodEveningReplies = [
    "Good Evening! 🌆 Din bhar kaam ke baad ab aram ka waqt — well done yaar! 😊",
    "Shaam Bakhair! 🌇 Shaam aayi — matlab chai ka dobara waqt aa gaya ☕😄",
    "Good Evening bestie! 🌸 Din guzar gaya — aaj kitna seekha? Kuch bhi? Chalo woh bhi sahi hai 😂",
    "Shaam Bakhair! 😊 Allah ka shukar — subah se shaam tak ki mehnat rang laati hai 🤲💪",
    "Good Evening! 🌆 Shaam ki hawa jaise tu thanda aur sukoon dene wala hai yaar 😄❤️",
    "Shaam Bakhair! ☕ Office se ghar aa gaye? Ya ghar pe hi office tha? 😂 Dono mein welcome!",
    "Good Evening sunshine! 🌇 Din bhar ki thakan ke baad bhi muskura raha hai — ye talent hai! 😊",
    "Shaam Bakhair yaar! 🌸 Shaam ko dekho — sooraj bhi thak ke gharne laga 😄 tune toh aaj kya kiya?",
    "Good Evening! 🌆 Shaam ka waqt — sab kuch slow ho jaata hai aur zindagi thodi pyari lagti hai 💫",
    "Shaam Bakhair! 😎 Aaj ka din kaisa raha? Achha? Toh shukar karo. Bura? Shukar karo phir bhi 😄🤲",
    "Good Evening! ☕🌇 Shaam ki chai peena na bhoolo — ye wajib hai yaar 😂",
    "Shaam Bakhair bestie! 😊 Tujhe good evening kehna mujhe bhi achha lagta hai — tu acha banda hai ❤️",
    "Good Evening! 🌆 Shaam ho gayi matlab neend se kuch ghante door hain — phir bhi phone band karo 😂",
    "Shaam Bakhair! 🌸 Subah ki dua aaj rang laayi? InshaAllah zaroor laayi hogi 🤲😊",
    "Good Evening champ! 💪 Aaj ka din fatah kar ke wapas aye — shaam teri muntazir thi! 🌇",
    "Shaam Bakhair! ☕ Shaam = chai + sukoon + dosto ke messages — ye combination unbeatable hai 😄",
    "Good Evening! 😂🌆 Shaam ho gayi aur abhi tak kuch productive nahi kiya? Chalo kal se sahi 😄",
    "Shaam Bakhair yaar! 🌸 Tujhe dekh ke shaam bhi sharmata hai — tu isse bhi pyara hai 😊💕",
    "Good Evening! 🌇 Thaka hua insaan bhi khubsurat lagta hai — aaj ka din tera tha! 💫",
    "Shaam Bakhair! 😊 Allah ne aaj bhi teri hifazat ki — ye Alhamdulillah kehne ka waqt hai 🤲",
    "Good Evening! ☕🌆 Shaam ki hawa mein kuch baat hai — bahar nikal aur thodi fresh air le! 😄",
    "Shaam Bakhair bestie! 🌸 Din bhar sab ko sambhala — ab khud ko thoda pyar de yaar ❤️😊"
];

async function goodeveningCommand(sock, chatId, message) {
    try {
        const reply = goodEveningReplies[Math.floor(Math.random() * goodEveningReplies.length)];
        await sock.sendMessage(chatId, { text: reply }, { quoted: message });
    } catch (error) {
        console.error('Error in goodevening command:', error);
        await sock.sendMessage(chatId, { text: '❌ Good evening message bhejne mein masla hua, dobara try karo!' }, { quoted: message });
    }
}

module.exports = { goodeveningCommand };
