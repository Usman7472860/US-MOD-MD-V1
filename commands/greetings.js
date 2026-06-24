// ─── GREETINGS & CASUAL PHRASES HANDLER ────────────────────────────────────
// Roman Urdu / Urdu casual WhatsApp phrases auto-reply system
// Author: M Usman Chachar

// ── Greeting phrases list (jo log bolte hain) ──
const greetingPhrases = [
    // Hal Puchna
    "jan koi kiya hal hi",
    "kese ho",
    "kya haal hai",
    "kya chal raha hai",
    "sab theek hai",
    "kaisa ja raha hai",
    "kya hal hai bhai",
    "bhai kya scene hai",
    "kya maamla hai",
    "kese ja rhi zindagi",
    "bhai kaisa hai",
    "yaar kya haal hai",
    "kese chalra hai",
    "jan kaisi ho",
    "kese hain ap",
    "sab theek thaak",
    "kya ho raha hai",
    "bhai kya kar rhe ho",
    "kuch naya",
    "suno yaar",
    "free ho abhi",
    "baat karni thi",
    "yaad kiya kya",
    "bhai bahut dino baad",
    "kahan ho aaj kal",
];

// ── Bot ki replies (randomly se ek milegi) ──
const greetingReplies = [
    "Theek alhamdulillah 😊 ap sunaao kya haal hai?",
    "Alhamdulillah mast hu yaar, ap btao 🙂",
    "Bilkul theek hu bhai, ap kese hain? 😄",
    "Bas theek thak hu alhamdulillah, ap bolo 👍",
    "Alhamdulillah sab theek, ap sunaao 😊",
    "Mast chal raha hai sab alhamdulillah, ap kya hal hai? 🤙",
    "Theek hu yaar, ap ki yaad aayi 😄 kya haal hai?",
    "Alhamdulillah khairiyat hai, ap bhi theek ho? 🙂",
];

// ── Helper: normalize text (lowercase + trim) ──
function normalizeText(text) {
    return text.toLowerCase().trim().replace(/[?!.,]/g, '');
}

// ── Helper: get random reply ──
function getRandomReply() {
    return greetingReplies[Math.floor(Math.random() * greetingReplies.length)];
}

// ── Main handler ──
async function handleGreetings(sock, chatId, message, userMessage) {
    try {
        const normalized = normalizeText(userMessage);

        // Check if message matches any greeting phrase
        const isGreeting = greetingPhrases.some(phrase =>
            normalized.includes(normalizeText(phrase)) ||
            normalizeText(phrase).includes(normalized)
        );

        if (!isGreeting) return false; // Not a greeting, skip

        const reply = getRandomReply();

        await sock.sendMessage(
            chatId,
            { text: reply },
            { quoted: message }
        );

        return true; // Greeting handled

    } catch (error) {
        console.error('❌ Error in handleGreetings:', error.message);
        return false;
    }
}

module.exports = {
    handleGreetings,
    greetingPhrases,
    greetingReplies,
};
