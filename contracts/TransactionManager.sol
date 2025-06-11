// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CashbackToken} from "./CashbackToken.sol";
import {InventoryManager} from "./Inventory.sol";

contract TransactionManager is Ownable {

    InventoryManager public inventoryManager;
    CashbackToken public cashbackToken;

    constructor (address inventoryManagerAddress, address cashbackTokenAddress) Ownable(msg.sender) {
        inventoryManager = InventoryManager(inventoryManagerAddress);
        cashbackToken = CashbackToken(cashbackTokenAddress);
    }

    struct Transaction {
        address from;
        address to;
        uint256[] lotIds;
        uint256[] quantities;
        uint256 timestamp;
        bytes32 detailsHash;
    }

    // Transaction[] pendingTransactions;
    mapping (address => mapping (address => Transaction[])) public pendingTransactions;

    address[] public senders;
    mapping (address => address[]) public sendersToReceivers;           // sender --> [receivers], "wallets in realtion with sender"
    mapping (address => mapping(address => bool)) public hasRelation;   // sender --> (receiver --> bool), "exist relation sender --> receiver?"

    // TODO: Overload senza to, usabile per vendere verso cliente finale (che quindi non ha un suo wallet) ??
    function propseTransaction(address to, uint256[] calldata lotIds, uint256[] calldata quantities) external {

        require(lotIds.length == quantities.length, "Arrays size must match");  // Check if arrays' size match

        address from = msg.sender;
        inventoryManager.hasSufficientInventory(from, lotIds, quantities);      // Check quantities and lot existence (revert if not) 

        Transaction memory t = Transaction(from, to, lotIds, quantities, block.timestamp, keccak256(abi.encode(lotIds, quantities, block.timestamp)));
        pendingTransactions[from][to].push(t);          // Add transaction

        if (!hasRelation[from][to]) {                   // If no previous realtion
            sendersToReceivers[from].push(to);              // Add sender --> receiver realtion
            if (sendersToReceivers[from].length == 1) {     // If first relation sender --> x
                senders.push(from);                             // Add sender to the senders
            }
            hasRelation[from][to] = true;                   // Set hasRelation flag
        }  

    }

    function reviewTransaction(address from, bytes32 detailsHash, bool review) external {

        Transaction memory t;
        address to = msg.sender;        // Set variable "to" equal to the sender of function caller
        
        if (!hasRelation[from][to]){            // Check if there is at least one transaction sender --> receiver
            revert("Transaction not found!");
        }

        uint256 index;
        for (uint256 i = 0; i < pendingTransactions[from][to].length; i++) {    // Search for transaction

            if (detailsHash == pendingTransactions[from][to][i].detailsHash){
                t = pendingTransactions[from][to][i];
                index = i;
                break;
            }

        }

        if (t.detailsHash == bytes32(0)) {  // Check if transaction was found
            revert("Transaction not found!");
        }

        pendingTransactions[from][to][index] = pendingTransactions[from][to][pendingTransactions[from][to].length -1];
        pendingTransactions[from][to].pop();        // Remove pending transaction and shrink

        if (pendingTransactions[from][to].length == 0){     // Update data structures used for iterating
            hasRelation[from][to] = false;

            removeAddressFromArray(sendersToReceivers[from], to);

            if (sendersToReceivers[from].length == 0) {
                removeAddressFromArray(senders, from);
            }
        }

        if (review) {       // If transaction has been accepted
            
            for (uint256 i; i < t.lotIds.length ; i++)      // Update inventories of sender and receiver
            {
                inventoryManager.removeFromInventory(t.from, t.lotIds[i], t.quantities[i]);
                inventoryManager.addToInventory(t.to, t.lotIds[i], t.quantities[i]);
            }
            
            // Note: Remember to manually set minting auth to this contract
            cashbackToken.mint(t.from, 1*10**18);           // Mint reward tokens
            cashbackToken.mint(t.to, 1*10**18);

        }

    }

    function removeAddressFromArray(address[] storage array, address target) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == target) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }

}

// TODO: Aggiungiamo degli eventi?? 