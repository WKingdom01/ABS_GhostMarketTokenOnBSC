
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const GhostMarketERC1155 = artifacts.require('GhostMarketERC1155');

module.exports = async function (deployer, network, accounts) {
  const instance = await deployProxy(
    GhostMarketERC1155,
    ["GhostMarket ERC1155", "GHOST", "https://api.ghostmarket.io/metadata/bsc/"],
    { deployer, initializer: "initialize", unsafeAllowCustomTypes: true });
  //unsafeAllowCustomTypes Ignores struct mapping in AccessControl, which is fine because it's used in a mapping
  //See: https://solidity.readthedocs.io/en/v0.8.4/
  console.log('Deployed', instance.address);
};