
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const GhostmarketNFT = artifacts.require('GhostmarketNFT');

module.exports = async function (deployer, network, accounts) {
  const instance = await deployProxy(
    GhostmarketNFT,
    ["Ghostmarket NFT", "GMNFT", "https://my-json-server.typicode.com/abcoathup/samplenft/tokens/"],
    { deployer, initializer: "initialize", unsafeAllowCustomTypes: true });
  //unsafeAllowCustomTypes Ignores struct mapping in AccessControl, which is fine because it's used in a mapping
  //See: https://solidity.readthedocs.io/en/v0.8.3/
  console.log('Deployed', instance.address);
};