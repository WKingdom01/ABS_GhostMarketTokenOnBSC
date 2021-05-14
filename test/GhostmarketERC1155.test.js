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
contract('GhostmarketERC1155', async accounts => {
  const [minter, transferToAccount, royalitiesAccount, mintingFeeAccount, royalitiesAccount2] = accounts;
  console.log('minter: ', minter)
  console.log('transferToAccount: ', transferToAccount)
  console.log('royalitiesAccount: ', royalitiesAccount)
  console.log('mintingFeeAccount: ', mintingFeeAccount)
  console.log('royalitiesAccount2: ', royalitiesAccount2)
  beforeEach(async function () {
    // Deploy a new contract before the tests
    this.GhostmarketERC1155 = await deployProxy(
      my_constants._t_c.GhostmarketERC1155,
      [my_constants._t_c.TOKEN_NAME, my_constants._t_c.TOKEN_SYMBOL, my_constants._t_c.BASE_URI],
      { initializer: "initialize", unsafeAllowCustomTypes: true });
    console.log('Deployed ERC1155 ', this.GhostmarketERC1155.address);
  });

  it("should have name " + my_constants._t_c.TOKEN_NAME, async function () {
    expect((await this.GhostmarketERC1155.name()).toString()).to.equal(my_constants._t_c.TOKEN_NAME);
  });

  it("should have symbol " + my_constants._t_c.TOKEN_SYMBOL, async function () {
    expect((await this.GhostmarketERC1155.symbol()).toString()).to.equal(my_constants._t_c.TOKEN_SYMBOL);
  });

  it("should have counter = 0", async function () {
    expect((await this.GhostmarketERC1155.getCurrentCounter())).to.be.bignumber.equal('0');
  });

  it("should mint token and have base uri", async function () {
    const mintAmount = new BN(2);
    const data = '0x987654321';
    await this.GhostmarketERC1155.mintGhost(minter, mintAmount, data, [], "", "")
    const tokenId = new BN(parseInt(await this.GhostmarketERC1155.getLastTokenID()))
    console.log("uri: ", await this.GhostmarketERC1155.uri(tokenId))
    expect(await this.GhostmarketERC1155.uri(tokenId)).to.equal(my_constants._t_c.BASE_URI);
  });



  it('should mint tokens with royalty fee', async function () {

    const mintAmount = new BN(2);
    const data = '0x987654321';
    const value = 88
    const counter = parseInt((await this.GhostmarketERC1155.getCurrentCounter()).toString())

    const receipt = await this.GhostmarketERC1155.mintGhost(transferToAccount, mintAmount, data, [{ recipient: minter, value: value }], "", "");
    const tokenId = await this.GhostmarketERC1155.getLastTokenID()
    expectEvent(receipt, 'TransferSingle', { operator: minter, from: ZERO_ADDRESS, to: transferToAccount, id: tokenId, value: mintAmount });
    expect(parseInt(((await this.GhostmarketERC1155.getCurrentCounter()).toString()))).to.equal(counter + 1);

    const values = await this.GhostmarketERC1155.getRoyaltyFeeBps(tokenId);
    expect(values.length).to.equal(1);
    expect(values[0]).to.be.bignumber.equal(value.toString());
    const tokenURI = await this.GhostmarketERC1155.uri(tokenId)
    expectEvent(receipt, 'Minted', { toAddress: transferToAccount, tokenId: tokenId, tokenURI: tokenURI, amount: mintAmount })
  });

  it('everyone can mint', async function () {
    const mintAmount = new BN(2);
    const data = '0x987654321';

    this.GhostmarketERC1155.mintGhost(transferToAccount, mintAmount, data, [], "", "", { from: royalitiesAccount2 })

  });

  describe('mint NFT with fee', function () {
    const mintAmount = new BN(2);
    const data = '0x987654321';
    it('should not mint with fee if fee value is zero', async function () {

      const value = ether('0');
      await this.GhostmarketERC1155.setGhostmarketFeeAddress(mintingFeeAccount)
      await this.GhostmarketERC1155.setGhostmarketMintFee(value)
      let feeAddressEthBalanceBefore = await web3.eth.getBalance(mintingFeeAccount)

      this.GhostmarketERC1155.mintGhost(minter, mintAmount, data, [], "", "")
      let feeAddressEthBalanceAfter = await web3.eth.getBalance(mintingFeeAccount)
      expect(parseInt(feeAddressEthBalanceAfter)).to.equal(parseInt(feeAddressEthBalanceBefore))

    });

    it('should requires a minting fee address that is not 0x0', async function () {

      const value = ether('0.1');
      await this.GhostmarketERC1155.setGhostmarketFeeAddress(ZERO_ADDRESS)
      await this.GhostmarketERC1155.setGhostmarketMintFee(value)
      await expectRevert(
        this.GhostmarketERC1155.mintGhost(minter, mintAmount, data, [], "", ""),
        'Ghostmarket minting Fee Address not set'
      );
    });

    it('should accept payments', async function () {
      const value = ether('0.1');
      console.log("value: ", value)
      await this.GhostmarketERC1155.setGhostmarketFeeAddress(mintingFeeAccount)
      await this.GhostmarketERC1155.setGhostmarketMintFee(value)
      let feeAddressEthBalanceBefore = await web3.eth.getBalance(mintingFeeAccount)

      console.log("ghostmarketMintingFee: ", await this.GhostmarketERC1155.ghostmarketMintingFee())
      console.log("ghostmarketFeeAddress: ", await this.GhostmarketERC1155.ghostmarketFeeAddress())
      await this.GhostmarketERC1155.mintGhost(minter, mintAmount, data, [], "", "ts", { value: value });
      let feeAddressEthBalanceAfter = await web3.eth.getBalance(mintingFeeAccount)
      console.log("feeAddress eth balance before: ", feeAddressEthBalanceBefore)
      console.log("feeAddress eth balance after: ", feeAddressEthBalanceAfter)
      expect(parseInt(feeAddressEthBalanceAfter)).to.equal(parseInt(feeAddressEthBalanceBefore) + (parseInt(value)))
    });
  });

  it("should mint with json string", async function () {
    const mintAmount = new BN(2);
    const data = '0x987654321';
    await this.GhostmarketERC1155.mintGhost(minter, mintAmount, data, [], my_constants._t_c.METADATA_JSON, "")
    const tokenId = new BN(parseInt(await this.GhostmarketERC1155.getLastTokenID()))
    expect(await this.GhostmarketERC1155.getMetadataJson(tokenId)).to.equal(my_constants._t_c.METADATA_JSON)
  });

  describe('mint with locked content', function () {
    const mintAmount = new BN(1);
    const hiddencontent = "top secret"
    const data = '0x987654321';
    const value = ether('0.1');
    it("should set and get locked content for nft", async function () {

      await this.GhostmarketERC1155.mintGhost(transferToAccount, mintAmount, data, [], "", hiddencontent)
      const tokenId = new BN(parseInt(await this.GhostmarketERC1155.getLastTokenID()))

      const { logs } = await this.GhostmarketERC1155.getLockedContent.sendTransaction(transferToAccount, tokenId, { from: transferToAccount })

      expectEvent.inLogs(logs, 'LockedContentViewed', {
        msgSender: transferToAccount,
        tokenId: tokenId,
        lockedContent: hiddencontent,
      });
    });

    it("should revert if other then token owner tries to fetch locked content", async function () {
      await this.GhostmarketERC1155.mintGhost(transferToAccount, mintAmount, data, [], "", hiddencontent)
      const tokenId = new BN(parseInt(await this.GhostmarketERC1155.getLastTokenID()))

      await expectRevert(this.GhostmarketERC1155.getLockedContent(transferToAccount, tokenId),
        "caller is not owner nor approved to get locked content"
      );
    });

    it("should increment locked content view count", async function () {
      const hiddencontent = "top secret"
      await this.GhostmarketERC1155.mintGhost(minter, mintAmount, data, [], "", hiddencontent)
      const tokenId = new BN(parseInt(await this.GhostmarketERC1155.getLastTokenID()))

      const currentCounter = await this.GhostmarketERC1155.getCurrentLockedContentViewTracker(tokenId)
      // call two times the getLockedContent function, counter should increment by 2
      await this.GhostmarketERC1155.getLockedContent(minter, tokenId)
      await this.GhostmarketERC1155.getLockedContent(minter, tokenId)
      expect(await this.GhostmarketERC1155.getCurrentLockedContentViewTracker(tokenId)).to.be.bignumber.equal((currentCounter + 2).toString());

      //another NFT
      await this.GhostmarketERC1155.mintGhost(transferToAccount, mintAmount, data, [], "", "top secret2")
      const tokenId2 = new BN(parseInt(await this.GhostmarketERC1155.getLastTokenID()))
      const currentCounter2 = await this.GhostmarketERC1155.getCurrentLockedContentViewTracker(tokenId2)
      await this.GhostmarketERC1155.getLockedContent(transferToAccount, tokenId2, { from: transferToAccount })
      expect(await this.GhostmarketERC1155.getCurrentLockedContentViewTracker(tokenId2)).to.be.bignumber.equal((currentCounter2 + 1).toString());

    });
  });
});