// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/utils/Strings.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ProductManager} from "./ProductManager.sol";

contract InventoryManager is Ownable {

    ProductManager public productManager;

    constructor (address productManagerAddress) Ownable(msg.sender) {
        productManager = ProductManager(productManagerAddress);
    }

    mapping(address => bool) public transactionManager;

    modifier onlyTransactionManager() {     // Modifier used as AccessControlList for functions
        require(transactionManager[msg.sender], "Not authorized to use this function");
        _;
    }

    function setTransactionManager(address wallet, bool authorized) external onlyOwner {
        transactionManager[wallet] = authorized;
    }

    mapping(address => bool) public manufacturerUsers;

    modifier onlyManufacturer() {     // Modifier used as AccessControlList for functions
        require(manufacturerUsers[msg.sender], "Only the manufacturer is allowed to use this function");
        _;
    }

    function setManufacturerAuth(address wallet, bool authorized) external onlyOwner {
        manufacturerUsers[wallet] = authorized;
    }

    event AddedToManufacturerInventory ( address indexed manufacturer, uint256 indexed lotId, uint256 quantity );

    mapping (address => mapping(uint256 => uint256)) inventory;     // Wallet --> ( lot_id --> qty )
    mapping (address => uint256[]) ownedLots;                       // Wallet --> lista lotti in suo possesso

    function addToInventory(address account, uint256 lotId, uint256 quantity) external onlyTransactionManager {

        // Note: quanity >= 0 is checked by default, since we are using uint
        productManager.getLot(lotId);       // Check if lot exists, otherwise getLot will revert

        if (inventory[account][lotId] == 0){        // If i don't own any unit of the product, i also need to add it to ownedLots
            ownedLots[account].push(lotId);
        }
        inventory[account][lotId] += quantity;      // Increase account's quantity

    }

    // Function used only from the manufacturer to add products to its own inventory
    function addToManufacturerInventory(uint256 lotId) external onlyManufacturer {

        ProductManager.LotDetails memory lotDetails = productManager.getLot(lotId);       // Check if lot exists, otherwise getLot will revert

        require(lotDetails.hasBeenProduced == false, "Lot has already been produced");      // Check if lot has been already produced

        if (inventory[msg.sender][lotId] == 0){        // If i don't own any unit of the product, i also need to add it to ownedLots
            ownedLots[msg.sender].push(lotId);
        }
        inventory[msg.sender][lotId] += lotDetails.totalQuantity;      // Increase account's quantity

        productManager.markLotAsProduced(lotId);

        emit AddedToManufacturerInventory(msg.sender, lotId, lotDetails.totalQuantity);

    }

    function removeFromInventory(address account, uint256 lotId, uint256 quantity) external onlyTransactionManager {

        productManager.getLot(lotId);       // Check if lot exists, otherwise getLot will revert
        require(inventory[account][lotId] >= quantity, string.concat("Quantity (", Strings.toString(quantity) ,
            ") is bigger than the amount in inventory (", Strings.toString(inventory[account][lotId]), ")"));   // Check if account has enough units

        inventory[account][lotId] -= quantity;      // Decrease account's quantity

        if (inventory[account][lotId] == 0){         // If i don't own any unit anymore, i also remove it from ownedLots and shrink it
            for (uint256 i = 0; i < ownedLots[account].length; i++) {
                if (ownedLots[account][i] == lotId){
                    ownedLots[account][i] = ownedLots[account][ownedLots[account].length - 1];
                    ownedLots[account].pop();
                    return; 
                }
            }
        }

    }

    function getInventory(address account) external view onlyTransactionManager returns (uint256[] memory lotIds, uint256[] memory quantities) {

        uint256[] memory lots = ownedLots[account];
        uint256 length = lots.length;

        quantities = new uint256[](length);
        for (uint256 i = 0; i < length; i++){
            quantities[i] = inventory[account][lots[i]];
        }

        return (lots, quantities);
        
    }

    function getMyInventory() external view returns (uint256[] memory lotIds, uint256[] memory quantities) {

        uint256[] memory lots = ownedLots[msg.sender];
        uint256 length = lots.length;

        quantities = new uint256[](length);
        for (uint256 i = 0; i < length; i++){
            quantities[i] = inventory[msg.sender][lots[i]];
        }

        return (lots, quantities);
        
    }

    function hasSufficientInventory(address account, uint256[] calldata lotIds, uint256[] calldata quantities) external view {

        require((lotIds.length == quantities.length), "Arrays size must match");    // Check if arrays' length are equals

        for (uint256 i = 0; i < lotIds.length; i++) {

            productManager.getLot(lotIds[i]);       // Check if lot exists, otherwise getLot will revert
            if (inventory[account][lotIds[i]] < quantities[i]) {                    // Check if account has enough units
                revert(string.concat("Quantity for lot ", Strings.toString(lotIds[i]), 
                    " (", Strings.toString(quantities[i]) ,") is bigger than the amount in inventory (",
                    Strings.toString(inventory[account][lotIds[i]]), ")"));
            }
        }

        // In case of problems, the function will revert

    }


}

/* TODO: 
    Aggiungere controlli di sicurezza: Chi può chiamare le funzioni? Metterei solo il contratto che gestisce le transazioni 
        + tecnici/produttore (per eventuali problemi)

    ACL per hasSufficientInventory ?? Solo authorized anche qui?? 
        Potremmo usarla per calcolare l'inventario di un'altro soggetto, rendendo vano l'onlyTransactionManager su getInventory
*/ 