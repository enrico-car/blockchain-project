// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
    uint256 public count = 0;

    function increment() public {
        count++;
    }

    function get() public view returns (uint256) {
        return count;
    }
}