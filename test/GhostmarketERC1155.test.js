// Load dependencies
const { expect } = require('chai');
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
  ether
} = require('@openzeppelin/test-helpers');

const { ZERO_ADDRESS } = constants;

const { GHOSTMARKET_ERC1155, TOKEN_NAME, TOKEN_SYMBOL, BASE_URI, METADATA_JSON, getLastTokenID, POLYNETWORK_ROLE } = require('./include_in_tesfiles.js')

const GhostMarketERC1155_V2 = artifacts.require("TestGhostMarketERC1155_V2");
// Start test block
contract('GhostMarketERC1155', async accounts => {
  const [minter, transferToAccount, royaltiesAccount, anotherAccount, royaltiesAccount2] = accounts;
  const data = '0x987654321';
  const mintAmount = new BN(2);
  console.log('minter: ', minter)
  console.log('transferToAccount: ', transferToAccount)
  console.log('royaltiesAccount: ', royaltiesAccount)
  console.log('anotherAccount: ', anotherAccount)
  console.log('royaltiesAccount2: ', royaltiesAccount2)
  beforeEach(async function () {
    // Deploy a new contract before the tests
    this.GhostMarketERC1155 = await deployProxy(
      GHOSTMARKET_ERC1155,
      [TOKEN_NAME, TOKEN_SYMBOL, BASE_URI],
      { initializer: "initialize", unsafeAllowCustomTypes: true });
    console.log('Deployed ERC1155 ', this.GhostMarketERC1155.address);
  });

  it("should have name " + TOKEN_NAME, async function () {
    expect((await this.GhostMarketERC1155.name()).toString()).to.equal(TOKEN_NAME);
  });

  it("should have symbol " + TOKEN_SYMBOL, async function () {
    expect((await this.GhostMarketERC1155.symbol()).toString()).to.equal(TOKEN_SYMBOL);
  });

  it("should support interface _INTERFACE_ID_ERC1155_GHOSTMARKET", async function () {
    expect((await this.GhostMarketERC1155.supportsInterface("0x9440721")).toString()).to.equal('true');
  });

  it("should support interface _GHOSTMARKET_NFT_ROYALTIES", async function () {
    expect((await this.GhostMarketERC1155.supportsInterface("0xe42093a6")).toString()).to.equal('true');
  });

  it("should have initial counter = 1", async function () {
    expect((await this.GhostMarketERC1155.getCurrentCounter())).to.be.bignumber.equal('1');
  });

  it("should transfer ownership of contract", async function () {
    await this.GhostMarketERC1155.transferOwnership(transferToAccount);
    expect(await this.GhostMarketERC1155.owner()).to.equal(transferToAccount)
  });

  it.only("should upgrade contract", async function () {
    const mintFeeValue = ether('0.1')
    this.GhostMarketERC1155.setGhostmarketMintFee(mintFeeValue)

    //upgrade
    this.GhostMarketERC1155_V2 = await upgradeProxy(this.GhostMarketERC1155.address, GhostMarketERC1155_V2);

    //test new function
    assert.equal(await this.GhostMarketERC1155_V2.getSomething(), 10);

    //name and symbol should be the same
    expect((await this.GhostMarketERC1155_V2.name()).toString()).to.equal(TOKEN_NAME);
    expect((await this.GhostMarketERC1155_V2.symbol()).toString()).to.equal(TOKEN_SYMBOL);

    // increment already set _ghostmarketMintFees value
    result = await this.GhostMarketERC1155_V2.incrementMintingFee()
    expectEvent(result, 'NewMintFeeIncremented', { newValue: '100000000000000001' })

  })

  it("should mint token and have base uri", async function () {
    await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "")
    const tokenId = await getLastTokenID(this.GhostMarketERC1155)
    console.log("uri: ", await this.GhostMarketERC1155.uri(tokenId))
    expect(await this.GhostMarketERC1155.uri(tokenId)).to.equal(BASE_URI);
  });

  it("should mint token and have new base uri", async function () {
    const newUri = 'gggghost/api/{id}.json'
    this.GhostMarketERC1155.setURI(newUri);
    await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "")
    const tokenId = await getLastTokenID(this.GhostMarketERC1155)
    console.log("uri: ", await this.GhostMarketERC1155.uri(tokenId))
    expect(await this.GhostMarketERC1155.uri(tokenId)).to.equal(newUri);
  });

  describe('mintWithURI', function () {
    it("should grant POLYNETWORK_ROLE to address", async function () {
      await this.GhostMarketERC1155.grantRole(POLYNETWORK_ROLE, transferToAccount);
      const hasPolyRole = (await this.GhostMarketERC1155.hasRole(POLYNETWORK_ROLE, transferToAccount)).toString();
      expect(hasPolyRole).to.equal("true");
    });

    it("should mintWithURI and have given tokenURI", async function () {
      const mintAmount = new BN(20);
      const tokenId = await getLastTokenID(this.GhostMarketERC1155)
      const specialuri = "special-uri"
      await this.GhostMarketERC1155.mintWithURI(minter, tokenId, specialuri, mintAmount)
      expect(await this.GhostMarketERC1155.uri(tokenId)).to.equal(specialuri);
    });

    it("should revert if minter using mintWithURI function has not the POLYNETWORK_ROLE", async function () {
      const mintAmount = new BN(20);
      const tokenId = await getLastTokenID(this.GhostMarketERC1155)
      await expectRevert(
        this.GhostMarketERC1155.mintWithURI(minter, tokenId, tokenId, mintAmount, { from: transferToAccount }),
        "mintWithURI: must have POLYNETWORK_ROLE role to mint"
      );
    });
  });

  describe('burn NFT', function () {
    it('should burn a single NFT', async function () {
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "")
      //confirm its minted
      const tokenId = await getLastTokenID(this.GhostMarketERC1155)
      expect(await this.GhostMarketERC1155.balanceOf(minter, tokenId)).to.be.bignumber.equal(mintAmount.toString())
      await this.GhostMarketERC1155.burn(minter, tokenId, mintAmount)
      expect(await this.GhostMarketERC1155.balanceOf(minter, tokenId)).to.be.bignumber.equal('0')
    });

    it('should revert if not-owner tries to burn a NFT', async function () {
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "")
      //confirm its minted
      const tokenId = await getLastTokenID(this.GhostMarketERC1155)
      expect(await this.GhostMarketERC1155.balanceOf(minter, tokenId)).to.be.bignumber.equal(mintAmount.toString())
      await expectRevert(this.GhostMarketERC1155.burn(transferToAccount, tokenId, mintAmount, { from: transferToAccount }),
        "ERC1155: burn amount exceeds balance"
      );
    });

    it('should burn multiple NFTs', async function () {
      const mintAmount = new BN(20);
      const mintAmount2 = new BN(30);
      const burnAmounts = [new BN(20), new BN(10)];
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "")
      const tokenId = await getLastTokenID(this.GhostMarketERC1155)
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount2, data, [], "ext_uri", "", "")
      const tokenId2 = await getLastTokenID(this.GhostMarketERC1155)
      //confirm its minted
      expect(await this.GhostMarketERC1155.balanceOf(minter, tokenId)).to.be.bignumber.equal(mintAmount.toString())
      expect(await this.GhostMarketERC1155.balanceOf(minter, tokenId2)).to.be.bignumber.equal(mintAmount2.toString())
      const tokenBatchIds = [tokenId, tokenId2];
      await this.GhostMarketERC1155.burnBatch(
        minter,
        tokenBatchIds,
        burnAmounts,
        { from: minter },
      )
      expect(await this.GhostMarketERC1155.balanceOf(minter, tokenId)).to.be.bignumber.equal((mintAmount - burnAmounts[0]).toString())
      expect(await this.GhostMarketERC1155.balanceOf(minter, tokenId2)).to.be.bignumber.equal((mintAmount2 - burnAmounts[1]).toString())
    });

    it('should revert if not-owner tries to burn a NFTs', async function () {
      const mintAmount = new BN(20);
      const mintAmount2 = new BN(30);
      const burnAmounts = [new BN(20), new BN(10)];
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "")
      const tokenId = await getLastTokenID(this.GhostMarketERC1155)
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount2, data, [], "ext_uri", "", "")
      const tokenId2 = await getLastTokenID(this.GhostMarketERC1155)
      //confirm its minted
      expect(await this.GhostMarketERC1155.balanceOf(minter, tokenId)).to.be.bignumber.equal(mintAmount.toString())
      expect(await this.GhostMarketERC1155.balanceOf(minter, tokenId2)).to.be.bignumber.equal(mintAmount2.toString())
      const tokenBatchIds = [tokenId, tokenId2];
      await expectRevert(this.GhostMarketERC1155.burnBatch(
        minter,
        tokenBatchIds,
        burnAmounts,
        { from: anotherAccount },
      ),
        "ERC1155: caller is not owner nor approved"
      );
    });
  });

  describe('mint with royalty', function () {
    it('should set royalties', async function () {
      const royaltyValue = 100
      const result = await this.GhostMarketERC1155.mintGhost(transferToAccount, mintAmount, data, [{ recipient: royaltiesAccount, value: royaltyValue }], "ext_uri", "", "");
      const tokenId = await getLastTokenID(this.GhostMarketERC1155)
      const royalties = await this.GhostMarketERC1155.getRoyalties(tokenId)
      expect(royalties.length).to.equal(1);
      expect(royalties[0].recipient).to.be.bignumber.equal(royaltiesAccount.toString());
      expect(royalties[0].value).to.be.bignumber.equal(royaltyValue.toString());
    });

    it('should mint tokens with royalty fee and address', async function () {      
      const value = 40
      const counter = parseInt((await this.GhostMarketERC1155.getCurrentCounter()).toString())
      const result = await this.GhostMarketERC1155.mintGhost(transferToAccount, mintAmount, data, [{ recipient: minter, value: value }], "ext_uri", "", "");
      const tokenId = await getLastTokenID(this.GhostMarketERC1155)
      expectEvent(result, 'TransferSingle', { operator: minter, from: ZERO_ADDRESS, to: transferToAccount, id: tokenId, value: mintAmount });
      expect(parseInt(((await this.GhostMarketERC1155.getCurrentCounter()).toString()))).to.equal(counter + 1);
      const values = await this.GhostMarketERC1155.getRoyaltiesBps(tokenId);
      const royaltyRecepient = await this.GhostMarketERC1155.getRoyaltiesRecipients(tokenId);
      expect(values.length).to.equal(1);
      expect(values[0]).to.be.bignumber.equal(value.toString());
      expect(royaltyRecepient[0]).to.be.bignumber.equal(minter.toString());
      const tokenURI = await this.GhostMarketERC1155.uri(tokenId)
      expectEvent(result, 'Minted', { toAddress: transferToAccount, tokenId: tokenId, tokenURI: tokenURI, amount: mintAmount })
    });

    it('should revert if royalty is more then 50%', async function () {
      const value = 5001
      await expectRevert(this.GhostMarketERC1155.mintGhost(transferToAccount, mintAmount, data, [{ recipient: minter, value: value }], "ext_uri", "", ""),
        "Royalties value should not be more than 50%"
      );
    });
  });

  it('everyone can mint', async function () {
    this.GhostMarketERC1155.mintGhost(transferToAccount, mintAmount, data, [], "ext_uri", "", { from: royaltiesAccount2 })
  });

  describe('mint NFT with fee', function () {
    it('should mint if setGhostmarketMintFee is set to 0', async function () {
      const value = ether('0');
      await this.GhostMarketERC1155.setGhostmarketMintFee(value)
      let feeAddressEthBalanceBefore = await web3.eth.getBalance(this.GhostMarketERC1155.address)
      this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "")
      let feeAddressEthBalanceAfter = await web3.eth.getBalance(this.GhostMarketERC1155.address)
      expect(parseInt(feeAddressEthBalanceAfter)).to.equal(parseInt(feeAddressEthBalanceBefore))
    });

    it('should send fee to contract', async function () {
      const value = ether('0.1');
      await this.GhostMarketERC1155.setGhostmarketMintFee(value)
      const feeAddressEthBalanceBefore = await web3.eth.getBalance(this.GhostMarketERC1155.address)
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "ts", { value: value });
      const feeAddressEthBalanceAfter = await web3.eth.getBalance(this.GhostMarketERC1155.address)
      console.log("feeAddress eth balance before: ", feeAddressEthBalanceBefore)
      console.log("feeAddress eth balance after: ", feeAddressEthBalanceAfter)
      expect(parseInt(feeAddressEthBalanceAfter)).to.equal(parseInt(feeAddressEthBalanceBefore) + parseInt(value))
    });

    it('should send fee to contract from another account then the contract owner', async function () {
      const value = ether('0.1');
      await this.GhostMarketERC1155.setGhostmarketMintFee(value)
      const feeAddressEthBalanceBefore = await web3.eth.getBalance(this.GhostMarketERC1155.address)
      await this.GhostMarketERC1155.mintGhost(royaltiesAccount, mintAmount, data, [], "ext_uri", "", "ts", { value: value, from: royaltiesAccount })
      const feeAddressEthBalanceAfter = await web3.eth.getBalance(this.GhostMarketERC1155.address)
      console.log("feeAddress eth balance before: ", feeAddressEthBalanceBefore)
      console.log("feeAddress eth balance after: ", feeAddressEthBalanceAfter)
      expect(parseInt(feeAddressEthBalanceAfter)).to.equal(parseInt(feeAddressEthBalanceBefore) + parseInt(value))
    });
  });

  describe('withdraw from contract', function () {
    it('should withdraw all available balance from contract', async function () {
      const value = ether('0.1');
      await this.GhostMarketERC1155.setGhostmarketMintFee(value)
      const feeAddressEthBalanceBefore = await web3.eth.getBalance(this.GhostMarketERC1155.address)
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "ts", { value: value, from: royaltiesAccount })
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "ts", { value: value, from: royaltiesAccount })
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "ts", { value: value, from: royaltiesAccount })
      const feeAddressEthBalanceAfter = await web3.eth.getBalance(this.GhostMarketERC1155.address)
      await this.GhostMarketERC1155.withdraw(feeAddressEthBalanceAfter)
      expect(await web3.eth.getBalance(this.GhostMarketERC1155.address)).to.equal('0')
    });

    it('should revert if trying to withdraw more then the contract balance', async function () {
      const value = ether('0.1');
      await this.GhostMarketERC1155.setGhostmarketMintFee(value)
      const feeAddressEthBalanceBefore = await web3.eth.getBalance(this.GhostMarketERC1155.address)
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "ts", { value: value })
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "ts", { value: value })
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "ts", { value: value })
      const feeAddressEthBalanceAfter = await web3.eth.getBalance(this.GhostMarketERC1155.address)
      await expectRevert(this.GhostMarketERC1155.withdraw(feeAddressEthBalanceAfter + value),
        "Withdraw amount should be greater then 0 and less then contract balance"
      );
    });

    it('should revert if other then the contract owner tries to withdraw', async function () {
      const value = ether('0.1');
      await this.GhostMarketERC1155.setGhostmarketMintFee(value)
      const feeAddressEthBalanceBefore = await web3.eth.getBalance(this.GhostMarketERC1155.address)
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "ts", { value: value })
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "ts", { value: value })
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", "ts", { value: value })
      const feeAddressEthBalanceAfter = await web3.eth.getBalance(this.GhostMarketERC1155.address)
      await expectRevert(this.GhostMarketERC1155.withdraw(feeAddressEthBalanceAfter, { from: royaltiesAccount }),
        "Ownable: caller is not the owner"
      );
    });

  });

  it("should mint with json string", async function () {
    await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", METADATA_JSON, "")
    const tokenId = await getLastTokenID(this.GhostMarketERC1155)
    expect(await this.GhostMarketERC1155.getMetadataJson(tokenId)).to.equal(METADATA_JSON)
  });

  describe('mint with locked content', function () {
    const mintAmount = new BN(1);
    const hiddencontent = "top secret"
    const value = ether('0.1');
    it("should set and get locked content for nft", async function () {
      await this.GhostMarketERC1155.mintGhost(transferToAccount, mintAmount, data, [], "ext_uri", "", hiddencontent)
      const tokenId = await getLastTokenID(this.GhostMarketERC1155)
      const { logs } = await this.GhostMarketERC1155.getLockedContent.sendTransaction(tokenId, { from: transferToAccount })
      expectEvent.inLogs(logs, 'LockedContentViewed', {
        msgSender: transferToAccount,
        tokenId: tokenId,
        lockedContent: hiddencontent,
      });
    });

    it("should revert if other then token owner tries to fetch locked content", async function () {
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", hiddencontent)
      const tokenId = await getLastTokenID(this.GhostMarketERC1155)
      //caller is the minter
      await this.GhostMarketERC1155.getLockedContent(tokenId)
      await expectRevert(this.GhostMarketERC1155.getLockedContent(tokenId, { from: anotherAccount }),
        "Caller must be the owner of the NFT"
      );
    });

    it("should increment locked content view count", async function () {
      const hiddencontent = "top secret"
      await this.GhostMarketERC1155.mintGhost(minter, mintAmount, data, [], "ext_uri", "", hiddencontent)
      const tokenId = await getLastTokenID(this.GhostMarketERC1155)
      const currentCounter = await this.GhostMarketERC1155.getCurrentLockedContentViewTracker(tokenId)
      // call two times the getLockedContent function, counter should increment by 2
      await this.GhostMarketERC1155.getLockedContent(tokenId)
      await this.GhostMarketERC1155.getLockedContent(tokenId)
      expect(await this.GhostMarketERC1155.getCurrentLockedContentViewTracker(tokenId)).to.be.bignumber.equal((currentCounter + 2).toString());
      //another NFT
      await this.GhostMarketERC1155.mintGhost(transferToAccount, mintAmount, data, [], "ext_uri", "", "top secret2")
      const tokenId2 = await getLastTokenID(this.GhostMarketERC1155)
      const currentCounter2 = await this.GhostMarketERC1155.getCurrentLockedContentViewTracker(tokenId2)
      await this.GhostMarketERC1155.getLockedContent(tokenId2, { from: transferToAccount })
      expect(await this.GhostMarketERC1155.getCurrentLockedContentViewTracker(tokenId2)).to.be.bignumber.equal((currentCounter2 + 1).toString());
    });
  });
});