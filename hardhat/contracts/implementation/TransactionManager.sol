// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CashbackToken} from "../tokens/CashbackToken.sol";
import {ProductManager} from "./ProductManager.sol";
import {InventoryManager} from "./InventoryManager.sol";

contract TransactionManager is Ownable {

    ProductManager public productManager;
    InventoryManager public inventoryManager;
    CashbackToken public cashbackToken;

    constructor (address productManagerAddress, address inventoryManagerAddress, address cashbackTokenAddress) Ownable(msg.sender) {
        productManager = ProductManager(productManagerAddress);
        inventoryManager = InventoryManager(inventoryManagerAddress);
        cashbackToken = CashbackToken(cashbackTokenAddress);
    }

    event AddedTransaction(address indexed from, address indexed to, bytes32 indexed detailsHash, Transaction);
    event AcceptedTransaction(address indexed from, address indexed to, bytes32 indexed detailsHash, Transaction);
    event RejectedTransaction(address indexed from, address indexed to, bytes32 indexed detailsHash, Transaction);
    event RemovedTransaction(address indexed from, address indexed to, bytes32 indexed detailsHash, Transaction);
    event SaleToCustomer(address indexed pharmacy, uint256[] lotIds, uint256[] quantities, uint256 totalValue);

    mapping(address => bool) public manufacturerUsers;

    modifier onlyManufactuer() {                  // Modifier used as AccessControlList
        require(manufacturerUsers[msg.sender], "Not authorized to use this function");
        _;
    }

    function setManufacturerAuth(address wallet, bool authorized) external onlyOwner {
        manufacturerUsers[wallet] = authorized;
    }

    mapping(address => bool) public pharmacyUsers;

    modifier onlyPharmacy() {     // Modifier used as AccessControlList for functions
        require(pharmacyUsers[msg.sender], "Only a pharmacy is allowed to use this function");
        _;
    }

    function setPharmacyAuth(address wallet, bool authorized) external onlyOwner {
        pharmacyUsers[wallet] = authorized;
    }

    struct Transaction {
        address from;
        address to;
        uint256[] lotIds;
        uint256[] quantities;
        uint256 timestamp;
        bytes32 detailsHash;
    }

    uint256 public rewardMultiplier = 100;  // Note: 2 decimal points (es: rewardMultiplier = 100 means 1%)

    // Transaction[] pendingTransactions;
    mapping (address => mapping (address => Transaction[])) public pendingTransactions;

    address[] public senders;
    mapping (address => address[]) public sendersToReceivers;           // sender --> [receivers], "wallets in realtion with sender"
    mapping (address => mapping(address => bool)) public hasRelation;   // sender --> (receiver --> bool), "exist relation sender --> receiver?"

    function setRewardMultiplier(uint256 value) external onlyManufactuer {

        require(value <= 10000, "Multiplier must be lower than 100% (i.e. value lower than 10000)");
        rewardMultiplier = value;

    }

    function proposeTransaction(address to, uint256[] calldata lotIds, uint256[] calldata quantities) external {

        require(to != msg.sender, "Transactions towards self are not allowed");

        require(lotIds.length > 0, "Cannot create transaction with empty lot list");

        require(lotIds.length == quantities.length, "Arrays size must match");  // Check if arrays' size match

        address from = msg.sender;
        inventoryManager.hasSufficientInventory(from, lotIds, quantities);      // Check quantities and lot existence (revert if not) 

        for (uint256 i = 0; i < lotIds.length; i++) {                           // Remove items from sender inventory
            inventoryManager.removeFromInventory(from, lotIds[i], quantities[i]);
        }


        Transaction memory t = Transaction(from, to, lotIds, quantities, block.timestamp, keccak256(abi.encode(lotIds, quantities, block.timestamp)));
        pendingTransactions[from][to].push(t);          // Add transaction

        if (!hasRelation[from][to]) {                   // If no previous realtion
            sendersToReceivers[from].push(to);              // Add sender --> receiver realtion
            if (sendersToReceivers[from].length == 1) {     // If first relation sender --> x
                senders.push(from);                             // Add sender to the senders
            }
            hasRelation[from][to] = true;                   // Set hasRelation flag
        }  

        emit AddedTransaction(from, to, t.detailsHash, t);

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
            
            uint256 rewardAmount = 0;
            for (uint256 i; i < t.lotIds.length ; i++)      // Update inventory of receiver, sender's already updated
            {
                inventoryManager.addToInventory(t.to, t.lotIds[i], t.quantities[i]);

                rewardAmount += t.quantities[i] * productManager.getLot(t.lotIds[i]).unitPrice;
            }
            rewardAmount = (10**18) * rewardAmount * rewardMultiplier / 100 / 10000;    // TODO: Verificare che la formula sia corretta

            // Note: Remember to manually set minting auth to this contract
            cashbackToken.mint(t.from, rewardAmount);           // Mint reward tokens
            cashbackToken.mint(t.to, rewardAmount);

            emit AcceptedTransaction(from, to, t.detailsHash, t);

            /* rewardAmount example: 
                - transaction total value = 24000 (240 $)
                - rewardMultiplier = 200 (2%)
                
                rewardAmount = 24000 * (200 / 100) / 10000 = 
            */

        }
        else {

            for (uint256 i = 0; i < t.lotIds.length; i++) {     // Give back items to the sender
                inventoryManager.addToInventory(t.from, t.lotIds[i], t.quantities[i]);
            }

            emit RejectedTransaction(from, to, t.detailsHash, t);

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

    function getIncomingTransactions() external view returns (Transaction[] memory) {

        address receiver = msg.sender;

        uint256 total = 0;
        for (uint256 i = 0; i < senders.length; i++) {      // Compute how many transaction are towards the caller
            address sender = senders[i];
            if (hasRelation[sender][receiver]) {
                total += pendingTransactions[sender][receiver].length;
            }
        }

        Transaction[] memory result = new Transaction[](total);     // Initialize the array
        
        uint256 index = 0;
        for (uint256 i = 0; i < senders.length; i++) {      // Fill the array with transactions
            address sender = senders[i];
            Transaction[] storage txs = pendingTransactions[sender][receiver];
            for (uint256 j = 0; j < txs.length; j++) {
                result[index++] = txs[j];
            }
        }

        return result;

    }

    function getOutgoingTransactions() external view returns (Transaction[] memory) {
        address from = msg.sender;
        address[] memory receivers = sendersToReceivers[from];

        uint256 total = 0;
        for (uint256 i = 0; i < receivers.length; i++) {        // Compute how many transaction the caller has proposed
            total += pendingTransactions[from][receivers[i]].length;
        }

        Transaction[] memory result = new Transaction[](total);   // Initialize the array
        
        uint256 index = 0;
        for (uint256 i = 0; i < receivers.length; i++) {            // Fill the array
            Transaction[] storage txs = pendingTransactions[from][receivers[i]];
            for (uint256 j = 0; j < txs.length; j++) {
                result[index++] = txs[j];
            }
        }

        return result;
    }

    // Function used to remove old transactions (based on maxAge) still in pending state. 
    // 7 days = 60 * 60 * 24 * 7 = 604800 sec
    function removeExpiredTransactions(uint256 maxAge) external onlyOwner {

        uint256 nowTime = block.timestamp;

        for (uint256 s = 0; s < senders.length; s++) {                  // For every sender

            address sender = senders[s];
            address[] storage receivers = sendersToReceivers[sender];       // Retrieve all receivers associated to sender[i]

            for (uint256 r = 0; r < receivers.length; r++) {                // For every receiver

                address receiver = receivers[r];
                Transaction[] storage txs = pendingTransactions[sender][receiver];  // Retrieve all transactions sender --> receiver

                uint256 i = 0;
                while (i < txs.length) {                                    // Iterate over transactions previously retrieved               
                    if (nowTime - txs[i].timestamp > maxAge) {                  // If it is expired, remove it

                        for (uint256 j = 0; j < txs[i].lotIds.length; j++) {     // Give back items to the sender
                            inventoryManager.addToInventory(txs[i].from, txs[i].lotIds[j], txs[i].quantities[j]);
                        }

                        Transaction memory removedTx = txs[i];                  // We don't increase i: after pop(), txs[i] is a new element
                        txs[i] = txs[txs.length - 1];
                        txs.pop();

                        emit RemovedTransaction(sender, receiver, removedTx.detailsHash, removedTx);

                    } else {
                        i++;                                                    // If not expired, proceed with next element
                    }
                }

                if (txs.length == 0) {                          // If the sender has no more transactions, clean up the data structures

                    hasRelation[sender][receiver] = false;
                    removeAddressFromArray(receivers, receiver);

                    if (sendersToReceivers[sender].length == 0) {
                        removeAddressFromArray(senders, sender);
                    }

                }
            }
        }
    }

    function registerSaleToCustomer(uint256[] calldata lotIds, uint256[] calldata quantities) external onlyPharmacy {

        require(lotIds.length > 0, "Cannot register a sale with empty lot list");

        require(lotIds.length == quantities.length, "Arrays size must match");  // Check if arrays' size match

        address from = msg.sender;
        inventoryManager.hasSufficientInventory(from, lotIds, quantities);      // Check quantities and lot existence (revert if not) 

        uint256 totalPrice = 0;
        uint256 rewardAmount = 0;
        for (uint256 i; i < lotIds.length ; i++)      // Update inventories of sender and receiver
        {
            inventoryManager.removeFromInventory(from, lotIds[i], quantities[i]);
            totalPrice += quantities[i] * productManager.getLot(lotIds[i]).unitPrice;
        }
        rewardAmount = (10**18) * totalPrice * rewardMultiplier / 100 / 10000;

        // Note: Remember to manually set minting auth to this contract
        cashbackToken.mint(from, rewardAmount);           // Mint reward tokens

        emit SaleToCustomer(from, lotIds, quantities, totalPrice);

    }

    fallback() external {}

}

/* TODO: 
    Event sui vari file per modifiche alle ACL
    Proxy hardhat
*/

/*

    Complete Workflow:
    1 - Deploy CashbackToken
    2 - Deploy CashbackHandler, using the CashbackToken address as parameter in the constructor
    3 - Give burn authorization to CashbackHandler in the CashbackToken contract --> Can burn tokens
        Use setBurnerAuth function in CashbackToken
    4 - Deploy ProductManager
    5 - Grant manufacturer authorization to the manufacturer address in the ProductManager contract --> Can create products and lots
        Use setManufacturerAuth function in ProductManager
    6 - Deploy InventoryManager, using the ProductManager address as parameter in the constructor
    7 - Grant inventoryManager authorization to the InventoryManager in the ProductManager contract --> Can mark lots as produced
        Use setInventoryManager function in ProductManager
    8 - Grant manufacturer authorization to the manufacturer address in the InventoryManager contract --> Can produce batches, adding them to its inventory
        Use setManufacturerAuth function in InventoryManager
    9 - Deploy TransactionManager, using ProductManager, InventoryManager and CashbackToken addresses as parameters in the constructor    
    10 - Grant mint authorization to the TransactionManager in the CashbackToken contract --> Can mint tokens
        Use setMinterAuth function in CashbackToken
    11 - Grant transactionManager authorization to the TransactionManager in the InventoryManager contract --> Can operate on users' inventory
        Use setTransactionManager function in InventoryManager
    12 - Grant manufacturer authorization to the manufacturer address in the TransactionManager contract --> Can modify reward multiplier
        Use setManufacturerAuth function in TransactionManager
    13 - Grant pharmacy authorization to a pharmacy address in the TransactionManager contract --> Can sell items to customers
        Use setPharmacyAuth function in TransactionManager
    14 - Create some products on the ProductManager: 1, ["Prod1", "Material", ...]
    15 - Create some lots on the ProductManager: 1, ["01/01/0001", 10000, 1]
    16 - Add to the manufacturer's inventory some items using addToManufacturerInventory: 1 
    15 - Propose a tranfer between two wallets: walletAddrB, [1], [5]
    16 - Accept proposed transaction (using walletB): walletAddrA
        Note: Use pendingTransaction to retrieve detailsHash
    17 - Verify changes in walletB's inventory

*/