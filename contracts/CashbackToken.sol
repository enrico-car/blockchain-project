// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CashbackToken is ERC20, Ownable {

    mapping(address => bool) public authorizedBurners;

    modifier onlyBurnAuthorized() {     // Modifier used as AccessControlList for burn functions
        require(authorizedBurners[msg.sender], "Not authorized to burn");
        _;
    }

    function setBurnerAuth(address wallet, bool authorized) external onlyOwner {
        authorizedBurners[wallet] = authorized;
    }

    mapping(address => bool) public authorizedMinters;

    modifier onlyMintAuthorized() {     // Modifier used as AccessControlList for mint functions
        require(authorizedMinters[msg.sender], "Not authorized to mint");
        _;
    }

    function setMinterAuth(address wallet, bool authorized) external onlyOwner {
        authorizedMinters[wallet] = authorized;
    }

    constructor() ERC20("CashbackToken", "CSHBK") Ownable(msg.sender) {}

    // Note: Remember to manually set auth to TransactionManager
    function mint(address to, uint256 amount) external onlyMintAuthorized {
        _mint(to, amount);
    }

    // TODO: Rimuovere ?? Lasciamo la possibilità agli utenti di burnare i propri token?
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    // Note: Remember to manually set auth to CashbackHandler
    function burn(address from, uint256 amount) external onlyBurnAuthorized {
        _burn(from, amount);
    }

}

// TODO: Aggiungiamo altri eventi??