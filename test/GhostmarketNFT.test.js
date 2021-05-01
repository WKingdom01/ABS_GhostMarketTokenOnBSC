// Load dependencies
const { expect } = require('chai');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
  ether
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

  it('deployer can mint tokens with royalitiy fees and attributes', async function () {
    const tokenId = new BN('0');

    const receipt = await this.GhostmarketNFT.mint(accounts[1], [{ recipient: accounts[1], value: 100 }], [{ key: "bar", value: "1234" }, { key: "baz", value: "strong" }], "");
    expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: accounts[1], tokenId });

    expect(await this.GhostmarketNFT.balanceOf(accounts[1])).to.be.bignumber.equal('1');
    expect(await this.GhostmarketNFT.ownerOf(tokenId)).to.equal(accounts[1]);

    expect(await this.GhostmarketNFT.tokenURI(tokenId)).to.equal(my_constants._t_c.TOKEN_URI + tokenId);

    const values = await this.GhostmarketNFT.getFeeBps(tokenId);
    expect(values.length).to.equal(1);
    expect(values[0]).to.be.bignumber.equal('100');

    const attributes = await this.GhostmarketNFT.getAttributes(tokenId);
    expect(attributes[0].key).to.equal("bar");
    expect(attributes[0].value).to.equal("1234");
    expect(attributes[1].key).to.equal("baz");
    expect(attributes[1].value).to.equal("strong");

  });

  it('deployer can mint tokens WITHOUT royalitiy fees and attributes', async function () {
    const minter_account = accounts[5];

    const receipt = await this.GhostmarketNFT.mint(minter_account, [], [], "");

    const tokenId = new BN(parseInt(await this.GhostmarketNFT.getCurrentCounter()) - 1)
    console.log("tokenId: ", tokenId)

    expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: minter_account, tokenId });

    expect(await this.GhostmarketNFT.balanceOf(minter_account)).to.be.bignumber.equal('1');
    expect(await this.GhostmarketNFT.ownerOf(tokenId)).to.equal(minter_account);

    expect(await this.GhostmarketNFT.tokenURI(tokenId)).to.equal(my_constants._t_c.TOKEN_URI + tokenId);

    const values = await this.GhostmarketNFT.getFeeBps(tokenId);
    console.log("royalitiy fee values: ", values)
    expect(values).to.be.empty;

    const attributes = await this.GhostmarketNFT.getAttributes(tokenId);
    console.log("attributes : ", attributes)
    expect(attributes).to.be.empty;


  });

  it('non minter cannot mint', async function () {
    // Test a transaction reverts
    await expectRevert(
      this.GhostmarketNFT.mint(accounts[2], [{ recipient: accounts[2], value: 100 }], [{ key: "bar", value: "1234" }], "", { from: accounts[3] }),
      'ERC721PresetMinterPauserAutoId: must have minter role to mint'
    );
  });

  it("allows to update royalities/secondary-sales fee recipient", async function () {
    const tokenId = new BN('0')
    const minter = accounts[1]
    const feeRecepient = accounts[2]
    console.log("minter account: ", minter)
    console.log("new recipients account: ", feeRecepient)
    const receipt = await this.GhostmarketNFT.mint(minter, [{ recipient: minter, value: 100 }], [{ key: "bar", value: "1234" }], "")

    await this.GhostmarketNFT.updateFeeAccount(tokenId, minter, feeRecepient)

    const recipients = await this.GhostmarketNFT.getFeeRecipients(tokenId)
    expect(recipients.length).to.equal(1)
    expect(recipients[0]).to.equal(feeRecepient)

  });

  it("allows to update royalities/secondary-sales fee value for specific account", async function () {
    const newFeeValue = 66
    const receipt = await this.GhostmarketNFT.mint(accounts[1], [{ recipient: accounts[1], value: 100 }], [{ key: "bar", value: "1234" }], "");
    const tokenId = new BN(parseInt(await this.GhostmarketNFT.getCurrentCounter()) - 1)

    await this.GhostmarketNFT.updateRecipientsFees(tokenId, accounts[1], newFeeValue);

    const values = await this.GhostmarketNFT.getFeeBps(tokenId);
    expect(values.length).to.equal(1);
    console.log("new fee value: ", values[0])
    expect(values[0]).to.be.bignumber.equal((newFeeValue).toString());

  });

  describe('should mint NFT with fee', function () {
    it('reverts on zero-valued minting fees', async function () {
      const minter = accounts[1]
      const feeAddress = accounts[3]
      const value = ether('0');
      await this.GhostmarketNFT.setGhostmarketFeeAddress(feeAddress)
      await this.GhostmarketNFT.setGhostmarketFeeMultiplier(1)
      await this.GhostmarketNFT.setGhostmarketMintFee(value)
      await expectRevert(
        this.GhostmarketNFT.mintWithFee(minter, [], [], "", { value: value }),
        'Ghostmarket minting Fee is zero'
      );
    });

    it('should requires a non-null minting fee address', async function () {
      const minter = accounts[1]
      const feeAddress = accounts[3]
      const value = ether('0.1');
      await this.GhostmarketNFT.setGhostmarketFeeAddress(ZERO_ADDRESS)
      await this.GhostmarketNFT.setGhostmarketFeeMultiplier(1)
      await this.GhostmarketNFT.setGhostmarketMintFee(value)
      await expectRevert(
        this.GhostmarketNFT.mintWithFee(minter, [], [], "", { value: value }),
        'Ghostmarket minting Fee Address not set'
      );
    });

    it('should accept payments', async function () {
      const minter = accounts[1]
      const feeAddress = accounts[3]
      const value = ether('0.1');
      await this.GhostmarketNFT.setGhostmarketFeeAddress(feeAddress)
      await this.GhostmarketNFT.setGhostmarketFeeMultiplier(1)
      await this.GhostmarketNFT.setGhostmarketMintFee(value)
      let feeAddressEthBalanceBefore = await web3.eth.getBalance(feeAddress)

      console.log("ghostmarketFeeMultiplier: ", await this.GhostmarketNFT.ghostmarketFeeMultiplier())
      console.log("ghostmarketMintingFee: ", await this.GhostmarketNFT.ghostmarketMintingFee())
      console.log("ghostmarketFeeAddress: ", await this.GhostmarketNFT.ghostmarketFeeAddress())
      await this.GhostmarketNFT.mintWithFee(minter, [], [], "", { value: value })
      let feeAddressEthBalanceAfter = await web3.eth.getBalance(feeAddress)
      console.log("feeAddress eth balance before: ", feeAddressEthBalanceBefore)
      console.log("feeAddress eth balance after: ", feeAddressEthBalanceAfter)
      expect(parseInt(feeAddressEthBalanceAfter)).to.equal(parseInt(feeAddressEthBalanceBefore) + parseInt(value))
    });
  });

  it("should set and get locked content for nft", async function () {
    const minter = accounts[0]
    const hiddencontent = "top secret"
    await this.GhostmarketNFT.mint(minter, [], [], hiddencontent);
    const tokenId = new BN(parseInt(await this.GhostmarketNFT.getCurrentCounter()) - 1)

    console.log("token owner address: ", await this.GhostmarketNFT.ownerOf(tokenId))

    expect(await this.GhostmarketNFT.getLockedContent(tokenId)).to.equal(hiddencontent);

  });

  it("should fetch locked content for token owner", async function () {
    const tokenReceiver = accounts[1]
    const hiddencontent = "top secret"
    await this.GhostmarketNFT.mint(tokenReceiver, [], [], hiddencontent)
    const tokenId = new BN(parseInt(await this.GhostmarketNFT.getCurrentCounter()) - 1)

    await expectRevert(this.GhostmarketNFT.getLockedContent(tokenId),
      "Caller must be the owner of the NFT"
    );
  });
});