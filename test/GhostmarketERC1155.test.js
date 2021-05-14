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

  it.only("should have token uri " + my_constants._t_c.BASE_URI, async function () {
    const tokenID = await this.GhostmarketERC1155.getLastTokenID()
    console.log("baseURI: ", await this.GhostmarketERC1155.baseURI())
    expect(await this.GhostmarketERC1155.baseURI()).to.equal(my_constants._t_c.BASE_URI);
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

  it.only("should have base uri + token uri ", async function () {
    const mintAmount = new BN(2);
    const data = '0x987654321';
    await this.GhostmarketERC1155.mintGhost(minter, mintAmount, data, [], "")
    const tokenId = new BN(parseInt(await this.GhostmarketERC1155.getLastTokenID()))
    console.log("uri: ",await this.GhostmarketERC1155.uri(tokenId))
    expect(await this.GhostmarketERC1155.uri(tokenId)).to.equal(my_constants._t_c.BASE_URI + tokenId);
  });



  it('should mint tokens with royalty fee', async function () {
    
    const mintAmount = new BN(2);
    const data = '0x987654321';
    const value = 88
    const counter = parseInt((await this.GhostmarketERC1155.getCurrentCounter()).toString())

    const receipt = await this.GhostmarketERC1155.mintGhost(transferToAccount, mintAmount, data, [{ recipient: minter, value: value }], "");
    const tokenID = await this.GhostmarketERC1155.getLastTokenID()
    expectEvent(receipt, 'TransferSingle', { operator: minter, from: ZERO_ADDRESS, to: transferToAccount, id: tokenId, value: mintAmount });
    expect(parseInt(((await this.GhostmarketERC1155.getCurrentCounter()).toString()))).to.equal(counter + 1);

    const values = await this.GhostmarketERC1155.getRoyaltyFeeBps(tokenId);
    expect(values.length).to.equal(1);
    expect(values[0]).to.be.bignumber.equal(value.toString());
    const tokenURI = await this.GhostmarketERC1155.uri(tokenID)
    expectEvent(result, 'Minted', { toAddress: minter, tokenId: tokenId, tokenURI: tokenURI, amount: mintAmount })
  });

  it('should mint tokens as batch with royalty fee', async function () {
    const mintAmounts = [new BN(5000), new BN(10000), new BN(42195)];
    const royalities = [{ recipient: royalitiesAccount, value: 50 }, { recipient: royalitiesAccount2, value: 100 }, { recipient: royalitiesAccount2, value: 30 }]
    const data = '0x987654321';
    const currentCounter = parseInt(await this.GhostmarketERC1155.getCurrentCounter())
    console.log("currentCounter: ", currentCounter)
    console.log("royalities array length: ", royalities.length)

    const receipt = await this.GhostmarketERC1155.mintBatch(
      transferToAccount,
      mintAmounts,
      data,
      royalities,
      { from: minter }
    )
    expectEvent(receipt, 'TransferBatch', { operator: minter, from: ZERO_ADDRESS, to: transferToAccount });
    const calclastTokenID = currentCounter + royalities.length - 1
    console.log("calclastTokenID: ", calclastTokenID)
    console.log("getLastTokenID: ", await this.GhostmarketERC1155.getLastTokenID())
    expect(await this.GhostmarketERC1155.getLastTokenID()).to.be.bignumber.equal((calclastTokenID).toString());
    for (i = currentCounter; i <= calclastTokenID; i++) {
      console.log("token ID: ", i)
      if (royalities[i]) {
        expect(parseInt(await this.GhostmarketERC1155.getRoyaltyFeeBps(i))).to.equal(royalities[i - currentCounter].value)
      }
    }
  });

  it('should revert with error: Fees array lenght should be less than or equal to mintAmounts array lenght', async function () {
    const mintAmounts = [new BN(5000), new BN(10000), new BN(42195)];
    const royalities = [{ recipient: royalitiesAccount, value: 50 }, { recipient: royalitiesAccount2, value: 100 }, { recipient: royalitiesAccount2, value: 30 }, { recipient: royalitiesAccount2, value: 1100 }]
    const data = '0x987654321';
    const currentCounter = parseInt(await this.GhostmarketERC1155.getCurrentCounter())
    console.log("currentCounter: ", currentCounter)
    console.log("royalities array length: ", royalities.length)

    await expectRevert(
      this.GhostmarketERC1155.mintBatch(
        transferToAccount,
        mintAmounts,
        data,
        royalities,
        { from: minter }
      ),
      'Fees array lenght should be less than or equal to mintAmounts array lenght'
    );
  });



  it('deployer can mint tokens WITHOUT royalitiy fees and attributes', async function () {
    const mintAmounts = [new BN(5000), new BN(10000), new BN(42195)];
    const royalities = []
    const data = '0x987654321';
    const currentCounter = parseInt(await this.GhostmarketERC1155.getCurrentCounter())
    console.log("currentCounter: ", currentCounter)
    console.log("royalities array length: ", royalities.length)

    const receipt = await this.GhostmarketERC1155.mintBatch(
      transferToAccount,
      mintAmounts,
      data,
      royalities,
      { from: minter }
    )
    expectEvent(receipt, 'TransferBatch', { operator: minter, from: ZERO_ADDRESS, to: transferToAccount });
    const calclastTokenID = currentCounter + mintAmounts.length - 1
    console.log("calclastTokenID: ", calclastTokenID)
    console.log("getLastTokenID: ", await this.GhostmarketERC1155.getLastTokenID())
    expect(await this.GhostmarketERC1155.getLastTokenID()).to.be.bignumber.equal((calclastTokenID).toString());
  });

  it('should throw ERC1155PresetMinterPauser: must have minter role to mint', async function () {
    const mintAmount = new BN(2);
    const data = '0x987654321';
    await expectRevert(
      this.GhostmarketERC1155.mintGhost(transferToAccount, mintAmount, data, [], "", { from: royalitiesAccount2 }),
      'ERC1155PresetMinterPauser: must have minter role to mint'
    );
  });
  describe('royalities', function () {
    const mintAmount = new BN(2);
    const data = '0x987654321';
    const value = 88

    it("should update royalities/secondary-sales fee recipient", async function () {

      console.log("old recipients account: ", royalitiesAccount)
      console.log("new recipients account: ", royalitiesAccount2)

      await this.GhostmarketERC1155.mintGhost(minter, mintAmount, data, [{ recipient: royalitiesAccount, value: value }], "");
      const tokenId = (await this.GhostmarketERC1155.getLastTokenID()).toString()
      console.log("getLastTokenID: ", tokenId)

      const recipients = await this.GhostmarketERC1155.getRoyalitiesRecipients(tokenId)
      expect(recipients[0]).to.equal(royalitiesAccount)

      const receipt = await this.GhostmarketERC1155.updateRoyalitiesAccount(tokenId, royalitiesAccount, royalitiesAccount2)
      expectEvent(receipt, 'RoyalitiesAccountChanged', { tokenId: tokenId, from: royalitiesAccount, to: royalitiesAccount2 });

      const recipients2 = await this.GhostmarketERC1155.getRoyalitiesRecipients(tokenId)
      expect(recipients2.length).to.equal(1)
      expect(recipients2[0]).to.equal(royalitiesAccount2)
    });

    it("should update royalities/secondary-sales fee value", async function () {
      const newFeeValue = new BN(66)
      await this.GhostmarketERC1155.mintGhost(minter, mintAmount, data, [{ recipient: royalitiesAccount, value: value }], "");
      const tokenId = (await this.GhostmarketERC1155.getLastTokenID()).toString()
      console.log("getLastTokenID: ", tokenId)

      const receipt = await this.GhostmarketERC1155.updateRoyalitiesFeeValue(tokenId, royalitiesAccount, newFeeValue);
      expectEvent(receipt, 'RoyalitiesFeeValueChanged', { tokenId: tokenId, value: newFeeValue });

      const values = await this.GhostmarketERC1155.getRoyaltyFeeBps(tokenId);
      expect(values.length).to.equal(1);
      console.log("new fee value: ", values[0])
      expect(values[0]).to.be.bignumber.equal((newFeeValue).toString());
    });
  });

  describe('mint NFT with fee', function () {
    const mintAmount = new BN(2);
    const data = '0x987654321';
    it('should revert if minting fee is zero', async function () {

      const value = ether('0');
      await this.GhostmarketERC1155.setGhostmarketFeeAddress(mintingFeeAccount)
      await this.GhostmarketERC1155.setGhostmarketFeeMultiplier(1)
      await this.GhostmarketERC1155.setGhostmarketMintFee(value)
      await expectRevert(
        this.GhostmarketERC1155.mintGhost(minter, mintAmount, data, [], ""),
        'Ghostmarket minting Fee is zero'
      );
    });

    it('should requires a minting fee address that is not 0x0', async function () {

      const value = ether('0.1');
      await this.GhostmarketERC1155.setGhostmarketFeeAddress(ZERO_ADDRESS)
      await this.GhostmarketERC1155.setGhostmarketFeeMultiplier(1)
      await this.GhostmarketERC1155.setGhostmarketMintFee(value)
      await expectRevert(
        this.GhostmarketERC1155.mintGhost(minter, mintAmount, data, [], ""),
        'Ghostmarket minting Fee Address not set'
      );
    });

    it.only('should accept payments', async function () {
      const royalities = [{ recipient: royalitiesAccount, value: 50 }]
      const ghostmarketFeeMultiplier = 1
      const value = ether('0.1');
      console.log("value: ", value)
      await this.GhostmarketERC1155.setGhostmarketFeeAddress(mintingFeeAccount)
      await this.GhostmarketERC1155.setGhostmarketFeeMultiplier(ghostmarketFeeMultiplier)
      await this.GhostmarketERC1155.setGhostmarketMintFee(value)
      let feeAddressEthBalanceBefore = await web3.eth.getBalance(mintingFeeAccount)

      console.log("ghostmarketFeeMultiplier: ", await this.GhostmarketERC1155.ghostmarketFeeMultiplier())
      console.log("ghostmarketMintingFee: ", await this.GhostmarketERC1155.ghostmarketMintingFee())
      console.log("ghostmarketFeeAddress: ", await this.GhostmarketERC1155.ghostmarketFeeAddress())
      await this.GhostmarketERC1155.mintGhost(minter, mintAmount, data, [], "ts", { value: value });
      let feeAddressEthBalanceAfter = await web3.eth.getBalance(mintingFeeAccount)
      console.log("feeAddress eth balance before: ", feeAddressEthBalanceBefore)
      console.log("feeAddress eth balance after: ", feeAddressEthBalanceAfter)
      expect(parseInt(feeAddressEthBalanceAfter)).to.equal(parseInt(feeAddressEthBalanceBefore) + (parseInt(value) / (ghostmarketFeeMultiplier * parseInt(mintAmount))))
    });
  });

  describe('batch mint NFT with fee', function () {
    it('should accept payments', async function () {
      const mintAmounts = [new BN(5000), new BN(10000), new BN(42195)];
      const data = '0x987654321';
      const royalities = []
      const ghostmarketFeeMultiplier = 1
      const value = ether('0.1');
      await this.GhostmarketERC1155.setGhostmarketFeeAddress(mintingFeeAccount)
      await this.GhostmarketERC1155.setGhostmarketFeeMultiplier(ghostmarketFeeMultiplier)
      await this.GhostmarketERC1155.setGhostmarketMintFee(value)
      let feeAddressEthBalanceBefore = await web3.eth.getBalance(mintingFeeAccount)

      console.log("ghostmarketFeeMultiplier: ", (await this.GhostmarketERC1155.ghostmarketFeeMultiplier()).toString())
      console.log("ghostmarketMintingFee: ", (await this.GhostmarketERC1155.ghostmarketMintingFee()).toString())
      console.log("ghostmarketFeeAddress: ", await this.GhostmarketERC1155.ghostmarketFeeAddress())

      await this.GhostmarketERC1155.mintBatch(
        transferToAccount,
        mintAmounts,
        data,
        royalities,
        { value: value }
      )
      const calculateTotalMintAmount = await this.GhostmarketERC1155.calculateTotalMintAmount(mintAmounts)
      console.log("calculateTotalMintAmount: ", calculateTotalMintAmount.toString())
      let feeAddressEthBalanceAfter = await web3.eth.getBalance(mintingFeeAccount)
      console.log("feeAddress eth balance before: ", feeAddressEthBalanceBefore)
      console.log("feeAddress eth balance after: ", feeAddressEthBalanceAfter)
      expect(parseInt(feeAddressEthBalanceAfter)).to.equal(parseInt(feeAddressEthBalanceBefore) + (parseInt(value) / (ghostmarketFeeMultiplier * parseInt(calculateTotalMintAmount))))
    });
  });

  describe('mint with locked content', function () {
    const mintAmount = new BN(1);
    const hiddencontent = "top secret"
    const data = '0x987654321';
    const value = ether('0.1');
    it("should set and get locked content for nft", async function () {

      await this.GhostmarketERC1155.mintGhost(transferToAccount, mintAmount, data, [], hiddencontent)
      const tokenId = new BN(parseInt(await this.GhostmarketERC1155.getLastTokenID()))

      const { logs } = await this.GhostmarketERC1155.getLockedContent.sendTransaction(transferToAccount, tokenId, { from: transferToAccount })

      expectEvent.inLogs(logs, 'LockedContentViewed', {
        msgSender: transferToAccount,
        tokenId: tokenId,
        lockedContent: hiddencontent,
      });
    });

    it("should revert if other then token owner tries to fetch locked content", async function () {
      await this.GhostmarketERC1155.mintGhost(transferToAccount, mintAmount, data, [], hiddencontent)
      const tokenId = new BN(parseInt(await this.GhostmarketERC1155.getLastTokenID()))

      await expectRevert(this.GhostmarketERC1155.getLockedContent(transferToAccount, tokenId),
        "caller is not owner nor approved to get locked content"
      );
    });

    it("should increment locked content view count", async function () {
      const hiddencontent = "top secret"
      await this.GhostmarketERC1155.mintGhost(minter, mintAmount, data, [], hiddencontent)
      const tokenId = new BN(parseInt(await this.GhostmarketERC1155.getLastTokenID()))

      const currentCounter = await this.GhostmarketERC1155.getCurrentLockedContentViewTracker(tokenId)
      // call two times the getLockedContent function, counter should increment by 2
      await this.GhostmarketERC1155.getLockedContent(minter, tokenId)
      await this.GhostmarketERC1155.getLockedContent(minter, tokenId)
      expect(await this.GhostmarketERC1155.getCurrentLockedContentViewTracker(tokenId)).to.be.bignumber.equal((currentCounter + 2).toString());

      //another NFT
      await this.GhostmarketERC1155.mintGhost(transferToAccount, mintAmount, data, [], "top secret2")
      const tokenId2 = new BN(parseInt(await this.GhostmarketERC1155.getLastTokenID()))
      const currentCounter2 = await this.GhostmarketERC1155.getCurrentLockedContentViewTracker(tokenId2)
      await this.GhostmarketERC1155.getLockedContent(transferToAccount, tokenId2, { from: transferToAccount })
      expect(await this.GhostmarketERC1155.getCurrentLockedContentViewTracker(tokenId2)).to.be.bignumber.equal((currentCounter2 + 1).toString());


    });
  });
});