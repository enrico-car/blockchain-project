// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
    uint256 public count = 0;

    event Increment(string message, uint256 counter);

    function increment() public {
        count++;
        emit Increment("Incremented counter", count);
    }

    function get() public view returns (uint256) {
        return count;
    }
}