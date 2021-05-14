// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "./ERC721PresetMinterPauserAutoIdUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @dev ERC721 token with minting, burning, pause, royalties & lock content functions.
 */
contract GhostMarketERC721 is
    Initializable,
    ERC721PresetMinterPauserAutoIdUpgradeable,
    ReentrancyGuardUpgradeable
{
    // struct for royalties fees
    struct Royalty {
        address payable recipient;
        uint256 value;
    }

    // tokenId => attributes array
    mapping(uint256 => string) private _metadataJson;

    // tokenId => royalties array
    mapping(uint256 => Royalty[]) public royalties;

    // tokenId => locked content string
    mapping(uint256 => string) public _lockedContent;

    // tokenId => locked content view counter
    mapping(uint256 => uint256) private _lockedContentViewTracker;

    // events
    event RoyaltiesFeesSet(uint256 tokenId, address[] recipients, uint256[] bps);
    event LockedContentViewed(address msgSender, uint256 tokenId, string lockedContent);
    event AttributesSet(uint256 tokenId, string metadataJson);
    event MintFeesChanged(uint256 newValue);
    event MintFeesPaid(address sender, uint256 value);
    event Minted(address toAddress, uint256 tokenId, string tokenURI);

    // minting fee
    uint256 private _ghostmarketMintingFee;

    function initialize(
        string memory name,
        string memory symbol,
        string memory uri
    ) public override initializer {
        __ERC721_init_unchained(name, symbol);
        __ERC721PresetMinterPauserAutoId_init_unchained(uri);
    }

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
     * @dev get a NFT custom attributes
     */
    function getMetadataJson(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        return _metadataJson[tokenId];
    }

    /**
     * @dev get a NFT royalties recipients
     */
    function getRoyaltiesRecipients(uint256 _tokenId)
        public
        view
        returns (address payable[] memory)
    {
        Royalty[] memory _royalties = royalties[_tokenId];
        address payable[] memory result = new address payable[](_royalties.length);
        for (uint256 i = 0; i < _royalties.length; i++) {
            result[i] = _royalties[i].recipient;
        }
        return result;
    }

    /**
     * @dev get a NFT royalties fees
     * fee basis points 10000 = 100%
     */
    function getRoyaltiesBps(uint256 _tokenId)
        public
        view
        returns (uint256[] memory)
    {
        Royalty[] memory _royalties = royalties[_tokenId];
        uint256[] memory result = new uint256[](_royalties.length);
        for (uint256 i = 0; i < _royalties.length; i++) {
            result[i] = _royalties[i].value;
        }
        return result;
    }

    /**
     * @dev set a NFT royalties fees & recipients
     * fee basis points 10000 = 100%
     */
    function saveRoyalties(uint256 _tokenId, Royalty[] memory _royalties) internal {
        require(
            _exists(_tokenId),
            "ERC721: approved query for nonexistent token"
        );
        for (uint256 i = 0; i < _royalties.length; i++) {
            require(
                _royalties[i].recipient != address(0x0),
                "Recipient should be present"
            );
            require(_royalties[i].value > 0, "Royalties value should be positive");
            royalties[_tokenId].push(_royalties[i]);
        }
    }

    /**
     * @dev mint NFT, set royalties, save metadata json, set lockedcontent
     * emits RoyaltiesFeesSet event if set
     * emits Minted event
     */
    function mintGhost(
        address _to,
        Royalty[] memory _royalties,
        string memory metadata,
        string memory lockedcontent
    ) public payable nonReentrant {
        mint(_to);
        uint256 _tokenId = getLastTokenID();
        address[] memory recipients = new address[](_royalties.length);
        uint256[] memory bps = new uint256[](_royalties.length);
        if (_royalties.length > 0) {
            saveRoyalties(_tokenId, _royalties);
            emit RoyaltiesFeesSet(_tokenId, recipients, bps);
        }
        if (
            keccak256(abi.encodePacked(metadata)) !=
            keccak256(abi.encodePacked(""))
        ) {
            _setMetadataJson(_tokenId, metadata);
        }
        if (
            keccak256(abi.encodePacked(lockedcontent)) !=
            keccak256(abi.encodePacked(""))
        ) {
            setLockedContent(_tokenId, lockedcontent);
        }
        if (_ghostmarketMintingFee > 0) {
            _sendMintingFee();
        }
        emit Minted(_to, _tokenId, tokenURI(_tokenId));
    }

    /**
     * @dev send minting fee to contract
     * emits MintFeesPaid event
     */
    function _sendMintingFee() internal {
        require(
            _ghostmarketMintingFee > 0,
            "Ghostmarket minting fee should be greater then 0"
        );
        /* _ghostmarketFeeAddress.transfer(_ghostmarketMintingFee); */
        // (bool success, ) = _ghostmarketFeeAddress.call{value: _ghostmarketMintingFee}("");
        // require(success, "Transfer failed.");
        // emit MintFeesPaid(msg.sender, _ghostmarketMintingFee); // chg to real value
    }

    /**
     * @dev sets Ghostmarket mint fees
     * emits MintFeesChanged event
     */
    function setGhostmarketMintFee(uint256 gmmf) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "Caller must have admin role to set minting fee percent"
        );
        _ghostmarketMintingFee = gmmf;
        emit MintFeesChanged(_ghostmarketMintingFee);
    }

    /**
     * @return get Ghostmarket mint fees
     */
    function ghostmarketMintingFee() public view returns (uint256) {
        return _ghostmarketMintingFee;
    }

    /**
     * @dev set a NFT locked content as string
     */
    function setLockedContent(uint256 _tokenId, string memory content)
        internal
    {
        _lockedContent[_tokenId] = content;
    }

    /**
     * @dev get locked content for a NFT - can be retreived only by emitting an event
     * emits LockedContentViewed event
     *
     * example event:
     * msgSender: 0x1a1122c2483e8f988F9a800F3A6eE316dB77e4e0 (type: address),
     * tokenId: 0 (type: uint256),
     * lockedContent: 'top secret' (type: string)
     */
    function getLockedContent(uint256 _tokenId) public {
        require(
            ownerOf(_tokenId) == msg.sender,
            "Caller must be the owner of the NFT"
        );
        _incrementCurrentLockedContentViewTracker(_tokenId);
        emit LockedContentViewed(
            msg.sender,
            _tokenId,
            _lockedContent[_tokenId]
        );
    }

    /**
     * @dev increment a NFT locked content view tracker
     */
    function _incrementCurrentLockedContentViewTracker(uint256 _tokenId)
        private
    {
        _lockedContentViewTracker[_tokenId] =
            _lockedContentViewTracker[_tokenId] +
            1;
    }

    /**
     * @dev get a NFT current locked content view tracker
     */
    function getCurrentLockedContentViewTracker(uint256 _tokenId)
        public
        view
        returns (uint256)
    {
        return _lockedContentViewTracker[_tokenId];
    }

    /**
     * @dev bulk burn NFT
     */
    function burnBulk(uint256[] memory _tokens) public {
        for (uint256 i = 0; i < _tokens.length; i++) {
            require(
                ownerOf(_tokens[i]) == msg.sender,
                "Caller must be the owner of the NFT"
            );
            super._burn(_tokens[i]);
        }
    }
}
