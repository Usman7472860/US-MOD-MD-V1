const goodMorningReplies = [
    "Good Morning! ☀️ Uth jao, neend baad mein poori hogi — pehle chai pi lo! 😄",
    "Subah Bakhair! 🌅 Allah ne aaj ka din diya, isko waste mat karna Netflix pe! 😂",
    "Good Morning bestie! 😊 Aaj ka din itna acha hoga ke tu khud hairan ho jayega 🌸",
    "Subah Bakhair! ☕ Chai pi, bismillah bol, aur duniya fatah karne nikal! 💪",
    "Good Morning! 🌞 Uthne ka shukriya — kuch log toh alarm sun ke wapas so jaate hain 😂",
    "Subah Bakhair! 🌺 Allah ka shukar hai ke aankh khuli — aaj kuch achha karna hai! 😇",
    "Good Morning sunshine! ☀️ Tu itna pyara hai ke subah bhi tujhe dekh ke muskura deti hai 🥰",
    "Subah Bakhair! 🌄 Aaj ka agenda: chai ✅ smile ✅ kuch productive ✅ aur bas 😄",
    "Good Morning! 🌻 Neend poori hui? Nahi? Koi baat nahi, chai poori kar degi! ☕😂",
    "Subah Bakhair yaar! 😄 Duniya roz nai subah deti hai — iska matlab teri story abhi khatam nahi 💫",
    "Good Morning! ☀️ Aaj bhi zinda ho — Alhamdulillah! Baaki sab manage ho jayega 😊",
    "Subah Bakhair! 🌸 Tu uthа toh main bhi khush ho gayi — tu mushkil se uthta hai na 😂😂",
    "Good Morning champ! 💪 Aaj ka din tera wait kar raha tha — ab nikal! 🌞",
    "Subah Bakhair! ☕🌅 Jaldi uth, din chhota hai aur kaam zyada — priority: pehle chai! 😄",
    "Good Morning! 🌺 Allah ne aaj ka din gift diya — isko return mat karna 😂❤️",
    "Subah Bakhair bestie! 😊 Smile karo, tum dekh ke subah bhi sharmа jaati hai 🌸✨",
    "Good Morning! ☀️ Raat guzri, subah aayi — matlab Allah ne suna aur mauka diya 🤲",
    "Subah Bakhair! 🌻 Aaj kuch aisa karo ke raat ko so jao aur subah muskura ke utho 😄",
    "Good Morning jaan! ☕ Teri subah meri subah se bhi pyari hai — seedha baat 💕😄",
    "Subah Bakhair! 🌅 Kuch log subah uthte hain aur kuch log subah banate hain — tu dono kar! 💫",
    "Good Morning! 😂☀️ Allah ne itni khoobsurat subah di aur tu phone pe scroll kar raha hai — bahar to dekh!",
    "Subah Bakhair! 🌸 Duniya ka sabse acha banda subah uthа — woh tu hai yaar 😊💪"
];

async function goodmorningCommand(sock, chatId, message) {
    try {
        const reply = goodMorningReplies[Math.floor(Math.random() * goodMorningReplies.length)];
        await sock.sendMessage(chatId, { text: reply }, { quoted: message });
    } catch (error) {
        console.error('Error in goodmorning command:', error);
        await sock.sendMessage(chatId, { text: '❌ Good morning message bhejne mein masla hua, dobara try karo!' }, { quoted: message });
    }
}

module.exports = { goodmorningCommand };
