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
contract('GhostmarketERC721', async accounts => {
  before(async function () {
    // Deploy a new contract before the tests
    this.GhostmarketERC721 = await deployProxy(
      my_constants._t_c.GhostmarketERC721,
      [my_constants._t_c.TOKEN_NAME, my_constants._t_c.TOKEN_SYMBOL, my_constants._t_c.TOKEN_URI],
      { initializer: "initialize", unsafeAllowCustomTypes: true });
    console.log('Deployed', this.GhostmarketERC721.address);
  });

  it("name should be " + my_constants._t_c.TOKEN_NAME, async function () {
    expect((await this.GhostmarketERC721.name()).toString()).to.equal(my_constants._t_c.TOKEN_NAME);
  });

  it("symbol should be " + my_constants._t_c.TOKEN_SYMBOL, async function () {
    expect((await this.GhostmarketERC721.symbol()).toString()).to.equal(my_constants._t_c.TOKEN_SYMBOL);
  });

  it('deployer can mint tokens with royalitiy fees and attributes', async function () {
    const tokenId = new BN('0');

    const receipt = await this.GhostmarketERC721.mint(accounts[1], [{ recipient: accounts[1], value: 100 }], [{ key: "bar", value: "1234" }, { key: "baz", value: "strong" }], "");
    expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: accounts[1], tokenId });

    expect(await this.GhostmarketERC721.balanceOf(accounts[1])).to.be.bignumber.equal('1');
    expect(await this.GhostmarketERC721.ownerOf(tokenId)).to.equal(accounts[1]);

    expect(await this.GhostmarketERC721.tokenURI(tokenId)).to.equal(my_constants._t_c.TOKEN_URI + tokenId);

    const values = await this.GhostmarketERC721.getFeeBps(tokenId);
    expect(values.length).to.equal(1);
    expect(values[0]).to.be.bignumber.equal('100');

    const attributes = await this.GhostmarketERC721.getAttributes(tokenId);
    expect(attributes[0].key).to.equal("bar");
    expect(attributes[0].value).to.equal("1234");
    expect(attributes[1].key).to.equal("baz");
    expect(attributes[1].value).to.equal("strong");

  });

  it('deployer can mint tokens WITHOUT royalitiy fees and attributes', async function () {
    const minter_account = accounts[5];

    const receipt = await this.GhostmarketERC721.mint(minter_account, [], [], "");

    const tokenId = new BN(parseInt(await this.GhostmarketERC721.getCurrentCounter()) - 1)
    console.log("tokenId: ", tokenId)

    expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: minter_account, tokenId });

    expect(await this.GhostmarketERC721.balanceOf(minter_account)).to.be.bignumber.equal('1');
    expect(await this.GhostmarketERC721.ownerOf(tokenId)).to.equal(minter_account);

    expect(await this.GhostmarketERC721.tokenURI(tokenId)).to.equal(my_constants._t_c.TOKEN_URI + tokenId);

    const values = await this.GhostmarketERC721.getFeeBps(tokenId);
    console.log("royalitiy fee values: ", values)
    expect(values).to.be.empty;

    const attributes = await this.GhostmarketERC721.getAttributes(tokenId);
    console.log("attributes : ", attributes)
    expect(attributes).to.be.empty;


  });

  it('non minter cannot mint', async function () {
    // Test a transaction reverts
    await expectRevert(
      this.GhostmarketERC721.mint(accounts[2], [{ recipient: accounts[2], value: 100 }], [{ key: "bar", value: "1234" }], "", { from: accounts[3] }),
      'ERC721PresetMinterPauserAutoId: must have minter role to mint'
    );
  });

  it("allows to update royalities/secondary-sales fee recipient", async function () {
    const tokenId = new BN('0')
    const minter = accounts[1]
    const feeRecepient = accounts[2]
    console.log("minter account: ", minter)
    console.log("new recipients account: ", feeRecepient)
    const receipt = await this.GhostmarketERC721.mint(minter, [{ recipient: minter, value: 100 }], [{ key: "bar", value: "1234" }], "")

    await this.GhostmarketERC721.updateFeeAccount(tokenId, minter, feeRecepient)

    const recipients = await this.GhostmarketERC721.getFeeRecipients(tokenId)
    expect(recipients.length).to.equal(1)
    expect(recipients[0]).to.equal(feeRecepient)

  });

  it("allows to update royalities/secondary-sales fee value for specific account", async function () {
    const newFeeValue = 66
    const receipt = await this.GhostmarketERC721.mint(accounts[1], [{ recipient: accounts[1], value: 100 }], [{ key: "bar", value: "1234" }], "");
    const tokenId = new BN(parseInt(await this.GhostmarketERC721.getCurrentCounter()) - 1)

    await this.GhostmarketERC721.updateRecipientsFees(tokenId, accounts[1], newFeeValue);

    const values = await this.GhostmarketERC721.getFeeBps(tokenId);
    expect(values.length).to.equal(1);
    console.log("new fee value: ", values[0])
    expect(values[0]).to.be.bignumber.equal((newFeeValue).toString());

  });

  describe('should mint NFT with fee', function () {
    it('reverts on zero-valued minting fees', async function () {
      const minter = accounts[1]
      const feeAddress = accounts[3]
      const value = ether('0');
      await this.GhostmarketERC721.setGhostmarketFeeAddress(feeAddress)
      await this.GhostmarketERC721.setGhostmarketFeeMultiplier(1)
      await this.GhostmarketERC721.setGhostmarketMintFee(value)
      await expectRevert(
        this.GhostmarketERC721.mintWithFee(minter, [], [], "", { value: value }),
        'Ghostmarket minting Fee is zero'
      );
    });

    it('should requires a non-null minting fee address', async function () {
      const minter = accounts[1]
      const feeAddress = accounts[3]
      const value = ether('0.1');
      await this.GhostmarketERC721.setGhostmarketFeeAddress(ZERO_ADDRESS)
      await this.GhostmarketERC721.setGhostmarketFeeMultiplier(1)
      await this.GhostmarketERC721.setGhostmarketMintFee(value)
      await expectRevert(
        this.GhostmarketERC721.mintWithFee(minter, [], [], "", { value: value }),
        'Ghostmarket minting Fee Address not set'
      );
    });

    it('should accept payments', async function () {
      const minter = accounts[1]
      const feeAddress = accounts[3]
      const value = ether('0.1');
      await this.GhostmarketERC721.setGhostmarketFeeAddress(feeAddress)
      await this.GhostmarketERC721.setGhostmarketFeeMultiplier(1)
      await this.GhostmarketERC721.setGhostmarketMintFee(value)
      let feeAddressEthBalanceBefore = await web3.eth.getBalance(feeAddress)

      console.log("ghostmarketFeeMultiplier: ", await this.GhostmarketERC721.ghostmarketFeeMultiplier())
      console.log("ghostmarketMintingFee: ", await this.GhostmarketERC721.ghostmarketMintingFee())
      console.log("ghostmarketFeeAddress: ", await this.GhostmarketERC721.ghostmarketFeeAddress())
      await this.GhostmarketERC721.mintWithFee(minter, [], [], "", { value: value })
      let feeAddressEthBalanceAfter = await web3.eth.getBalance(feeAddress)
      console.log("feeAddress eth balance before: ", feeAddressEthBalanceBefore)
      console.log("feeAddress eth balance after: ", feeAddressEthBalanceAfter)
      expect(parseInt(feeAddressEthBalanceAfter)).to.equal(parseInt(feeAddressEthBalanceBefore) + parseInt(value))
    });
  });

  it("should set and get locked content for nft", async function () {
    const nftReceiver = accounts[5]
    const hiddencontent = "top secret"
    const mintResult = await this.GhostmarketERC721.mint(nftReceiver, [], [], hiddencontent);
    //console.log("mintResult: ", mintResult)
    const tokenId = new BN(parseInt(await this.GhostmarketERC721.getCurrentCounter()) - 1)

    console.log("token owner address: ", await this.GhostmarketERC721.ownerOf(tokenId))
    const { logs } = await this.GhostmarketERC721.getLockedContent.sendTransaction(tokenId, { from: nftReceiver })

    //const { logs } = await this.GhostmarketERC721.getLockedContent(tokenId)

    //console.log("result: ", result)

    expectEvent.inLogs(logs, 'LockedContentViewed', {
      msgSender: nftReceiver,
      tokenId: tokenId,
      lockedContent: hiddencontent,
    });


  });

  it("should revert if other then token owner tries to fetch locked content", async function () {
    const tokenReceiver = accounts[1]
    const hiddencontent = "top secret"
    await this.GhostmarketERC721.mint(tokenReceiver, [], [], hiddencontent)
    const tokenId = new BN(parseInt(await this.GhostmarketERC721.getCurrentCounter()) - 1)

    await expectRevert(this.GhostmarketERC721.getLockedContent(tokenId),
      "Caller must be the owner of the NFT"
    );
  });

  it("should increment locked content view count", async function () {
    const tokenReceiver = accounts[0]
    const hiddencontent = "top secret"
    await this.GhostmarketERC721.mint(tokenReceiver, [], [], hiddencontent)
    const tokenId = new BN(parseInt(await this.GhostmarketERC721.getCurrentCounter()) - 1)

    const currentCounter = await this.GhostmarketERC721.getCurrentLockedContentViewTracker(tokenId)
    // call two times the getLockedContent function, counter should increment by 2
    await this.GhostmarketERC721.getLockedContent(tokenId)
    await this.GhostmarketERC721.getLockedContent(tokenId)
    expect(await this.GhostmarketERC721.getCurrentLockedContentViewTracker(tokenId)).to.be.bignumber.equal((currentCounter + 2).toString());

    //another NFT
    await this.GhostmarketERC721.mint(tokenReceiver, [], [], "top secret2")
    const tokenId2 = new BN(parseInt(await this.GhostmarketERC721.getCurrentCounter()) - 1)
    const currentCounter2 = await this.GhostmarketERC721.getCurrentLockedContentViewTracker(tokenId2)
    await this.GhostmarketERC721.getLockedContent(tokenId2)
    expect(await this.GhostmarketERC721.getCurrentLockedContentViewTracker(tokenId2)).to.be.bignumber.equal((currentCounter2 + 1).toString());


  });
});