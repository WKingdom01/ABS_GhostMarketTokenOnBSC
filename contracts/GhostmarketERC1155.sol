// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "./ERC1155PresetMinterPauserUpgradeableCustom.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @dev ERC1155 token with minting, burning, pause, royalties & lock content functions.
 */

contract GhostMarketERC1155 is Initializable, ERC1155PresetMinterPauserUpgradeable, ReentrancyGuardUpgradeable, OwnableUpgradeable {
	string public name;
	string public symbol;

	// struct for royalties fees
	struct Royalty {
		address payable recipient;
		uint256 value;
	}

	// tokenId => attributes array
	mapping(uint256 => string) internal _metadataJson;

	// tokenId => royalties array
	mapping(uint256 => Royalty[]) internal _royalties;

	// tokenId => locked content array
	mapping(uint256 => string) internal _lockedContent;

	// tokenId => locked content view counter array
	mapping(uint256 => uint256) internal _lockedContentViewTracker;

	// events
	event RoyaltiesFeesSet(uint256 tokenId, address[] recipients, uint256[] bps);
	event LockedContentViewed(address msgSender, uint256 tokenId, string lockedContent);
	event AttributesSet(uint256 tokenId, string metadataJson);
	event MintFeesWithdrawn(address feeWithdrawer, uint256 withdrawAmount);
	event MintFeesChanged(uint256 newValue);
	event MintFeesPaid(address sender, uint256 value);
	event Minted(address toAddress, uint256 tokenId, string tokenURI, uint256 amount);

    // mint fees balance
	uint256 internal _payedMintFeesBalance;

	// mint fees value
	uint256 internal _ghostmarketMintFees;

	function initialize(string memory _name, string memory _symbol, string memory uri)
        public
        virtual
        initializer
    {
		__ERC1155_init_unchained(uri);
		__ERC1155PresetMinterPauser_init_unchained(uri);
		__Ownable_init_unchained();
		name = _name;
		symbol = _symbol;
	}

	using CountersUpgradeable for CountersUpgradeable.Counter;

	// _tokenIdTracker to gnerate automated token IDs
	CountersUpgradeable.Counter private _tokenIdTracker;

	/**
	 * @dev set a NFT custom attributes to contract storage
	 * emits AttributesSet event
	 */
	function _setMetadataJson(uint256 tokenId, string memory metadataJson)
        internal
    {
		_metadataJson[tokenId] = metadataJson;
		emit AttributesSet(tokenId, metadataJson);
	}

	/**
	 * @dev increment a NFT locked content view tracker
	 */
	function _incrementCurrentLockedContentViewTracker(uint256 tokenId)
        internal
    {
		_lockedContentViewTracker[tokenId] = _lockedContentViewTracker[tokenId] + 1;
	}

    /**
	 * @dev set a NFT royalties fees & recipients
	 * fee basis points 10000 = 100%
	 * emits RoyaltiesFeesSet event if set
	 */
	function _saveRoyalties(uint256 tokenId, Royalty[] memory royalties)
        internal
    {
		for (uint256 i = 0; i < royalties.length; i++) {
			require(royalties[i].recipient != address(0x0), "Recipient should be present");
			require(royalties[i].value > 0, "Royalties value should be positive");
			_royalties[tokenId].push(royalties[i]);
			address[] memory recipients = new address[](royalties.length);
			uint256[] memory bps = new uint256[](royalties.length);
			emit RoyaltiesFeesSet(tokenId, recipients, bps);
		}
	}

	/**
	 * @dev set a NFT locked content as string
	 */
	function _setLockedContent(uint256 tokenId, string memory content)
        internal
    {
		_lockedContent[tokenId] = content;
	}

	/**
	 * @dev check mint fees sent to contract
	 * emits MintFeesPaid event if set
	 */
	function _checkMintFees()
        internal
    {
		if (_ghostmarketMintFees > 0) {
			require(msg.value == _ghostmarketMintFees, "Wrong fees value sent to GhostMarket for mint fees");
		}
		if (msg.value > 0) {
			_payedMintFeesBalance += msg.value;
			emit MintFeesPaid(msg.sender, msg.value);
		}
	}

	/**
	 * @dev mint NFT, set royalties, set metadata json, set lockedcontent
	 * emits Minted event
	 */
	function mintGhost(address to, uint256 amount, bytes memory data, Royalty[] memory royalties, string memory metadata, string memory lockedcontent)
        external
        payable
        nonReentrant
    {
		super.mint(to, _tokenIdTracker.current(), amount, data);
		//_setTokenURI(_tokenIdTracker.current(), _tokenIdTracker.current());
		if (royalties.length > 0) {
			_saveRoyalties(_tokenIdTracker.current(), royalties);
		}
		if (keccak256(abi.encodePacked(metadata)) != keccak256(abi.encodePacked(""))) {
			_setMetadataJson(_tokenIdTracker.current(), metadata);
		}
		if (keccak256(abi.encodePacked(lockedcontent)) != keccak256(abi.encodePacked(""))) {
			_setLockedContent(_tokenIdTracker.current(), lockedcontent);
		}
		_checkMintFees();
		emit Minted(to, _tokenIdTracker.current(), uri(_tokenIdTracker.current()), amount);
		_tokenIdTracker.increment();
	}

	/**
	 * @dev withdraw contract balance
	 * emits MintFeesWithdrawn event
	 */
	function withdraw(uint256 withdrawAmount)
        external
        onlyOwner
    {
		require(withdrawAmount > 0 && withdrawAmount <= _payedMintFeesBalance, "Withdraw amount should be greater then 0 and less then contract balance");
		_payedMintFeesBalance -= withdrawAmount;
		(bool success, ) = msg.sender.call{value: withdrawAmount}("");
		require(success, "Transfer failed.");
		emit MintFeesWithdrawn(msg.sender, withdrawAmount);
	}

    /**
	 * @dev sets Ghostmarket mint fees as uint256
	 * emits MintFeesChanged event
	 */
	function setGhostmarketMintFee(uint256 gmmf)
        external
    {
		require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Caller must have admin role to set mint fees");
		_ghostmarketMintFees = gmmf;
		emit MintFeesChanged(_ghostmarketMintFees);
	}

	/**
	 * @return get Ghostmarket mint fees
	 */
	function getGhostmarketMintFees()
        external
        view
        returns (uint256)
    {
		return _ghostmarketMintFees;
	}

	/**
	 * @dev get locked content for a NFT
	 * emits LockedContentViewed event
	 */
	function getLockedContent(address from, uint256 tokenId)
        external
    {
		require(from == _msgSender(), "Caller must be the owner of the NFT");
		_incrementCurrentLockedContentViewTracker(tokenId);
		emit LockedContentViewed(msg.sender, tokenId, _lockedContent[tokenId]);
	}

	/**
	 * @dev get a NFT current locked content view tracker
	 */
	function getCurrentLockedContentViewTracker(uint256 tokenId)
        external
        view
        returns (uint256)
    {
		return _lockedContentViewTracker[tokenId];
	}

	/**
	 * @dev get a NFT custom attributes
	 */
	function getMetadataJson(uint256 tokenId)
        external
        view
        returns (string memory)
    {
		return _metadataJson[tokenId];
	}

	/**
	 * @dev get a NFT royalties recipients
	 */
	function getRoyaltiesRecipients(uint256 tokenId)
        external
        view
        returns (address payable[] memory)
    {
		Royalty[] memory royalties = _royalties[tokenId];
		address payable[] memory result = new address payable[](royalties.length);
		for (uint256 i = 0; i < royalties.length; i++) {
			result[i] = royalties[i].recipient;
		}
		return result;
	}

	/**
	 * @dev get a NFT royalties fees
	 * fee basis points 10000 = 100%
	 */
	function getRoyaltiesBps(uint256 tokenId)
        external
        view
        returns (uint256[] memory)
    {
		Royalty[] memory royalties = _royalties[tokenId];
		uint256[] memory result = new uint256[](royalties.length);
		for (uint256 i = 0; i < royalties.length; i++) {
			result[i] = royalties[i].value;
		}
		return result;
	}

	/**
	 * @dev current _tokenIdTracker
	 */
	function getCurrentCounter() external view returns (uint256) {
		return _tokenIdTracker.current();
	}

	/**
	 * @dev get last minted token id /  _tokenIdTracker
	 */
	function getLastTokenID() external view returns (uint256) {
		if (_tokenIdTracker.current() == 0) {
			return _tokenIdTracker.current();
		} else return _tokenIdTracker.current() - 1;
	}
}
