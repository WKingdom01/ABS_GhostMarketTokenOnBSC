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

  it("should grant POLYNETWORK_ROLE to address", async function () {
    this.GhostMarketERC721.grantRole(my_constants._t_c.POLYNETWORK_ROLE, transferToAccount);
    const hasPolyRole = (await this.GhostMarketERC721.hasRole(my_constants._t_c.POLYNETWORK_ROLE, transferToAccount)).toString();
    expect(hasPolyRole).to.equal("true");
    this.GhostMarketERC721.mintWithURI(minter, new BN(1), "testuri", { from: transferToAccount })
  });

  it("should transfer ownership of contract", async function () {
    await this.GhostMarketERC721.transferOwnership(transferToAccount);
    expect(await this.GhostMarketERC721.owner()).to.equal(transferToAccount)
  });

  it("should mintWithURI and have given tokenURI", async function () {
    const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))
    const specialuri = "special-uri"
    await this.GhostMarketERC721.mintWithURI(minter, tokenId, specialuri)
    expect(await this.GhostMarketERC721.tokenURI(tokenId)).to.equal(my_constants._t_c.BASE_URI + specialuri);
  });

  it("should revert if minter using mintWithURI function has not the POLYNETWORK_ROLE", async function () {
    const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))
    await expectRevert(
      this.GhostMarketERC721.mintWithURI(minter, tokenId, tokenId, { from: transferToAccount }),
      "mintWithURI: must have POLYNETWORK_ROLE role to mint"
    );
  });

  it("should mintGhost with new URI", async function () {
    const newURI = "new.app/"
    const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))
    await this.GhostMarketERC721.setBaseTokenURI(newURI);
    await this.GhostMarketERC721.mintGhost(minter, [], "", "")
    expect(await this.GhostMarketERC721.tokenURI(tokenId)).to.equal(newURI + tokenId);
  });

  it("should mintGhost with URI", async function () {
    await this.GhostMarketERC721.mintGhost(minter, [], "", "")
    const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))
    expect(await this.GhostMarketERC721.tokenURI(tokenId)).to.equal(my_constants._t_c.BASE_URI + tokenId);
  });

  describe('burn NFT', function () {
    it('should burn a single NFT', async function () {
      await this.GhostMarketERC721.mintGhost(minter, [], "", "")
      //confirm its minted
      const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))
      expect(await this.GhostMarketERC721.balanceOf(minter)).to.be.bignumber.equal('1')
      expect(await this.GhostMarketERC721.ownerOf(tokenId)).to.equal(minter)
      await this.GhostMarketERC721.burn(tokenId)
      //token should not exists anymore
      await expectRevert(
        this.GhostMarketERC721.ownerOf(tokenId),
        "evert ERC721: owner query for nonexistent token"
      );
    });

    it('should burn multiple NFTs', async function () {
      const tokenIDs = [0, 1, 2, 3, 4]
      for (const i of tokenIDs) {
        await this.GhostMarketERC721.mintGhost(minter, [], "", "")
      }

      //confirm minted tokens
      const currentCounter = await this.GhostMarketERC721.getCurrentCounter()
      expect(await this.GhostMarketERC721.balanceOf(minter)).to.be.bignumber.equal(currentCounter)
      for (const i of tokenIDs) {
        expect(await this.GhostMarketERC721.ownerOf(new BN(i))).to.equal(minter)
      }

      await this.GhostMarketERC721.burnBatch(tokenIDs)
      for (const i of tokenIDs) {
        await expectRevert(
          this.GhostMarketERC721.ownerOf(new BN(i)),
          "evert ERC721: owner query for nonexistent token"
        );
      }
    });

    it('should revert while trying to burn multiple NFTs, caller is not owner nor approved', async function () {
      const tokenIDs = [0]
      for (const i of tokenIDs) {
        await this.GhostMarketERC721.mintGhost(minter, [], "", "")
      }

      //confirm minted tokens
      const currentCounter = await this.GhostMarketERC721.getCurrentCounter()
      expect(await this.GhostMarketERC721.balanceOf(minter)).to.be.bignumber.equal(currentCounter)
      for (const i of tokenIDs) {
        expect(await this.GhostMarketERC721.ownerOf(new BN(i))).to.equal(minter)
      }

      await expectRevert(
        this.GhostMarketERC721.burnBatch(tokenIDs, { from: transferToAccount }),
        "ERC721Burnable: caller is not owner nor approved"
      );
    });
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

    it('should mint with json string', async function () {
      await this.GhostMarketERC721.mintGhost(transferToAccount, [], my_constants._t_c.METADATA_JSON, "")
      const tokenId = new BN(parseInt(await this.GhostMarketERC721.getLastTokenID()))
      expect(await this.GhostMarketERC721.getMetadataJson(tokenId)).to.equal(my_constants._t_c.METADATA_JSON)
    });

    it('everybody can mint', async function () {
      this.GhostMarketERC721.mintGhost(transferToAccount, [], "", "", { from: mintingFeeAccount })
    });
  });

  describe('mint NFT with fee', function () {
    it('should mint if setGhostmarketMintFee is set to 0 ', async function () {
      const value = ether('0');
      const feeAddressEthBalanceBefore = await web3.eth.getBalance(this.GhostMarketERC721.address)

      await this.GhostMarketERC721.setGhostmarketMintFee(value)

      this.GhostMarketERC721.mintGhost(minter, [], "", "")
      const feeAddressEthBalanceAfter = await web3.eth.getBalance(this.GhostMarketERC721.address)
      expect(parseInt(feeAddressEthBalanceAfter)).to.equal(parseInt(feeAddressEthBalanceBefore))
    });

    it('should send fee to mintingFeeAccount', async function () {
      const value = ether('0.1');
      await this.GhostMarketERC721.setGhostmarketMintFee(value)
      const feeAddressEthBalanceBefore = await web3.eth.getBalance(this.GhostMarketERC721.address)

      await this.GhostMarketERC721.mintGhost(minter, [], "", "", { value: value })

      const feeAddressEthBalanceAfter = await web3.eth.getBalance(this.GhostMarketERC721.address)
      console.log("feeAddress eth balance before: ", feeAddressEthBalanceBefore)
      console.log("feeAddress eth balance after: ", feeAddressEthBalanceAfter)

      expect(parseInt(feeAddressEthBalanceAfter)).to.equal(parseInt(feeAddressEthBalanceBefore) + parseInt(value))
    });

    it('should send fee to mintingFeeAccount from another minting account', async function () {
      const value = ether('0.1');
      await this.GhostMarketERC721.setGhostmarketMintFee(value)
      const feeAddressEthBalanceBefore = await web3.eth.getBalance(this.GhostMarketERC721.address)

      await this.GhostMarketERC721.mintGhost(minter, [], "", "", { value: value, from: royaltiesAccount })

      const feeAddressEthBalanceAfter = await web3.eth.getBalance(this.GhostMarketERC721.address)
      console.log("feeAddress eth balance before: ", feeAddressEthBalanceBefore)
      console.log("feeAddress eth balance after: ", feeAddressEthBalanceAfter)

      expect(parseInt(feeAddressEthBalanceAfter)).to.equal(parseInt(feeAddressEthBalanceBefore) + parseInt(value))
    });
  });

  describe('withdraw from contract', function () {
    it('should withdraw all availabe balance from contract', async function () {
      const value = ether('0.1');
      await this.GhostMarketERC721.setGhostmarketMintFee(value)
      const feeAddressEthBalanceBefore = await web3.eth.getBalance(this.GhostMarketERC721.address)

      await this.GhostMarketERC721.mintGhost(minter, [], "", "", { value: value, from: royaltiesAccount })
      await this.GhostMarketERC721.mintGhost(minter, [], "", "", { value: value, from: royaltiesAccount })
      await this.GhostMarketERC721.mintGhost(minter, [], "", "", { value: value, from: royaltiesAccount })

      const feeAddressEthBalanceAfter = await web3.eth.getBalance(this.GhostMarketERC721.address)
      console.log("feeAddress eth balance before: ", feeAddressEthBalanceBefore)
      console.log("feeAddress eth balance after: ", feeAddressEthBalanceAfter)
      console.log("minter eth balance befor: ", await web3.eth.getBalance(minter))

      await this.GhostMarketERC721.withdraw(feeAddressEthBalanceAfter)
      console.log("minter eth balance after: ", await web3.eth.getBalance(minter))
      expect(await web3.eth.getBalance(this.GhostMarketERC721.address)).to.equal('0')
    });

    it('should revert trying to withdraw more then the contract balance', async function () {
      const value = ether('0.1');
      await this.GhostMarketERC721.setGhostmarketMintFee(value)
      const feeAddressEthBalanceBefore = await web3.eth.getBalance(this.GhostMarketERC721.address)

      await this.GhostMarketERC721.mintGhost(minter, [], "", "", { value: value })
      await this.GhostMarketERC721.mintGhost(minter, [], "", "", { value: value })
      await this.GhostMarketERC721.mintGhost(minter, [], "", "", { value: value })

      const feeAddressEthBalanceAfter = await web3.eth.getBalance(this.GhostMarketERC721.address)
      console.log("feeAddress eth balance before: ", feeAddressEthBalanceBefore)
      console.log("feeAddress eth balance after: ", feeAddressEthBalanceAfter)
      console.log("minter eth balance befor: ", await web3.eth.getBalance(minter))

      //await this.GhostMarketERC721.withdraw(feeAddressEthBalanceAfter + value)

      await expectRevert(this.GhostMarketERC721.withdraw(feeAddressEthBalanceAfter + value),
        "Withdraw amount should be greater then 0 and less then contract balance"
      );
    });

    it('should revert if other then the contract owner tries to withdraw', async function () {
      const value = ether('0.1');
      await this.GhostMarketERC721.setGhostmarketMintFee(value)
      const feeAddressEthBalanceBefore = await web3.eth.getBalance(this.GhostMarketERC721.address)

      await this.GhostMarketERC721.mintGhost(minter, [], "", "", { value: value })
      await this.GhostMarketERC721.mintGhost(minter, [], "", "", { value: value })
      await this.GhostMarketERC721.mintGhost(minter, [], "", "", { value: value })

      const feeAddressEthBalanceAfter = await web3.eth.getBalance(this.GhostMarketERC721.address)
      console.log("feeAddress eth balance before: ", feeAddressEthBalanceBefore)
      console.log("feeAddress eth balance after: ", feeAddressEthBalanceAfter)
      console.log("minter eth balance befor: ", await web3.eth.getBalance(minter))

      //await this.GhostMarketERC721.withdraw(feeAddressEthBalanceAfter + value)

      await expectRevert(this.GhostMarketERC721.withdraw(feeAddressEthBalanceAfter, { from: royaltiesAccount}),
        "Ownable: caller is not the owner"
      );
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