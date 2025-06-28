<template>
  <div class="request-manager">
    <div class="header-section">
      <h1 class="main-title">Request Management</h1>
      <button @click="openCreateModal" class="create-button">
        <span class="plus-icon">+</span>
        Create Request
      </button>
    </div>
    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button
        @click="activeTab = 'pending'"
        :class="['tab-button', { active: activeTab === 'pending' }]"
      >
        Pending Requests
        <span class="tab-count">{{ pendingRequests.length }}</span>
      </button>
      <button @click="activeTab = 'my'" :class="['tab-button', { active: activeTab === 'my' }]">
        My Requests
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
            @approve="handleApprove"
            @reject="handleReject"
          />
          <div v-if="pendingRequests.length === 0" class="empty-state">
            <p>Nessuna richiesta pendente</p>
          </div>
        </div>
      </section>

      <!-- My Requests Section -->
      <section v-if="activeTab === 'my'" class="requests-section">
        <div class="requests-list">
          <MyRequestCard v-for="request in myRequests" :key="request.id" :request="request" />
          <div v-if="myRequests.length === 0" class="empty-state">
            <p>Non hai ancora fatto richieste</p>
          </div>
        </div>
      </section>
    </div>

    <!-- Create Request Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Create New Request</h3>
          <button @click="closeCreateModal" class="close-button">&times;</button>
        </div>
        <form @submit.prevent="submitRequest" class="modal-form">
          <div class="form-group">
            <label for="destination">Destination</label>
            <input
              id="destination"
              v-model="newTransaction.to"
              type="text"
              placeholder="Enter destination address"
              required
            />
          </div>
          <div v-for="(entry, index) in newTransaction.entries" :key="index" class="form-row">
            <div class="form-group half">
              <label>Lot ID</label>
              <input v-model="entry.lotId" type="text" placeholder="Enter Lot id" required />
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

            <!-- Add the remove button for entries > 0 -->
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

          <!-- Button for more entries -->
          <div class="add-button-container">
            <button type="button" @click="addEntry" class="add-entry-button">+ Add another</button>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeCreateModal" class="cancel-button">Cancel</button>
            <button type="submit" class="submit-button">Create Request</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import PendingRequestCard from './PendingRequestsCard.vue'
import MyRequestCard from './MyRequestCard.vue'
import { createProduct } from '@/services/contract.services'
import {
  proposeTransaction,
  getIncomingTransactions,
  getOutgoingTransactions,
} from '@/services/request.services'

// import AppFooter from './AppFooter.vue'

export default {
  components: {
    PendingRequestCard,
    MyRequestCard,
  },
  data() {
    return {
      // TODO remove and connect to the blockchain
      // Dummy request data
      pendingRequests: [
        {
          id: 1,
          productName: 'Request 1',
          requesterName: 'Mario Rossi',
          requestDate: '2024-01-15',
        },
        {
          id: 2,
          productName: 'Request 2',
          requesterName: 'Laura Bianchi',
          requestDate: '2024-01-14',
        },
        {
          id: 3,
          productName: 'Request 3',
          requesterName: 'Giuseppe Verdi',
          requestDate: '2024-01-13',
        },
      ],
      // Dati delle richieste dell'utente
      myRequests: [
        {
          id: 101,
          productName: 'Request 1',
          requestDate: '2024-01-12',
          status: 'pending',
        },
        {
          id: 102,
          productName: 'Request 2',
          requestDate: '2024-01-10',
          status: 'approved',
        },
        {
          id: 103,
          productName: 'Request 3',
          requestDate: '2024-01-08',
          status: 'rejected',
        },
      ],
      activeTab: 'pending',
      showCreateModal: false,
      newTransaction: {
        to: '',
        entries: [{ lotId: '', quantities: '' }],
      },
    }
  },
  async mounted() {
    try {
      await getOutgoingTransactions()
    } catch (e) {
      console.log(e)
    }
  },
  methods: {
    // TODO modify functions with real data
    handleApprove(requestId) {
      const index = this.pendingRequests.findIndex((req) => req.id === requestId)
      if (index !== -1) {
        this.pendingRequests.splice(index, 1)
        console.log(`Request ${requestId} approved`)
      }
    },
    handleReject(requestId) {
      const index = this.pendingRequests.findIndex((req) => req.id === requestId)
      if (index !== -1) {
        this.pendingRequests.splice(index, 1)
        console.log(`Request ${requestId} rejected`)
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
    // TODO rename
    addEntry() {
      this.newTransaction.entries.push({ lotId: '', quantities: '' })
    },
    removeEntry(index) {
      // TODO controllo per evitare di imuovere la entry 0
      this.newTransaction.entries.splice(index, 1)
    },
    async submitRequest() {
      console.log('Creating transaction...')
      console.log(this.newTransaction)

      try {
        const result = await proposeTransaction(this.newTransaction.to, this.newTransaction.entries)
        console.log('Transaction successful:', result)
      } catch (e) {
        console.log('Error:', e)
      }
      this.closeCreateModal()
    },
    // TODO Spostare
    creteProduct() {
      console.log('Creating product...')
      createProduct()
    },
    async getIncomingTransactions() {
      try {
        const result = await getIncomingTransactions()
        console.log('Transaction successful:', result)
      } catch (e) {
        console.log('Error:', e)
      }
    },
    async getOutgoingTransactions() {
      try {
        const result = await getOutgoingTransactions()
        console.log('Transaction successful:', result)
      } catch (e) {
        console.log('Error:', e)
      }
    },
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
  max-width: 200px;
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
