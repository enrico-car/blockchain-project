<template>
  <div class="request-manager">
    <div class="header-section">
      <h1 class="main-title">Transactions Management</h1>
      <button @click="openCreateModal" class="create-button">
        <span class="plus-icon">+</span>
        Create Transaction
      </button>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button
        @click="activeTab = 'pending'"
        :class="['tab-button', { active: activeTab === 'pending' }]"
      >
        Pending Transactions
        <span class="tab-count">{{ pendingRequests.length }}</span>
      </button>
      <button @click="activeTab = 'my'" :class="['tab-button', { active: activeTab === 'my' }]">
        My Transactions
        <span class="tab-count">{{ myRequests.length }}</span>
      </button>
    </div>

    <!-- Content Area -->
    <div class="content-area">

      <!-- Pending Requests Section -->
      <section v-if="activeTab === 'pending'" class="requests-section">
        <div class="requests-list">
          <PendingRequestCard
            v-for="request in pendingRequests"
            :key="request.id"
            :request="request"
            :users="users"
            @approve="handleApprove"
            @reject="handleReject"
          />
          <div v-if="pendingRequests.length === 0" class="empty-state">
            <p>No pending transactions</p>
          </div>
        </div>
      </section>

      <!-- My transaction status -->
      <section v-if="activeTab === 'my'" class="requests-section">
        <div class="requests-list">
          <MyRequestCard
            v-for="request in myRequests"
            :key="request.id"
            :request="request"
            :users="users"
          />
          <div v-if="myRequests.length === 0" class="empty-state">
            <p>There are no transactions from/to me yet</p>
          </div>
        </div>
      </section>
    </div>

    <!-- Create Request Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Create New Transaction</h3>
          <button @click="closeCreateModal" class="close-button">&times;</button>
        </div>
        <form @submit.prevent="submitRequest" class="modal-form">
          <div class="form-group">
            <label for="destination">Destination</label>
            <select
              id="destination"
              v-model="newTransaction.to"
              required
            >
              <option disabled value="">Select a destination</option>
              <option
                v-for="user in users"
                :key="user.wallet"
                :value="user.wallet"
              >
                {{ user.realName }} - {{ formatWallet(user.wallet) }}
              </option>
            </select>
          </div>
          <div v-for="(entry, index) in newTransaction.entries" :key="index" class="form-row">
            <div class="form-group half">
              <label>Lot ID</label>
              <select v-model="entry.lotId" required>
                <option disabled value="">Select a Lot</option>
                <option
                  v-for="product in products"
                  :key="product.lotId"
                  :value="product.lotId"
                >
                  {{ formatLotId(product.lotId) }} - {{ product.productIdentification }} (Qty: {{ product.quantity }})
                </option>
              </select>
            </div>
            <div class="form-group half">
              <label>Qt.</label>
              <input
                v-model="entry.quantities"
                type="number"
                placeholder="Lot Qt."
                min="1"
                required
              />
            </div>

            <!-- Add the remove button for the first Lot details form entry -->
            <button
              v-if="index > 0"
              type="button"
              class="remove-entry-button"
              @click="removeEntry(index)"
              title="Remove"
            >
              &times;
            </button>
          </div>

          <!-- Button for adding more entries -->
          <div class="add-button-container">
            <button type="button" @click="addEntry" class="add-entry-button">+ Add another</button>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeCreateModal" class="cancel-button">Cancel</button>
            <button type="submit" class="submit-button">Create Transaction</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import PendingRequestCard from './PendingRequestsCard.vue'
import MyRequestCard from './MyRequestCard.vue'
import {
  proposeTransaction,
  getIncomingTransactions,
  respondToTransactionRequest,
} from '@/services/request.services'
import { getLot } from '@/services/product.services'
import { getTransactionEvents } from '@/services/events.services'
import { getInventory } from '@/services/inventory.services'
import { processLots } from '@/utils/abi.config'
import { useToaster } from '@/composables/useToaster';

