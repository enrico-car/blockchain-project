// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ProductManager} from "./ProductManager.sol";

contract InventoryManager is Ownable {

    ProductManager public productManager;

    constructor (address productManagerAddress) Ownable(msg.sender) {
        productManager = ProductManager(productManagerAddress);
    }

    mapping(address => bool) public authorizedUsers;

    modifier onlyAuthorized() {
        require(authorizedUsers[msg.sender], "Not authorized to use this function");
        _;
    }

    function setUserAuth(address wallet, bool authorized) external onlyOwner {
        authorizedUsers[wallet] = authorized;
    }

    mapping (address => mapping(uint256 => uint256)) inventory;     // Wallet --> ( lot_id --> qty )
    mapping (address => uint256[]) ownedLots;                       // Wallet --> lista lotti in suo possesso

    function addToInventory(address account, uint256 lotId, uint256 quantity) external onlyAuthorized {

        // Note: quanity >= 0 is checked by default, since we are using uint
        require(productManager.getLot(lotId).totalQuantity != 0, "Lot doesn't exist");

        if (inventory[account][lotId] == 0){        // If i don't own any unit of the product, i also need to add it to ownedLots
            ownedLots[account].push(lotId);
        }
        inventory[account][lotId] += quantity;

    }

    function removeFromInventory(address account, uint256 lotId, uint256 quantity) external onlyAuthorized {

        require(productManager.getLot(lotId).totalQuantity != 0, "Lot doesn't exist");
        require(inventory[account][lotId] >= quantity, "Quantity is bigger than the amount in inventory");

        inventory[account][lotId] -= quantity;

        if(inventory[account][lotId] == 0){         // If i don't own any unit anymore, i also remove it from ownedLots
            for (uint256 i = 0; i < ownedLots[account].length; i++) {
                if (ownedLots[account][i] == lotId){
                    ownedLots[account][i] = ownedLots[account][ownedLots[account].length - 1];
                    ownedLots[account].pop();
                    return; 
                }
            }
        }

    }

    function getInventory(address account) external view onlyAuthorized returns (uint256[] memory lotIds, uint256[] memory quantities) {

        uint256[] memory lots = ownedLots[account];
        uint256 length = lots.length;

        quantities = new uint256[](length);
        for (uint256 i = 0; i < length; i++){
            quantities[i] = inventory[account][lots[i]];
        }

        return (lots, quantities);
        
    }


}

/* TODO: 
    Aggiungere controlli di sicurezza: Chi può chiamare le funzioni? Metterei solo il contratto che gestisce le transazioni 
        + tecnici/produttore (per eventuali problemi)
*/ 