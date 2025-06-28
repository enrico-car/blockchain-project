// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {CashbackToken} from "contracts/tokens/CashbackToken.sol";

contract CashbackHandler {
    
    CashbackToken public cashbackToken;

    constructor (address cashbackTokenAddress) {
        cashbackToken = CashbackToken(cashbackTokenAddress);
    }

    event CashbackRedeemed ( address indexed user, uint256 amount );

    uint256 public constant MIN_CASHBACK_AMOUNT = 100 * 10**18;

    // Magari possiamo lasciare questo come base e avere una nuova versione parametrica, 
    //      da usare come esempio di implementazione V2 da mostrare con il Proxy
    function redeemCashback () external {

        // Check if contract is allowed to spend
        require(cashbackToken.allowance(msg.sender, address(this)) >= MIN_CASHBACK_AMOUNT, 
            string.concat("Contract must be approved to spend at least 100 ", cashbackToken.symbol()));

        // Cjheck if the caller has enough token
        require(cashbackToken.balanceOf(msg.sender) >= MIN_CASHBACK_AMOUNT, 
            string.concat("You must have at least 100 ", cashbackToken.symbol(), " to redeem a cashback"));

        // Transfer the tokens to the contract
        cashbackToken.transferFrom(msg.sender, address(this), MIN_CASHBACK_AMOUNT);

        // Burn contract's tokens
        cashbackToken.burn(address(this), MIN_CASHBACK_AMOUNT);

        // Emit event
        emit CashbackRedeemed(msg.sender, MIN_CASHBACK_AMOUNT);

    }

}

/*

    Workflow:
    1 - Deploy CashbackToken
    2 - Deploy CashbackHandler, using the CashbackToken address as parameter in the constructor
    3 - Call setBurnerAuth, using the CashbackHandler address as parameter, allowing the contract to burn tokens
    4 - Mint some tokens (es: 1000000000000000000000000)
    5 - Approve contract to spend some tokens (es: 100000000000000000000)
    6 - Call redeem_cashback

*/