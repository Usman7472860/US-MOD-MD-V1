const goodAfternoonReplies = [
    "Good Afternoon! ☀️ Dopahar ka khaana kha liya? Nahi toh sab kuch baad mein — pehle roti khao! 😄",
    "Good Afternoon yaar! 😎 Din ka sabse mushkil waqt — neend aa rahi hai par kaam bhi hai 😂",
    "Dopahar Bakhair! 🌤️ Aaj ki dopahar tere jaisi pyari hai — seedhi baat 💕",
    "Good Afternoon! ☕ Chai ya coffee? Dopahar mein dono chalti hain — judge nahi karenge 😄",
    "Dopahar Bakhair! 😊 Allah ka shukar hai — subah bhi guzri aur dopahar bhi aayi 🤲",
    "Good Afternoon bestie! 🌻 Aadha din gaya — aadha baki hai, abhi bhi kuch ho sakta hai 💪",
    "Good Afternoon! 😂 Dopahar ki neend ke baad feel kaise hai — refreshed ya aur thak gaye? 😄",
    "Dopahar Bakhair! ☀️ Garmi mein bhi tu itna cool hai — respect hai yaar 😎",
    "Good Afternoon! 🌤️ Lunch karo, thoda aram karo, phir wapis lag jao — ye hi formula hai 😄",
    "Dopahar Bakhair! 💫 Din ka best time hai — sab kuch possible lag raha hota hai is waqt 😊",
    "Good Afternoon sunshine! ☀️ Tu toh khud ek subah hai — dopahar mein bhi 🥰",
    "Dopahar Bakhair yaar! 😄 Subah ki mehnat aaj result degi — bas thoda aur karo!",
    "Good Afternoon! 🌻 Dopahar ki garmi se zyada teri friendship garam rakhti hai dil ko ❤️😊",
    "Dopahar Bakhair! 😎 Office mein ho? Ya ghar pe aram? Dono mein khush raho! 😄",
    "Good Afternoon! ☀️ Allah ne aadha din diya — baaki aadha bhi achha jayega InshaAllah 🤲",
    "Dopahar Bakhair! 😂 Dopahar ki neend haram hai — par itni meethi bhi hoti hai na? 😄",
    "Good Afternoon champ! 💪 Dopahar tak pahunch gaye — ye bhi koi kam nahi! Subah uthna mushkil tha 😂",
    "Dopahar Bakhair! 🌤️ Paani piyo, thanda raho, khush raho — yahi din guzarne ka formula hai 😊",
    "Good Afternoon! ☕ Dopahar ki chai — yaar ye concept inventors ne banda ki zindagi bana di 😄",
    "Dopahar Bakhair bestie! 😊 Aaj bhi tujhe yaad kiya — tu dil mein rehta hai yaar 💕",
    "Good Afternoon! 🌻 Dopahar ho gayi aur tu abhi tak smile nahi kiya? Teri taraf se aaj ka kaam nahi hua 😄",
    "Dopahar Bakhair! 😎 Din mein aik baar khud se poochho — kya main khush hun? Nahi? To fix karo! 💪"
];

async function goodafternoonCommand(sock, chatId, message) {
    try {
        const reply = goodAfternoonReplies[Math.floor(Math.random() * goodAfternoonReplies.length)];
        await sock.sendMessage(chatId, { text: reply }, { quoted: message });
    } catch (error) {
        console.error('Error in goodafternoon command:', error);
        await sock.sendMessage(chatId, { text: '❌ Good afternoon message bhejne mein masla hua, dobara try karo!' }, { quoted: message });
    }
}

module.exports = { goodafternoonCommand };
