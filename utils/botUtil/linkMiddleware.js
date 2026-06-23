export default async (context, next) => {
const { m, isBotAdmin } = context;

    if (!m.isGroup) {
        return m.reply(`╭───(    US MOD MD V1    )───\n├───≫ Gʀᴏᴜᴘ Oɴʟʏ ≪───\n├ \n├ This command only works in groups!\n├ Private chat? For this? Pathetic.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐔𝐬𝐦𝐚𝐧 𝐊𝐡𝐚𝐧 𝐂𝐡𝐚𝐜𝐡𝐚𝐫`);
    }

    if (!isBotAdmin) {
        return m.reply(`╭───(    US MOD MD V1    )───\n├───≫ Aᴅᴍɪɴ Rᴇϙᴜɪʀᴇᴅ ≪───\n├ \n├ I need admin rights to get the group link!\n├ Make me admin or watch me do nothing.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐔𝐬𝐦𝐚𝐧 𝐊𝐡𝐚𝐧 𝐂𝐡𝐚𝐜𝐡𝐚𝐫`);
    }

    await next();
};