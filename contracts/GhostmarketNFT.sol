// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/token/ERC721/presets/ERC721PresetMinterPauserAutoIdUpgradeable.sol";

/**
 * @dev ERC721 token with minting, burning, pause, secondary sales royalitiy functions.
 *
 */
contract GhostmarketNFT is
    Initializable,
    ERC721PresetMinterPauserAutoIdUpgradeable
{
    // struct for secondary sales fees
    struct Fee {
        address payable recipient;
        uint256 value;
    }

    //nft attributes struct
    struct AttributesStruct {
        string key;
        string value;
    }

    // tokenId => attributes array
    mapping(uint256 => AttributesStruct[]) public attribute;

    // tokenId => fees array
    mapping(uint256 => Fee[]) public fees;

    event SecondarySaleFees(
        uint256 tokenId,
        address[] recipients,
        uint256[] bps
    );

    event AttributesSet(uint256 tokenId, AttributesStruct[] attributes);
    event GhostmarketFeeAddressChanged(address newValue);
    event GhostmarketFeeMultiplierChanged(uint256 newValue);
    event GhostmarketMintFeeChanged(uint256 newValue);
    event GhostmarketFeePaid(address sender, uint256 value);

    // fee multiplier
    uint256 public ghostmarketFeeMultiplier;

    // minting fee
    uint256 public ghostmarketMintingFee;

    //address where the transfer fees will be sent
    address payable public ghostmarketFeeAddress;

    //Reentrancy
    bool locked;

    function initialize(
        string memory name,
        string memory symbol,
        string memory uri
    ) public override initializer {
        __ERC721_init_unchained(name, symbol);
        __ERC721PresetMinterPauserAutoId_init_unchained(name, symbol, uri);
        locked = false;
    }

    /**
     * @dev saves the nft tokens custom attributes to contract storage
     * emits AttributesSet event
     */
    function setAttributes(
        uint256 _tokenId,
        AttributesStruct[] memory _attributes
    ) internal {
        for (uint256 i = 0; i < _attributes.length; i++) {
            require(
                keccak256(abi.encodePacked(_attributes[i].key)) !=
                    keccak256(abi.encodePacked("")),
                "Attribute key should not be empty"
            );
            require(
                keccak256(abi.encodePacked(_attributes[i].value)) !=
                    keccak256(abi.encodePacked("")),
                "Attribute value should not be empty"
            );
            attribute[_tokenId].push(_attributes[i]);
            emit AttributesSet(_tokenId, _attributes);
        }
    }

    /**
     * @dev get the nft token attributes with the tokenId
     */
    function getAttributes(uint256 _tokenId)
        public
        view
        returns (AttributesStruct[] memory)
    {
        return attribute[_tokenId];
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
     * @dev get the "secondary sales"/royalities fee basis points 10000 = 100% with the tokenId
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
     * @dev save the "secondary sales"/royalities fee for the nft
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
     * @dev change the "secondary sales"/royalities fee value for a specific recipient address
     */
    function updateRecipientsFees(
        uint256 _tokenId,
        address _from,
        uint256 _value
    ) external {
        require(
            hasRole(MINTER_ROLE, _msgSender()),
            "updating fee value is not allowed by this account"
        );
        require(_value > 0, "new Fee value should be positive");
        Fee[] memory _fees = fees[_tokenId];
        for (uint256 i = 0; i < _fees.length; i++) {
            if (fees[_tokenId][i].recipient == _from) {
                fees[_tokenId][i].value = _value;
            }
        }
    }

    /**
     * @dev change the recepient address of the "secondary sales"/royalities fee
     */
    function updateFeeAccount(
        uint256 _tokenId,
        address _from,
        address _to
    ) external {
        require(
            hasRole(MINTER_ROLE, _msgSender()),
            "updating fee recepients is not allowed by this account"
        );
        uint256 length = fees[_tokenId].length;
        for (uint256 i = 0; i < length; i++) {
            if (fees[_tokenId][i].recipient == _from) {
                fees[_tokenId][i].recipient = payable(address(uint160(_to)));
            }
        }
    }

    /**
     * @dev mint NFT and set fee
     */
    function mint(
        address _to,
        Fee[] memory _fees,
        AttributesStruct[] memory _attributes
    ) public {
        mint(_to);
        uint256 _tokenId = (getCurrentCounter() - 1);
        address[] memory recipients = new address[](_fees.length);
        uint256[] memory bps = new uint256[](_fees.length);
        if (_fees.length > 0) {
            saveFees(_tokenId, _fees);
            emit SecondarySaleFees(_tokenId, recipients, bps);
        }
        if (_attributes.length > 0) {
            setAttributes(_tokenId, _attributes);
        }
    }

    function sendMintingFee() internal {
        require(!locked, "Reentrant detected!");

        locked = true;
        uint256 feevalue = _calculateGhostmarketMintingFee();
        (bool success, bytes memory transactionBytes) = ghostmarketFeeAddress.call{value: feevalue}("");
        
        require(success, "Transfer failed.");
        locked = false;

        emit GhostmarketFeePaid(msg.sender, feevalue);
    }

    function mintWithFee(
        address _to,
        Fee[] memory _fees,
        AttributesStruct[] memory _attributes
    ) external {
        require(
            ghostmarketFeeAddress != address(0),
            "Ghostmarket minting Fee Address not set"
        );
        if (ghostmarketFeeMultiplier > 0) {
            sendMintingFee();
        }

        mint(_to, _fees, _attributes);
    }

    /**
     * @dev set the wallet address where fees will be collected
     */
    function setGhostmarketFeeAddress(address payable _ghostmarketFeeAddress)
        public
    {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "Caller must have admin role to set minting fee address"
        );

        ghostmarketFeeAddress = _ghostmarketFeeAddress;
        emit GhostmarketFeeAddressChanged(ghostmarketFeeAddress);
    }

    /**
     * @dev sets the transfer fee multiplier
     */
    function setGhostmarketFeeMultiplier(uint256 _ghostmarketFeeMultiplier)
        public
    {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "Caller must have admin role to set minting fee percent"
        );
        ghostmarketFeeMultiplier = _ghostmarketFeeMultiplier;
        emit GhostmarketFeeMultiplierChanged(ghostmarketFeeMultiplier);
    }

    /**
     * @dev sets the transfer fee multiplier
     */
    function setGhostmarketMintFee(uint256 _ghostmarketMintingFee) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "Caller must have admin role to set minting fee percent"
        );
        ghostmarketMintingFee = _ghostmarketMintingFee;
        emit GhostmarketMintFeeChanged(ghostmarketMintingFee);
    }

    function _calculateGhostmarketMintingFee() internal view returns (uint256) {
        return ghostmarketMintingFee * ghostmarketFeeMultiplier;
    }
}
