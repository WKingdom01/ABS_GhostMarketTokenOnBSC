// Load dependencies
const { expect } = require('chai');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const { ZERO_ADDRESS } = constants;

var my_constants = require('./include_in_tesfiles.js')

// Start test block
contract('GhostmarketNFT', async accounts => {
  before(async function () {
    // Deploy a new contract before the tests
    this.GhostmarketNFT = await deployProxy(
      my_constants._t_c.GhostmarketNFT,
      [my_constants._t_c.TOKEN_NAME, my_constants._t_c.TOKEN_SYMBOL, my_constants._t_c.TOKEN_URI],
      { initializer: "initialize", unsafeAllowCustomTypes: true });
    console.log('Deployed', this.GhostmarketNFT.address);
  });

  it("name should be " + my_constants._t_c.TOKEN_NAME, async function () {
    expect((await this.GhostmarketNFT.name()).toString()).to.equal(my_constants._t_c.TOKEN_NAME);
  });

  it("symbol should be " + my_constants._t_c.TOKEN_SYMBOL, async function () {
    expect((await this.GhostmarketNFT.symbol()).toString()).to.equal(my_constants._t_c.TOKEN_SYMBOL);
  });

  it('deployer can mint tokens', async function () {
    const tokenId = new BN('0');

    const receipt = await this.GhostmarketNFT.mint(accounts[1], { from: accounts[0] });
    expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: accounts[1], tokenId });

    expect(await this.GhostmarketNFT.balanceOf(accounts[1])).to.be.bignumber.equal('1');
    expect(await this.GhostmarketNFT.ownerOf(tokenId)).to.equal(accounts[1]);

    expect(await this.GhostmarketNFT.tokenURI(tokenId)).to.equal(my_constants._t_c.TOKEN_URI + tokenId);
  });

  it("secondary sales", async function () {
    await this.GhostmarketNFT.saveFees(10, [{ recipient: accounts[1], value: 100 }]);

    const recipients = await this.GhostmarketNFT.getFeeRecipients(10);
    expect(recipients.length).to.equal(1);
    expect(recipients[0]).to.equal(accounts[1]);

    const values = await this.GhostmarketNFT.getFeeBps(10);
    console.log("fee values: ", values)
    expect(values.length).to.equal(1);
    expect(values[0]).to.be.bignumber.equal('100');

    //const tx = await testing.feesTest(10);
    //console.log("used gas", tx.receipt.gasUsed);
  });

  it.only("add properties", async function () {
    //key and value should be a string
    await this.GhostmarketNFT.setAttributes(11, [{ key: "bar", value: "1234" }])
    const attributes = await this.GhostmarketNFT.getAttributes(11);
    console.log("attributes:", attributes)
    expect(attributes[11].key).to.be("bar");
  });

  it('emits an attributes set event', async function () {
    const { logs } = await this.GhostmarketNFT.setAttributes(11, [{ key: "bar", value: "1234" }])
    expectEvent.inLogs(logs, 'AttributesSet', {
      tokenId: "11",
      attributes: [['bar', '1234']]
    });
  });

  it("get properties", async function () {
    let attributes = await this.GhostmarketNFT.getAttributes(1)
    //console.log(attributes)
  });
});

contract('GhostmarketNFT', async accounts => {
  before(async function () {
    // Deploy a new contract before the tests
    this.GhostmarketNFT = await deployProxy(
      my_constants._t_c.GhostmarketNFT,
      [my_constants._t_c.TOKEN_NAME, my_constants._t_c.TOKEN_SYMBOL, my_constants._t_c.TOKEN_URI],
      { initializer: "initialize", unsafeAllowCustomTypes: true });
    console.log('Deployed', this.GhostmarketNFT.address);
  });

  it("allows to update fee recipient", async function () {
    await this.GhostmarketNFT.saveFees(10, [{ recipient: accounts[1], value: 100 }]);
    await this.GhostmarketNFT.updateAccount(10, accounts[1], accounts[2]);

    const recipients = await this.GhostmarketNFT.getFeeRecipients(10);
    assert.equal(recipients.length, 1);
    assert.equal(recipients[0], accounts[2]);

    const values = await this.GhostmarketNFT.getFeeBps(10);
    assert.equal(values.length, 1);
    assert.equal(values[0], 100);
  });

});