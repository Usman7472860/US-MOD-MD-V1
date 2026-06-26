const settings = {
  packname: 'US MOD MD',
  author: 'USMAN',
  botName: "US MOD MD",
  botOwner: 'USMAN KHAN CHACHAR',
  owner: "923204822390",
  ownerNumber: '923204822390',
  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: "public",
  maxStoreMessages: 20,
  storeWriteInterval: 10000,
  description: "US MOD MD - WhatsApp Bot",
  version: "V1.0",
  updateZipUrl: "null",
  prefix: ".",

  // Features
  antiDelete: false,
  viewOnce: true,
  autoStatusView: false,
  autoStatusReact: false,

  // Vercel pairing website secret
  apiSecret: 'usman-md-secret',

  // Truecaller — apna installation ID yahan daalo
  // Server pe: truecallerjs login → truecallerjs -i
  truecallerInstallId: '',
};

// Global vars needed by old commands
global.botname = settings.botName;
global.themeemoji = "•";
global.ytch = "M USMAN CHACHAR";

module.exports = settings;
