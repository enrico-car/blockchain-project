<template>
  <div class="my-request-card">

    <!-- Transaction info -->
    <div class="card-body">
      <div v-if="request.isFrom" class="requester-info">
        <span class="requester-label">To:</span>
        <span class="requester-name">{{ resolveName(request.to) }}</span>
        <div class="transaction-type">
          <span class="icon">⬆ Out</span>
        </div>
      </div>
      <div v-else class="requester-info">
        <span class="requester-label">From:</span>
        <span class="requester-name">{{ resolveName(request.from) }}</span>
        <div class="transaction-type">
          <span class="icon">⬇ In</span>
        </div>
      </div>
      <div class="requester-info">
        <span class="requester-label">Content:</span>
        <span class="requester-name">{{ contentString(this.names, this.qt) }}</span>
      </div>
      <div class="request-date">
        <span class="date-label">Date:</span>
        <span class="date-value">{{ formatDate(request.timestamp) }}</span>
      </div>
    </div>

    <!-- Transaction status -->
    <div class="card-header">
      <div class="product-info">
        <h4 class="product-name">{{ request.productName }}</h4>
        <div class="status-container">
          <span :class="['status-badge', statusConfig.class]">
            {{ statusConfig.label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import { getLot } from '@/services/product.services';
import { processLots } from '@/utils/abi.config'

export default {
  props: {
    request: {
      type: Object,
      required: true,
    },
    users: Array,
  },
  data() {
    return {
      names: null,
      qt: null,
    };
  },
  computed: {
    statusConfig() {
      const configs = {
        AddedTransaction: {
          label: 'Pending',
          class: 'status-pending',
        },
        AcceptedTransaction: {
          label: 'Approved',
          class: 'status-approved',
        },
        RejectedTransaction: {
          label: 'Declined',
          class: 'status-rejected',
        },
      }
      return configs[this.request.type] || configs.AddedTransaction
    },
  },
  async mounted (){
    
    // Having the lotIds of the my transaction events fetch all the relevant data
    const results = await Promise.all(
      this.request.lotIds.map(async (element, index) => {
        // Fetch lot property
        const lot = await getLot(element);
        return {
          ...lot,       // Original lot property
          6: element,   // Adding lot id (not present in the fetched lot property)
          7: this.request.quantities[index], // Add the corresponding quantities
        };
      })
    );

    // Merge the lot data with the item details in the database
    let complete = await processLots(results)

    // Update local variables for info visualization
    let names = complete.map((item) => { return item.productIdentification })
    let qt = complete.map((item) => { return item.quantity })
    this.names = names
    this.qt = qt
  },
  methods: {
    formatDate(dateString) {
      return new Date(dateString).toLocaleString('it-IT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    contentString(names, qt) {
      if (!names || !qt) return '';

      return names
        .map((name, i) => `${name}: ${qt[i]}`)
        .join(', ');
    },
    resolveName(wallet) {
      const match = this.users.find(u => u.wallet.toLowerCase() === wallet.toLowerCase());
      if (match) {
        return `${match.realName} (${this.truncateWallet(match.wallet)})`;
      }
      return this.truncateWallet(wallet); // fallback
    },
    truncateWallet(wallet) {
      return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
    },
  },
}
</script>

<style scoped>
.my-request-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-direction: row;
  display: flex;
  justify-content: space-between;
;
}

.my-request-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.card-header {
  margin-bottom: 1rem;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.product-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  flex: 1;
  min-width: 0;
}

.status-container {
  display: flex;
  justify-content: flex-start;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
}

.status-approved {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #10b981;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #ef4444;
}

.status-icon {
  font-size: 1rem;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.request-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.requester-info,
.request-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.requester-label,
.date-label {
  font-size: 0.875rem;
  font-weight: 800;
}

.requester-name,
.date-value {
  font-size: 0.875rem;
  color: #2c3e50;
}

/* Transaction Icon */

.transaction-type {
  display: flex; /* per centrare */
  align-items: center;
  justify-content: center;
  font-size: 1rem;      
  border-radius: 50%; 
  /* padding: 1rem; */
  /* width: 0.5rem;
  height: 0.5rem; */
  /* border: 2px solid transparent; */
}

.transaction-type {
  /* background-color: #e6f9f0; */
  color: #2ecc71;
  border-color: #b6f0d5;
}

.icon {
  display: inline-block;
  transform: translateY(-1px); /* opzionale: verticale perfetta */
}

</style>
