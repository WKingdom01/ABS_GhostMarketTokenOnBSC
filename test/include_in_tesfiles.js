const GhostMarketERC721 = artifacts.require("GhostmarketERC721");
const GhostMarketERC1155 = artifacts.require("GhostmarketERC1155");
const TOKEN_NAME = "GhostMarket"
const TOKEN_SYMBOL = "GHOST"
const BASE_URI = "https://ghostmarket.io/"
const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"
const PAUSER_ROLE = "0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a"
const METADATA_JSON = '{"name":"My NFT Name","description":"My NFT Name","image":"ipfs://QmWpUHUKjcYbhqGtxHnH39F5tLepfztGQAcYtsnHtWfgjD","external_url":"","attributes":[{"type":"AttrT1","value":"AttrV1","display":""},{"type":"AttrT2","value":"AttrV2","display":""}],"properties":{"has_locked":true,"creator":"0x9e1bd73820a607b06086b5b5173765a61ceee7dc","royalties":0,"type":2}}'

exports._t_c = {
  GhostmarketERC721: GhostMarketERC721,
  GhostmarketERC1155: GhostMarketERC1155,
  TOKEN_NAME: TOKEN_NAME,
  TOKEN_SYMBOL: TOKEN_SYMBOL,
  BASE_URI: BASE_URI,
  METADATA_JSON: METADATA_JSON
}
