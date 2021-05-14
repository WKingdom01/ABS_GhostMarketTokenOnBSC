// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "./ERC721PresetMinterPauserAutoIdUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @dev ERC721 token with minting, burning, pause, secondary sales royalitiy functions.
 *
 */
contract GhostmarketERC721 is
    Initializable,
    ERC721PresetMinterPauserAutoIdUpgradeable,
    ReentrancyGuardUpgradeable
{
    // struct for secondary sales fees
    struct Fee {
        address payable recipient;
        uint256 value;
    }

    // tokenId => attributes array
    mapping(uint256 => string) private _metadataJson;

    // tokenId => fees array
    mapping(uint256 => Fee[]) public fees;

    // tokenId => locked content string
    mapping(uint256 => string) public _lockedContent;
    // tokenId => locked content view counter
    mapping(uint256 => uint256) private _lockedContentViewTracker;

    event SecondarySaleFees(
        uint256 tokenId,
        address[] recipients,
        uint256[] bps
    );

    event LockedContentViewed(
        address msgSender,
        uint256 tokenId,
        string lockedContent
    );

    event AttributesSet(uint256 tokenId, string metadataJson);
    event GhostmarketFeeAddressChanged(address newValue);
    event GhostmarketMintFeeChanged(uint256 newValue);
    event GhostmarketFeePaid(address sender, uint256 value);
    event Minted(address toAddress, uint256 tokenId, string tokenURI);

    // minting fee
    uint256 private _ghostmarketMintingFee;

    //address where the transfer fees will be sent
    address payable private _ghostmarketFeeAddress;

    function initialize(
        string memory name,
        string memory symbol,
        string memory uri
    ) public override initializer {
        __ERC721_init_unchained(name, symbol);
        __ERC721PresetMinterPauserAutoId_init_unchained(uri);
    }

    /**
     * @dev saves the nft tokens custom attributes to contract storage
     * emits AttributesSet event
     */
    function _setMetadataJson(uint256 tokenId, string memory metadataJson)
        internal
    {
        _metadataJson[tokenId] = metadataJson;
        emit AttributesSet(tokenId, metadataJson);
    }

    /**
     * @dev get the nft token attributes with the tokenId
     */
    function getMetadataJson(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        return _metadataJson[tokenId];
    }

    /**
     * @dev get the "secondary sales"/royalities fee recepients with the tokenId
     */
    function getFeeRecipients(uint256 _tokenId)
        public
        view
        returns (address payable[] memory)
    {
        Fee[] memory _fees = fees[_tokenId];
        address payable[] memory result = new address payable[](_fees.length);
        for (uint256 i = 0; i < _fees.length; i++) {
            result[i] = _fees[i].recipient;
        }
        return result;
    }

    /**
     * @dev get the "secondary sales"/royalities fee for the NFT id
     * fee basis points 10000 = 100%
     */
    function getFeeBps(uint256 _tokenId)
        public
        view
        returns (uint256[] memory)
    {
        Fee[] memory _fees = fees[_tokenId];
        uint256[] memory result = new uint256[](_fees.length);
        for (uint256 i = 0; i < _fees.length; i++) {
            result[i] = _fees[i].value;
        }
        return result;
    }

    /**
     * @dev save the "secondary sales"/royalities fee for the NFT id
     * fee basis points 10000 = 100%
     */
    function saveFees(uint256 _tokenId, Fee[] memory _fees) internal {
        require(
            _exists(_tokenId),
            "ERC721: approved query for nonexistent token"
        );
        for (uint256 i = 0; i < _fees.length; i++) {
            require(
                _fees[i].recipient != address(0x0),
                "Recipient should be present"
            );
            require(_fees[i].value > 0, "Fee value should be positive");
            fees[_tokenId].push(_fees[i]);
        }
    }

    /**
     * @dev mint NFT and set fee, save metadata json, set lockedcontent
     */
    function mintGhost(
        address _to,
        Fee[] memory _fees,
        string memory metadata,
        string memory lockedcontent
    ) public payable nonReentrant {
        mint(_to);
        uint256 _tokenId = getLastTokenID();
        address[] memory recipients = new address[](_fees.length);
        uint256[] memory bps = new uint256[](_fees.length);
        if (_fees.length > 0) {
            saveFees(_tokenId, _fees);
            emit SecondarySaleFees(_tokenId, recipients, bps);
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
     * @dev send minting fee to Ghostmarket
     */
    function _sendMintingFee() internal {
        require(
            _ghostmarketFeeAddress != address(0),
            "Ghostmarket minting Fee Address not set"
        );
        require(
            _ghostmarketMintingFee > 0,
            "Ghostmarket minting fee should be greater then 0"
        );
        /* _ghostmarketFeeAddress.transfer(_ghostmarketMintingFee); */
        (bool success, ) = _ghostmarketFeeAddress.call{value: _ghostmarketMintingFee}("");
        require(success, "Transfer failed.");
        emit GhostmarketFeePaid(msg.sender, _ghostmarketMintingFee);
    }

    /**
     * @dev set the wallet address where fees will be collected
     */
    function setGhostmarketFeeAddress(address payable gmfa) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "Caller must have admin role to set minting fee address"
        );
        _ghostmarketFeeAddress = gmfa;
        emit GhostmarketFeeAddressChanged(_ghostmarketFeeAddress);
    }



    /**
     * @dev sets the transfer fee
     */
    function setGhostmarketMintFee(uint256 gmmf) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "Caller must have admin role to set minting fee percent"
        );
        _ghostmarketMintingFee = gmmf;
        emit GhostmarketMintFeeChanged(_ghostmarketMintingFee);
    }

    /**
     * @return the ghostmarketFeeAddress
     */
    function ghostmarketFeeAddress() public view returns (address payable) {
        return _ghostmarketFeeAddress;
    }

    /**
     * @return the ghostmarketMintingFee.
     */
    function ghostmarketMintingFee() public view returns (uint256) {
        return _ghostmarketMintingFee;
    }

    /**
     * @dev save locked content as string for a specific _tokenId.
     */
    function setLockedContent(uint256 _tokenId, string memory content)
        internal
    {
        _lockedContent[_tokenId] = content;
    }

    /**
     * @dev locked content for a NFT can be retrived only by emitting an event
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
     * @dev increment locked content view tracker
     */
    function _incrementCurrentLockedContentViewTracker(uint256 _tokenId)
        private
    {
        _lockedContentViewTracker[_tokenId] =
            _lockedContentViewTracker[_tokenId] +
            1;
    }

    /**
     * @dev get the durrent locked content view tracker for specific _tokenId
     */
    function getCurrentLockedContentViewTracker(uint256 _tokenId)
        public
        view
        returns (uint256)
    {
        return _lockedContentViewTracker[_tokenId];
    }
}
