pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/token/ERC721/presets/ERC721PresetMinterPauserAutoIdUpgradeable.sol";

contract GhostmarketNFT is
    Initializable,
    ERC721PresetMinterPauserAutoIdUpgradeable
{
    struct Fee {
        address payable recipient;
        uint256 value;
    }

    // id => fees
    mapping(uint256 => Fee[]) public fees;

    event SecondarySaleFees(
        uint256 tokenId,
        address[] recipients,
        uint256[] bps
    );

    //name: "GhostmarketNFT" symbol: "GMNFT"
    function initialize(
        string memory name,
        string memory symbol,
        string memory uri
    ) public override initializer {
        __ERC721_init_unchained(name, symbol);
        __ERC721PresetMinterPauserAutoId_init_unchained(name, symbol, uri);
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

    function mint(
        address to,
        uint256 tokenId,
        Fee[] memory _fees
    ) public pure override {
        super._mint(to, tokenId);
        address[] memory recipients = new address[](_fees.length);
        uint256[] memory bps = new uint256[](_fees.length);
        for (uint256 i = 0; i < _fees.length; i++) {
            require(
                _fees[i].recipient != address(0x0),
                "Recipient should be present"
            );
            require(_fees[i].value != 0, "Fee value should be positive");
            fees[tokenId].push(_fees[i]);
            recipients[i] = _fees[i].recipient;
            bps[i] = _fees[i].value;
        }
        if (_fees.length > 0) {
            emit SecondarySaleFees(tokenId, recipients, bps);
        }
    }
}
