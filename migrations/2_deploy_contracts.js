
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const GhostmarketERC721 = artifacts.require('GhostmarketERC721');

module.exports = async function (deployer, network, accounts) {
  const instance = await deployProxy(
    GhostmarketERC721,
    ["Ghostmarket NFT", "GMNFT", "https://my-json-server.typicode.com/abcoathup/samplenft/tokens/"],
    { deployer, initializer: "initialize", unsafeAllowCustomTypes: true });
  //unsafeAllowCustomTypes Ignores struct mapping in AccessControl, which is fine because it's used in a mapping
  //See: https://solidity.readthedocs.io/en/v0.8.3/
  console.log('Deployed', instance.address);
};