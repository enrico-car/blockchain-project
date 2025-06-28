// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ProductManager is Ownable {

    mapping(address => bool) public authorizedUsers;

    modifier onlyAuthorized() {                  // Modifier used as AccessControlList
        require(authorizedUsers[msg.sender], "Not authorized to use this function");
        _;
    }

    function setUserAuth(address wallet, bool authorized) external onlyOwner {
        authorizedUsers[wallet] = authorized;
    }

    mapping(address => bool) public inventoryManager;

    modifier onlyInventoryManager() {                  // Modifier used as AccessControlList
        require(inventoryManager[msg.sender], "Not authorized to use this function");
        _;
    }

    function setInventoryManager(address wallet, bool authorized) external onlyOwner {
        inventoryManager[wallet] = authorized;
    }

    struct DPP {

        string productIdentification;
        string materials;
        // TODO: Aggiungere altri dati del DPP

    }

    mapping (uint256 => DPP) public products;
    uint256[] public productsIds;

    constructor () Ownable(msg.sender) {}

    event ProductCreated ( uint256 indexed productId, DPP dpp );
    event ProductRemoved ( uint256 indexed productId );
    event LotCreated ( uint256 indexed lotId, uint256 indexed productId, LotDetails lotdetails );
    event LotRemoved ( uint256 indexed lotId );
    
    function createProduct (uint256 productId, DPP calldata dpp) external onlyAuthorized {

        require(bytes(products[productId].productIdentification).length == 0, "Product already exists");    // Check if product already exists
        products[productId] = dpp;      // Add the new product
        productsIds.push(productId);

        emit ProductCreated(productId, dpp);

    }

    function removeProduct (uint256 productId) external onlyAuthorized {

        delete products[productId];     // Remove DPP struct
        for (uint256 i = 0; i < productsIds.length; i++) {     // Remove product id, shrink array
            if (productsIds[i] == productId){
                productsIds[i] = productsIds[productsIds.length - 1];
                productsIds.pop();

                emit ProductRemoved(productId);
                return; 
            }
        }
        
        revert("Product not found");    // Reverts if product doesnt exist

    }

    function getProduct (uint256 productId) external view returns (DPP memory) {

        require(bytes(products[productId].productIdentification).length != 0, "Product does not exists");   // Check if product exists
        return products[productId];

    }

    function getAllProducts () external view returns (uint256[] memory, DPP[] memory) {

        DPP[] memory retProducts = new DPP[](productsIds.length);
        for (uint256 i = 0; i < productsIds.length; i++) {  
            retProducts[i] = products[productsIds[i]];
        }
        return (productsIds, retProducts);

    }

    struct LotDetails {

        string timestamp;
        string expirationDate;
        uint256 totalQuantity;
        uint256 unitPrice;      // Note: 2 decimal points (es: unitPrice = 1000 means 10 $)
        uint256 productId;
        bool hasBeenProduced;   // Indicates if the lot has been physically produced by the manufacturer

    }

    mapping (uint256 => LotDetails) public lots;
    uint256[] public lotsIds;

    function createLot(uint256 lotId, string calldata timestamp, string calldata expirationDate, uint256 totalQuantity, uint256 unitPrice, uint256 productId) external onlyAuthorized {

        require(bytes(lots[lotId].expirationDate).length == 0, "Lot already exists");   // Check if lot already exists
        require(bytes(products[productId].productIdentification).length != 0, "Product does not exists"); // Check if product exists

        LotDetails memory lotDetails  = LotDetails({                      // Create new lot
            timestamp: timestamp,
            expirationDate: expirationDate,
            totalQuantity: totalQuantity,
            unitPrice: unitPrice,
            productId: productId,
            hasBeenProduced: false
        });

        lots[lotId] = lotDetails;
        
        lotsIds.push(lotId);

        emit LotCreated(lotId, productId, lotDetails);

    }

    function removeLot (uint256 lotId) external onlyAuthorized {
        
        delete lots[lotId];     // Remove LotDetials struct
        for (uint256 i = 0; i < lotsIds.length; i++) {     // Remove lot id, shrink array
            if (lotsIds[i] == lotId){
                lotsIds[i] = lotsIds[lotsIds.length - 1];
                lotsIds.pop();

                emit LotRemoved(lotId);
                return; 
            }
        }
        
        revert("Lot not found");    // Reverts if lot doesnt exist

    }

    function getLot (uint256 lotId) external view returns (LotDetails memory) {

        require(bytes(lots[lotId].expirationDate).length != 0, "Lot does not exists");  // Check if lot exists
        return lots[lotId];

    }

    function getAllLots () external view returns (uint256[] memory, LotDetails[] memory) {

        LotDetails[] memory retLots = new LotDetails[](lotsIds.length);
        for (uint256 i = 0; i < lotsIds.length; i++) {  
            retLots[i] = lots[lotsIds[i]];
        }
        return (lotsIds, retLots);

    }

    //TODO: 
    function MarkLotAsProduced (uint256 lotId) external onlyInventoryManager {

        require(bytes(lots[lotId].expirationDate).length != 0, "Lot does not exist");
        require(!lots[lotId].hasBeenProduced, "Lot already marked as produced");

        lots[lotId].hasBeenProduced = true;

    }

}

/* TODO: 
    Controllare parte di sicurezza: Chi può chiamare le funzioni ?? Lasciamo la lettura pubblica ??  
*/

