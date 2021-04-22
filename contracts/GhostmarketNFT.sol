pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/token/ERC721/presets/ERC721PresetMinterPauserAutoIdUpgradeable.sol";
import "./LibAttribute.sol";

contract GhostmarketNFT is
    Initializable,
    ERC721PresetMinterPauserAutoIdUpgradeable
{
    struct Fee {
        address payable recipient;
        uint256 value;
    }

    struct AttributesStruct {
        string key;
        string value;
    }

    // tokenId => attributes
    mapping(uint256 => AttributesStruct[]) public attribute;

    // token id => fees
    mapping(uint256 => Fee[]) public fees;

    event SecondarySaleFees(
        uint256 tokenId,
        address[] recipients,
        uint256[] bps
    );
    event AttributesSet(uint256 tokenId, AttributesStruct[] attributes);

    //name: "GhostmarketNFT" symbol: "GMNFT"
    function initialize(
        string memory name,
        string memory symbol,
        string memory uri
    ) public override initializer {
        __ERC721_init_unchained(name, symbol);
        __ERC721PresetMinterPauserAutoId_init_unchained(name, symbol, uri);
    }

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

    function getAttributes(uint256 _token_id) public returns (string[] memory) {
        AttributesStruct[] memory _attributes = attribute[_token_id];
        string[] memory result = new string[](_attributes.length);
        for (uint256 i = 0; i < _attributes.length; i++) {
            result[i] = _attributes[i].value;
        }
        return result;
        //return _attributes;
    }

    function getFeeRecipients(uint256 id)
        public
        view
        returns (address payable[] memory)
    {
        Fee[] memory _fees = fees[id];
        address payable[] memory result = new address payable[](_fees.length);
        for (uint256 i = 0; i < _fees.length; i++) {
            result[i] = _fees[i].recipient;
        }
        return result;
    }

    function getFeeBps(uint256 id) public view returns (uint256[] memory) {
        Fee[] memory _fees = fees[id];
        uint256[] memory result = new uint256[](_fees.length);
        for (uint256 i = 0; i < _fees.length; i++) {
            result[i] = _fees[i].value;
        }
        return result;
    }

    function saveFees(uint256 _id, Fee[] memory _fees) public {
        for (uint256 i = 0; i < _fees.length; i++) {
            require(
                _fees[i].recipient != address(0x0),
                "Recipient should be present"
            );
            require(_fees[i].value != 0, "Fee value should be positive");
            fees[_id].push(_fees[i]);
        }
    }

    function updateAccount(
        uint256 _id,
        address _from,
        address _to
    ) public {
        uint256 length = fees[_id].length;
        for (uint256 i = 0; i < length; i++) {
            if (fees[_id][i].recipient == _from) {
                fees[_id][i].recipient = payable(address(uint160(_to)));
            }
        }
    }

    function mint(
        address to,
        uint256 tokenId,
        Fee[] memory _fees
    ) public {
        super._mint(to, tokenId);
        address[] memory recipients = new address[](_fees.length);
        uint256[] memory bps = new uint256[](_fees.length);
        saveFees(tokenId, _fees);
        if (_fees.length > 0) {
            emit SecondarySaleFees(tokenId, recipients, bps);
        }
    }

    /*     function saveAttribute(uint256 tokenId, Atrribute721Data memory data)
        public
    {
        LibAttribute.Part[] storage attributes = attributes[data.tokenId];
        //todo check sum is 10000
        for (uint256 i = 0; i < data.attributes.length; i++) {
            attributes.push(data.attributes[i]);
        }
    } */
}
