
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const GhostMarketERC721 = artifacts.require('GhostMarketERC721');

module.exports = async function (deployer, network, accounts) {
  const instance = await deployProxy(
    GhostMarketERC721,
    ["GhostMarket ERC721", "GHOST", "https://api.ghostmarket.io/metadata/bsc/"],
    { deployer, initializer: "initialize", unsafeAllowCustomTypes: true });
  //unsafeAllowCustomTypes Ignores struct mapping in AccessControl, which is fine because it's used in a mapping
  //See: https://solidity.readthedocs.io/en/v0.8.4/
  console.log('Deployed', instance.address);
};