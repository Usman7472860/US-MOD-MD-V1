const Ownermiddleware = async (context, next) => {
const { m, Owner } = context;

    if (!Owner) {
        return m.reply(`╭───(    US MOD MD V1    )───\n├───≫ Aᴄᴄᴇss Dᴇɴɪᴇᴅ ≪───\n├ \n├ You dare use an Owner command?\n├ Your mere existence insults\n├ my code. Crawl back to the\n├ abyss where mediocrity thrives.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐔𝐬𝐦𝐚𝐧 𝐊𝐡𝐚𝐧 𝐂𝐡𝐚𝐜𝐡𝐚𝐫`);
    }

    await next();
};

export default Ownermiddleware;
