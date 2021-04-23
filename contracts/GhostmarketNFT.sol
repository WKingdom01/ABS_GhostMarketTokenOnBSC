// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/token/ERC721/presets/ERC721PresetMinterPauserAutoIdUpgradeable.sol";
import "./LibAttribute.sol";

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

    function initialize(
        string memory name,
        string memory symbol,
        string memory uri
    ) public override initializer {
        __ERC721_init_unchained(name, symbol);
        __ERC721PresetMinterPauserAutoId_init_unchained(name, symbol, uri);
    }

    /**
     * @dev saves the nft tokens custom attributes to contract storage
     * emits AttributesSet event
     */
    function setAttributes(
        uint256 _tokenId,
        AttributesStruct[] memory _attributes
    ) public {
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
    function saveFees(uint256 _tokenId, Fee[] memory _fees) public {
        for (uint256 i = 0; i < _fees.length; i++) {
            require(
                _fees[i].recipient != address(0x0),
                "Recipient should be present"
            );
            require(_fees[i].value != 0, "Fee value should be positive");
            fees[_tokenId].push(_fees[i]);
        }
    }

    /**
     * @dev change the recepient address of the "secondary sales"/royalities fee
     */
    function updateAccount(
        uint256 _tokenId,
        address _from,
        address _to
    ) public {
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
        uint256 _tokenId,
        Fee[] memory _fees
    ) public {
        super._mint(_to, _tokenId);
        address[] memory recipients = new address[](_fees.length);
        uint256[] memory bps = new uint256[](_fees.length);
        saveFees(_tokenId, _fees);
        if (_fees.length > 0) {
            emit SecondarySaleFees(_tokenId, recipients, bps);
        }
    }
}
