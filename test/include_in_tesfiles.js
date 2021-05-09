const GhostmarketERC721 = artifacts.require("GhostmarketERC721");
const GhostmarketERC1155 = artifacts.require("GhostmarketERC1155");
const TOKEN_NAME = "Ghostmarket NFT"
const TOKEN_SYMBOL = "GMNFT"
const TOKEN_URI = "my.app/"
const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"
const PAUSER_ROLE = "0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a"

exports._t_c = {
  GhostmarketERC721: GhostmarketERC721,
  GhostmarketERC1155: GhostmarketERC1155,
  TOKEN_NAME: TOKEN_NAME,
  TOKEN_SYMBOL: TOKEN_SYMBOL,
  TOKEN_URI: TOKEN_URI
}