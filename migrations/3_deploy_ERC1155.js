
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const GhostmarketERC1155 = artifacts.require('GhostmarketERC1155');

module.exports = async function (deployer, network, accounts) {
  const instance = await deployProxy(
    GhostmarketERC1155,
    ["Ghostmarket ERC1155", "GMERC1155", "https://app/"],
    { deployer, initializer: "initialize", unsafeAllowCustomTypes: true });
  //unsafeAllowCustomTypes Ignores struct mapping in AccessControl, which is fine because it's used in a mapping
  //See: https://solidity.readthedocs.io/en/v0.8.3/
  console.log('Deployed', instance.address);
};