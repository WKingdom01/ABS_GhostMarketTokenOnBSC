pragma solidity ^0.8.3;

import "../contracts/GhostmarketNFT.sol";

contract TestableGhostmarketNFT is GhostmarketNFT {

    function test_saveFees(uint256 _id, Fee[] memory _fees) external {
        saveFees(_id, _fees);
    }

    function test_updateAccount(
        uint256 _id,
        address _from,
        address _to
    ) external {
        updateAccount(_id, _from, _to);
    }
}