export default {
  components: {
    PendingRequestCard,
    MyRequestCard,
  },
  setup(){
    const { showSuccess, showError } = useToaster();

    return {
      showSuccess,
      showError
    };
  },
  data() {
    return {
      pendingRequests: [],
      myRequests: [],
      activeTab: 'pending',
      showCreateModal: false,
      newTransaction: {
        to: '',
        entries: [{ lotId: '', quantities: '' }],
      },
      products: [],
      users: [],
    }
  },
  async mounted() {
    try {
      this.getIncomingTransactions()
      this.getMyTransactionStatus()
      this.getProducts();
      this.getUsers();
    } catch (e) {
      console.log(e)
    }
  },
  methods: {
    async handleApprove(from, detailsHash) {
      const index = this.pendingRequests.findIndex((req) => req.detailsHash === detailsHash)

      // Approve the transaction
      try{
        await respondToTransactionRequest(from, detailsHash, true)

        // If the approval completed correctly remove the item in the visualized list
        if (index !== -1) {
          this.pendingRequests.splice(index, 1)
          this.showSuccess(`Request ${detailsHash} approved`);
        }
      }catch(e){
        this.showError("Error while approving request");
      }
    },
    async handleReject(from, detailsHash) {
      const index = this.pendingRequests.findIndex((req) => req.detailsHash === detailsHash)

      // Reject the transaction
      try{
        await respondToTransactionRequest(from, detailsHash, false)

        // If the rejection completed correctly remove the item in the visualized list
        if (index !== -1) {
          this.pendingRequests.splice(index, 1)
          this.showSuccess(`Request ${detailsHash} rejected`);
        }
      }catch(e){
        this.showError("Error while rejecting request");
      }
    },
    openCreateModal() {
      this.showCreateModal = true
    },
    closeCreateModal() {
      this.showCreateModal = false
      this.newTransaction.to = ''
      this.newTransaction.entries = [{ lotId: '', quantities: '' }]
    },
    addEntry() {
      this.newTransaction.entries.push({ lotId: '', quantities: '' })
    },
    removeEntry(index) {
      this.newTransaction.entries.splice(index, 1)
    },
    async submitRequest() {
      console.log('Creating transaction...')

      try {
        // Propose a new transasction
        await proposeTransaction(this.newTransaction.to, this.newTransaction.entries)
        // If the transaction proposal went smoothly update the transaction list
        this.getMyTransactionStatus()
        this.showSuccess("Propose of transaction successful");
      } catch (e) {
        this.showError("Erorr while proposing transaction");
        console.log('Error:', e)
      }
      this.closeCreateModal()
    },
    async getIncomingTransactions() {
      try {
        // Fetch incoming transaction
        const result = await getIncomingTransactions()
        this.pendingRequests = result

      } catch (e) {
        this.showError("Error with incoming transactions", "It was not possible to obtain the incoming transactions");
        console.log('Error:', e)
      }
    },
    getUniqueDetailsHashes(data) {
      const uniqueSet = new Set();

      data.forEach(item => {
        if (item.detailsHash) {
          uniqueSet.add(item.detailsHash);
        }
      });

      return uniqueSet;
    },
    formatWallet(wallet) {
      if (!wallet) return "";
      return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
    },
    async getUsers() {
      try {
        const response = await fetch("http://localhost:3000/api/user/all");
        const data = await response.json();

        // Ordina per realName (case-insensitive)
        this.users = data.users.sort((a, b) =>
          a.realName.localeCompare(b.realName, undefined, { sensitivity: 'base' })
        );
      } catch (e) {
        this.showError("Error while fetching users");
      }
    },
    formatLotId(lotId) {
      if (!lotId) return '';
      return `${lotId.slice(0, 4)}...${lotId.slice(-4)}`;
    },
    async getProducts() {

      // Get user inventory
      try{
        let { lotIds, quantities } = await getInventory();
        let ids = lotIds;

        // Return if the inventory is empty
        if (ids.length === 0) {
          return;
        }

        // Fetch all lots details on-chain
        const results = await Promise.all(
          ids.map(async (element, index) => {
            const lot = await getLot(element);
            return {
              ...lot,
              6: element,
              7: quantities[index],
            };
          })
        );
        
        // Merge on-chain details with server infos
        this.products = await processLots(results)
      }catch(e){
        this.showError("Erorr while obtaining the inventory");
      }
    },
    // Generate the transaction history from the events in Blockchain
    async getMyTransactionStatus(){
      
      // Get Transaction events and extract unique DetailsHashes
      const result = await getTransactionEvents()
      const unique = this.getUniqueDetailsHashes(result)

      // Group events regarding the same transaction
      let final = []
      unique.forEach(element => {
        let sametransaction = result.filter(item => item.detailsHash == element);
        let index = sametransaction.findIndex(item => item.type === 'RejectedTransaction'); // The transaction has been rejected
        if (index !== -1) {
          final.push(sametransaction[index])
        } else {
          index = sametransaction.findIndex(item => item.type === 'AcceptedTransaction'); // The transaction has been accepted
          if (index !== -1) {
            final.push(sametransaction[index])
          } else {
            index = sametransaction.findIndex(item => item.type === 'RemovedTransaction'); // The transaction expired
            if (index !== -1 && sametransaction[index].isFrom) {
              final.push(sametransaction[index])
            } else {
              index = sametransaction.findIndex(item => item.type === 'AddedTransaction'); // The transaction is still in pending
              if (index !== -1 && sametransaction[index].isFrom) {
                final.push(sametransaction[index])
              }
            }
          }
        }
      });
      this.myRequests = final
    }
  },
}
</script>

