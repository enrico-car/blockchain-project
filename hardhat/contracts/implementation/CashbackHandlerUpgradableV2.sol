// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/utils/Strings.sol";
import "./CashbackHandlerUpgradable.sol";

contract CashbackHandlerUpgradableV2 is CashbackHandlerUpgradable {

    uint256 internal constant _MIN_CASHBACK_AMOUNT = 100 * 10 ** 18;

    function version() external pure returns (string memory) {
        return "V2";
    }

    function redeemCashback (uint256 amount) external {

        // Check if amount is higher than the minimum amount allowed
        require(amount >= MIN_CASHBACK_AMOUNT, 
            string.concat("Amount must be higher than ", Strings.toString(MIN_CASHBACK_AMOUNT)));

        // Check if amount is a multiple of MIN_CASHBACK_AMOUNT
        require(amount % MIN_CASHBACK_AMOUNT == 0, 
            string.concat("Amount must be a multiple of ", Strings.toString(MIN_CASHBACK_AMOUNT)));

        // Check if contract is allowed to spend
        require(cashbackToken.allowance(msg.sender, address(this)) >= amount, 
            string.concat("Contract must be approved to spend at least ", Strings.toString(amount) , " ", cashbackToken.symbol()));

        // Cjheck if the caller has enough token
        require(cashbackToken.balanceOf(msg.sender) >= amount, 
            string.concat("You must have at least ", Strings.toString(amount) , " ", cashbackToken.symbol(), " to redeem a cashback"));

        // Transfer the tokens to the contract
        cashbackToken.transferFrom(msg.sender, address(this), amount);

        // Burn contract's tokens
        cashbackToken.burn(address(this), amount);

        // Emit event
        emit CashbackRedeemed(msg.sender, amount);

    }
    
}
