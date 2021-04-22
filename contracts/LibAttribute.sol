pragma solidity 0.8.3;

library LibAttribute {
    bytes32 public constant TYPE_HASH =
        keccak256("Attribute(uint256 attribute,uint256 value)");

    struct Part {
        uint256 attribute;
        uint256 value;
    }

    function hash(Part memory part) internal pure returns (bytes32) {
        return keccak256(abi.encode(TYPE_HASH, part.attribute, part.value));
    }
}