<style scoped>
.request-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.main-title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.create-button {
  display: flex;
  max-width: 210px;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #42b883, #35495e);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.create-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.plus-icon {
  font-size: 1.25rem;
  font-weight: bold;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  margin-bottom: 2rem;
  gap: 0.5rem;
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: transparent;
  color: #64748b;
  position: relative;
}

.tab-button.active {
  background: linear-gradient(135deg, #42b883, #35495e);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(66, 184, 131, 0.3);
}

.tab-button:not(.active):hover {
  background: #f8fafc;
  color: #2c3e50;
}

.tab-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tab-button.active .tab-count {
  background: rgba(255, 255, 255, 0.3);
}

.tab-button:not(.active) .tab-count {
  background: #e2e8f0;
  color: #64748b;
}

/* Content Area */
.content-area {
  min-height: 400px;
}

.requests-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #64748b;
  font-style: italic;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f1f5f9;
  color: #2c3e50;
}

.modal-form {
  padding: 1.5rem;
}
/* 
.form-group {
  margin-bottom: 1.5rem;
} */

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  /* margin-top: 2rem; */
}

.cancel-button,
.submit-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button {
  background: #f1f5f9;
  color: #64748b;
}

.cancel-button:hover {
  background: #e2e8f0;
}

.submit-button {
  background: #42b883;
  color: white;
}

.submit-button:hover {
  background: #369870;
}

/* Addd putton */

.form-row {
  display: flex;
  justify-content: center;
}
/* 
.form-group.half {
  flex: 1;
  margin-bottom: 0rem;
} */

.add-button-container {
  margin-top: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

.add-entry-button {
  background: none;
  border: none;
  color: #42b883;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 0.5rem 0.75rem;
  transition: background 0.2s ease;
  border-radius: 6px;
}

.add-entry-button:hover {
  background: #f1f5f9;
}

.remove-entry-button {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.25rem;
  cursor: pointer;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  align-self: center;
  transition: background 0.2s ease;
}

.remove-entry-button:hover {
  background: #fee2e2;
}
</style>
