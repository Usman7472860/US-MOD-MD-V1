const goodNightReplies = [
    "Shab Bakhair! 🌙 Allah ki hifazat mein so jao — meethi neend aaye aur achhe khwab bhi 😊🤲",
    "Good Night! ⭐ Phone rakh do ab — neend teri bhi zaroorat hai aur phone ki bhi 😂🌙",
    "Shab Bakhair bestie! 🌸 Aaj ka din achha tha ya bura — Allah ne hifazat ki, yahi kafi hai 🤲",
    "Good Night! 🌙 So jao ab — kal subah nai umeed ke saath aankhein khulegi InshaAllah ✨",
    "Shab Bakhair yaar! 😴 Raat ko scrolling se zyada meethi neend hoti hai — trust me 😄🌙",
    "Good Night! ⭐ Allah ne aaj ek din aur diya — iska shukar kar ke so jao 🤲😊",
    "Shab Bakhair! 🌙 Tere khwab itne achhe hon ke uth ke muskura jao kal subah 😄💫",
    "Good Night sunshine! 🌟 Din bhar thake — ab aram ka haq hai, so jao yaar 😊",
    "Shab Bakhair! 😂🌙 Neend aa rahi hai na? Nahi? Phone rakh do, khud aa jayegi 😄",
    "Good Night! 🌙 Kal ki fikar kal — aaj ki raat sukoon se guzro, Allah hafiz ❤️🤲",
    "Shab Bakhair bestie! ⭐ Tu itna achha insaan hai ke chand bhi tujhe dekh ke muskurata hai 😊🌙",
    "Good Night! 🌸 So jaana jaldi — subah jaldi uthna wala jo hai woh alag baat hai 😂",
    "Shab Bakhair! 🌙 Dua karo, shukar karo, phir so jao — yahi raat ka sahi khatma hai 🤲",
    "Good Night yaar! 😄⭐ Khwab mein bhi productive raho — ya bas aram karo, dono theek hain!",
    "Shab Bakhair! 🌙 Kal subah uthna mushkil hoga — par Allah ki meherbani se zaroor uthoge 😊",
    "Good Night! 😴🌸 Aaj jo bhi hua — chod do. Kal nai subah hai, nai shuruat hai 💫",
    "Shab Bakhair champ! 🌙 Aaj ka din jeeta — kal ka bhi jeetoge InshaAllah 💪⭐",
    "Good Night! 🤲🌙 Allah tujhe aur tere ghar walon ko apni hifazat mein rakhe — Ameen",
    "Shab Bakhair! 😂🌙 Raat ko chai mat peena warna subah tak aankhein khulti rahegi 😄",
    "Good Night bestie! ⭐ Tujhe dekhna to ho nahi sakta raat ko — par dil mein yaad hai 💕😊",
    "Shab Bakhair! 🌙 Neend aaye jaise buri yadein gayab hoti hain — seedha aur fast 😄💫",
    "Good Night! 🌸⭐ Kal phir milenge — tab tak Allah hafiz, meethi neend aaye yaar 🤲😊"
];

async function goodnightCommand(sock, chatId, message) {
    try {
        const reply = goodNightReplies[Math.floor(Math.random() * goodNightReplies.length)];
        await sock.sendMessage(chatId, { text: reply }, { quoted: message });
    } catch (error) {
        console.error('Error in goodnight command:', error);
        await sock.sendMessage(chatId, { text: '❌ Good night message bhejne mein masla hua, dobara try karo!' }, { quoted: message });
    }
}

module.exports = { goodnightCommand };
