// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/presets/ERC1155PresetMinterPauserUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

/**
 * @dev ERC1155 token with minting, burning, pause, secondary sales royalitiy functions.
 *
 */

contract GhostmarketERC1155 is
    Initializable,
    ERC1155PresetMinterPauserUpgradeable
{
    string public name;
    string public symbol;

    //nft attributes struct
    struct AttributesStruct {
        string key;
        string value;
    }

    // tokenId => attributes array
    mapping(uint256 => AttributesStruct[]) public attribute;

    event AttributesSet(uint256 tokenId, AttributesStruct[] attributes);

    function initialize(
        string memory _name,
        string memory _symbol,
        string memory uri
    ) public virtual initializer {
        __ERC1155_init_unchained(uri);
        __ERC1155PresetMinterPauser_init_unchained(uri);
        name = _name;
        symbol = _symbol;
    }

    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _tokenIdTracker;

    function mint(
        address to,
        uint256 amount,
        bytes memory data
    ) public virtual {
        super.mint(to, _tokenIdTracker.current(), amount, data);
        _tokenIdTracker.increment();
    }

    function mintBatch(
        address to,
        uint256[] memory mintAmounts,
        bytes memory data
    ) public virtual {
        super.mintBatch(to, _getTokenBatchIds(mintAmounts.length), mintAmounts, data);
    }

    function getCurrentCounter() public view returns (uint256) {
        return _tokenIdTracker.current();
    }

    function _getTokenBatchIds(uint256 mintAmountsLenght)
        internal
        returns (uint256[] memory)
    {
        uint256[] memory ids = new uint256[](mintAmountsLenght);
        //uint256[mintAmounts] memory ids;
        for (uint256 i = 0; i < mintAmountsLenght; i++) {
            _tokenIdTracker.increment();
            ids[i] = getCurrentCounter();
            //_tokenIdTracker.increment();
        }
        return ids;
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
}
