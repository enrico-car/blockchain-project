// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {CashbackToken} from "../tokens/CashbackToken.sol";

contract CashbackHandlerUpgradable is Initializable, UUPSUpgradeable, OwnableUpgradeable {

    CashbackToken public cashbackToken;
    uint256 public constant MIN_CASHBACK_AMOUNT = 100 * 10 ** 18;

    event CashbackRedeemed(address indexed user, uint256 amount);

    function initialize(address cashbackTokenAddress) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        cashbackToken = CashbackToken(cashbackTokenAddress);
    }

    function redeemCashback() external {
        // Check if contract is allowed to spend
        require(cashbackToken.allowance(msg.sender, address(this)) >= MIN_CASHBACK_AMOUNT, 
            string.concat("Contract must be approved to spend at least 100 ", cashbackToken.symbol()));

        // Check if the caller has enough token
        require(cashbackToken.balanceOf(msg.sender) >= MIN_CASHBACK_AMOUNT, 
            string.concat("You must have at least 100 ", cashbackToken.symbol(), " to redeem a cashback"));

        // Transfer the tokens to the contract
        cashbackToken.transferFrom(msg.sender, address(this), MIN_CASHBACK_AMOUNT);

        // Burn contract's tokens
        cashbackToken.burn(address(this), MIN_CASHBACK_AMOUNT);

        // Emit event
        emit CashbackRedeemed(msg.sender, MIN_CASHBACK_AMOUNT);
    }

    fallback() external {}

    // Only the owner can authorize upgrades
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
