<template>
  <div class="pending-request-card">
    <div class="card-main">

      <!-- Transaction info -->
      <div class="card-left">
        <div class="card-header">
          <div class="product-info">
            <h4 class="product-name">{{ request.productName }}</h4>
          </div>
        </div>

        <div class="card-body">
          <div class="requester-info">
            <span class="requester-label">From:</span>
            <span class="requester-name">{{ resolveName(request.from) }}</span>
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
      </div>

      <!-- Accept/Reject buttons -->
      <div class="card-right">
        <div class="card-actions">
          <button @click="handleApprove" class="approve-button">
            <span class="button-icon">✓</span>
            Accept
          </button>
          <button @click="handleReject" class="reject-button">
            <span class="button-icon">✕</span>
            Decline
          </button>
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
  emits: ['approve', 'reject'],
  data() {
    return {
      names: '',
      qt: '',
    }
  },
  async mounted(){

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
      return new Date(dateString*1000).toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
    contentString(names, qt) {
      if (!names || !qt) return '';

      return names
        .map((name, i) => `${name}: ${qt[i]}`)
        .join(', ');
    },
    handleApprove() {
      // Emit approve event that will be catched by the parent component (RequestManager)
      this.$emit('approve', this.request.from, this.request.detailsHash)
    },
    handleReject() {
      // Emit reject event that will be catched by the parent component (RequestManager)
      this.$emit('reject', this.request.from, this.request.detailsHash)
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

.card-main {
  display: flex;
}

.card-left {
  flex: 1;
}

.card-right {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 90px;
}

.pending-request-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pending-request-card:hover {
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

.card-body {
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
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

.requester-name {
  font-size: 0.875rem;
  color: #2c3e50;
}

.date-value {
  font-size: 0.875rem;
  color: #64748b;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.approve-button,
.reject-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  justify-content: center;
  max-width: 100px;
}

.approve-button {
  background: #10b981;
  color: white;
}

.approve-button:hover {
  background: #059669;
  transform: translateY(-1px);
}

.reject-button {
  background: #ef4444;
  color: white;
}

.reject-button:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.button-icon {
  font-size: 1rem;
  font-weight: bold;
}
</style>
