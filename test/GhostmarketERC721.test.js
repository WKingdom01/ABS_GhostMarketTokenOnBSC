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
contract('GhostMarketERC721', async accounts => {
  const [minter, transferToAccount, royaltiesAccount, mintingFeeAccount] = accounts;
  console.log('minter: ', minter);
  console.log('transferToAccount: ', transferToAccount);
  console.log('royaltiesAccount: ', royaltiesAccount);
  console.log('mintingFeeAccount: ', mintingFeeAccount);
  beforeEach(async function () {
    // Deploy a new contract before the tests
    this.GhostMarketERC721 = await deployProxy(
      my_constants._t_c.GhostMarketERC721,
      [my_constants._t_c.TOKEN_NAME, my_constants._t_c.TOKEN_SYMBOL, my_constants._t_c.BASE_URI],
      { initializer: "initialize", unsafeAllowCustomTypes: true });
    console.log('Deployed', this.GhostMarketERC721.address);
  });

  it("name should be " + my_constants._t_c.TOKEN_NAME, async function () {
    expect((await this.GhostMarketERC721.name()).toString()).to.equal(my_constants._t_c.TOKEN_NAME);
  });

  it("symbol should be " + my_constants._t_c.TOKEN_SYMBOL, async function () {
    expect((await this.GhostMarketERC721.symbol()).toString()).to.equal(my_constants._t_c.TOKEN_SYMBOL);
  });

  it("should have base uri + token uri ", async function () {
    await this.GhostMarketERC721.mintGhost(minter, [], "", "")
    const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))
    expect(await this.GhostMarketERC721.tokenURI(tokenId)).to.equal(my_constants._t_c.BASE_URI + tokenId);
  });

  it("should mint with URI", async function () {
    const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))
    await this.GhostMarketERC721.mintWithURI(minter, tokenId, tokenId)
    expect(await this.GhostMarketERC721.tokenURI(tokenId)).to.equal(my_constants._t_c.BASE_URI + tokenId);
  });

  it("should mintGhost with new URI", async function () {
    const newURI = "new.app/"
    const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))
    await this.GhostMarketERC721.setBaseTokenURI(newURI);
    await this.GhostMarketERC721.mintWithURI(minter, tokenId, tokenId)
    expect(await this.GhostMarketERC721.tokenURI(tokenId)).to.equal(newURI + tokenId);
  });

  it("should mintGhost with URI", async function () {
    await this.GhostmarketERC721.mintGhost(minter, [], "", "")
    const tokenId = new BN(parseInt(await this.GhostmarketERC721.getLastTokenID()))
    expect(await this.GhostmarketERC721.tokenURI(tokenId)).to.equal(my_constants._t_c.BASE_URI + tokenId);
  });

  describe('mint NFT', function () {
    const value = ether('0.1')

    it('should mint tokens, nft owner = contract deployer', async function () {
      result = await this.GhostMarketERC721.mintGhost(minter, [], "", "")
      expect(await this.GhostMarketERC721.balanceOf(minter)).to.be.bignumber.equal('1')
      const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))
      expect(await this.GhostMarketERC721.ownerOf(tokenId)).to.equal(minter)
      const tokenURI = await this.GhostMarketERC721.tokenURI(tokenId)
      expectEvent(result, 'Minted', { toAddress: minter, tokenId: tokenId, tokenURI: tokenURI })


    });

    it('should mint tokens, nft owner = transferToAccount', async function () {
      await this.GhostMarketERC721.mintGhost(transferToAccount, [], "", "")
      expect(await this.GhostMarketERC721.balanceOf(transferToAccount)).to.be.bignumber.equal('1')
      const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))
      expect(await this.GhostMarketERC721.ownerOf(tokenId)).to.equal(transferToAccount)
    });

    it('should mint tokens with royalty fees', async function () {

      const minterAccountNFTbalance = parseInt((await this.GhostMarketERC721.balanceOf(minter)).toString())
      console.log("minter account NFT balance: ", minterAccountNFTbalance)
      const receipt = await this.GhostMarketERC721.mintGhost(minter, [{ recipient: minter, value: 100 }], "", "");
      const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))

      expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: minter, tokenId });

      expect(parseInt((await this.GhostMarketERC721.balanceOf(minter)).toString())).to.equal(minterAccountNFTbalance + 1);
      expect(await this.GhostMarketERC721.ownerOf(tokenId)).to.equal(minter);


      const values = await this.GhostMarketERC721.getRoyaltiesBps(tokenId);
      expect(values.length).to.equal(1);
      expect(values[0]).to.be.bignumber.equal('100');

    });

    it('should mint tokens WITHOUT royalty fees', async function () {

      const minterAccountNFTbalance = parseInt((await this.GhostMarketERC721.balanceOf(minter)).toString())
      console.log("minter account NFT balance: ", minterAccountNFTbalance)
      const receipt = await this.GhostMarketERC721.mintGhost(minter, [], "", "");

      const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))
      console.log("tokenId: ", tokenId)

      expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: minter, tokenId });

      expect(parseInt((await this.GhostMarketERC721.balanceOf(minter)).toString())).to.equal(minterAccountNFTbalance + 1);
      expect(await this.GhostMarketERC721.ownerOf(tokenId)).to.equal(minter);

      const values = await this.GhostMarketERC721.getRoyaltiesBps(tokenId);
      console.log("royalty fee values: ", values)
      expect(values).to.be.empty;
    });

    it("should mint with json string", async function () {      
      await this.GhostMarketERC721.mintGhost(transferToAccount, [], my_constants._t_c.METADATA_JSON, "")
      const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))
      expect(await this.GhostMarketERC721.getMetadataJson(tokenId)).to.equal(my_constants._t_c.METADATA_JSON)
    });

    it('everybody can mint', async function () {
      this.GhostMarketERC721.mintGhost(transferToAccount, [], "", "", { from: mintingFeeAccount })
    });
  });

  describe('mint NFT with fee', function () {
    it('should mint without fees', async function () {
      const value = ether('0');
      const feeAddressEthBalanceBefore = await web3.eth.getBalance(mintingFeeAccount)

      await this.GhostMarketERC721.setGhostmarketFeeAddress(mintingFeeAccount)
      await this.GhostMarketERC721.setGhostmarketMintFee(value)

      this.GhostMarketERC721.mintGhost(minter, [], "", "")
      const feeAddressEthBalanceAfter = await web3.eth.getBalance(mintingFeeAccount)
      expect(parseInt(feeAddressEthBalanceAfter)).to.equal(parseInt(feeAddressEthBalanceBefore))


    });

    it('should requires a non-null minting fee address', async function () {
      const value = ether('0.1');
      await this.GhostMarketERC721.setGhostmarketFeeAddress(ZERO_ADDRESS)
      await this.GhostMarketERC721.setGhostmarketMintFee(value)
      await expectRevert(
        this.GhostMarketERC721.mintGhost(minter, [], "", ""),
        'Ghostmarket minting Fee Address not set'
      );
    });

    it('should send fee to mintingFeeAccount', async function () {
      const value = ether('0.1');
      await this.GhostMarketERC721.setGhostmarketFeeAddress(mintingFeeAccount)
      await this.GhostMarketERC721.setGhostmarketMintFee(value)
      const feeAddressEthBalanceBefore = await web3.eth.getBalance(mintingFeeAccount)

      await this.GhostMarketERC721.mintGhost(minter, [], "", "", { value: value })

      const feeAddressEthBalanceAfter = await web3.eth.getBalance(mintingFeeAccount)
      console.log("feeAddress eth balance before: ", feeAddressEthBalanceBefore)
      console.log("feeAddress eth balance after: ", feeAddressEthBalanceAfter)
      console.log("royaltiesAccount: ", await web3.eth.getBalance(royaltiesAccount))

      expect(parseInt(feeAddressEthBalanceAfter)).to.equal(parseInt(feeAddressEthBalanceBefore) + parseInt(value))
    });

    it('should send fee to mintingFeeAccount from another minting account', async function () {
      const value = ether('0.1');
      await this.GhostMarketERC721.setGhostmarketFeeAddress(mintingFeeAccount)
      await this.GhostMarketERC721.setGhostmarketMintFee(value)
      const feeAddressEthBalanceBefore = await web3.eth.getBalance(mintingFeeAccount)

      await this.GhostMarketERC721.mintGhost(royaltiesAccount, [], "", "", { value: value, from: royaltiesAccount })

      const feeAddressEthBalanceAfter = await web3.eth.getBalance(mintingFeeAccount)
      console.log("feeAddress eth balance before: ", feeAddressEthBalanceBefore)
      console.log("feeAddress eth balance after: ", feeAddressEthBalanceAfter)
      console.log("royaltiesAccount: ", await web3.eth.getBalance(royaltiesAccount))

      expect(parseInt(feeAddressEthBalanceAfter)).to.equal(parseInt(feeAddressEthBalanceBefore) + parseInt(value))
    });
  });

  describe('locked content', function () {
    const hiddencontent = "top secret"

    it("should set and get locked content for nft", async function () {
      this.GhostMarketERC721.mintGhost(transferToAccount, [], "", hiddencontent)

      const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))

      console.log("token owner address: ", await this.GhostMarketERC721.ownerOf(tokenId))
      const { logs } = await this.GhostMarketERC721.getLockedContent.sendTransaction(tokenId, { from: transferToAccount })

      expectEvent.inLogs(logs, 'LockedContentViewed', {
        msgSender: transferToAccount,
        tokenId: tokenId,
        lockedContent: hiddencontent,
      });
    });

    it("should revert if other then token owner tries to fetch locked content", async function () {
      this.GhostMarketERC721.mintGhost(transferToAccount, [], "", hiddencontent)
      const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))

      await expectRevert(this.GhostMarketERC721.getLockedContent(tokenId),
        "Caller must be the owner of the NFT"
      );
    });

    it("should increment locked content view count", async function () {

      this.GhostMarketERC721.mintGhost(minter, [], "", hiddencontent)
      const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))

      const currentCounter = await this.GhostMarketERC721.getCurrentLockedContentViewTracker(tokenId)
      // call two times the getLockedContent function, counter should increment by 2
      await this.GhostMarketERC721.getLockedContent(tokenId)
      await this.GhostMarketERC721.getLockedContent(tokenId)
      expect(await this.GhostMarketERC721.getCurrentLockedContentViewTracker(tokenId)).to.be.bignumber.equal((currentCounter + 2).toString());

      // another NFT
      this.GhostMarketERC721.mintGhost(minter, [], "", "top secret2")
      const tokenId2 = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))
      const currentCounter2 = await this.GhostMarketERC721.getCurrentLockedContentViewTracker(tokenId2)
      await this.GhostMarketERC721.getLockedContent(tokenId2)
      expect(await this.GhostMarketERC721.getCurrentLockedContentViewTracker(tokenId2)).to.be.bignumber.equal((currentCounter2 + 1).toString());
    });
  });
});