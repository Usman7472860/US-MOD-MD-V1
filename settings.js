const settings = {
  packname: 'US MOD MD V1',
  author: 'M Usman Chachar',
  botName: "US MOD MD V1",
  botOwner: 'M Usman Chachar',
  owner: "923204822390",
  ownerNumber: '923204822390',
  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: "public",
  maxStoreMessages: 20,
  storeWriteInterval: 10000,
  description: "US MOD MD V1 - WhatsApp Bot",
  version: "3.0.7",
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
global.ytch = "M Usman Chachar";

module.exports = settings;
