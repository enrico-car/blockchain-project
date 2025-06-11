// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CashbackHandler} from "contracts/CashbackHandler.sol";

contract CashbackToken is ERC20, Ownable {

    mapping(address => bool) public authorizedBurners;

    modifier onlyAuthorized() {
        require(authorizedBurners[msg.sender], "Not authorized to burn");
        _;
    }

    function setBurnerAuth(address wallet, bool authorized) external onlyOwner {
        authorizedBurners[wallet] = authorized;
    }

    constructor() ERC20("CashbackToken", "CSHBK") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // TODO: Rimuovere ?? Lasciamo la possibilità agli utenti di burnare i propri token?
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    // Ricordarsi di autorizzare manualmente contratto e eventualmente l'owner
    function burn(address from, uint256 amount) external onlyAuthorized {
        _burn(from, amount);
    }

}