<template>
  <div class="redeem-history">
    <div class="redeem-history-header" @click="toggleList">
      <h2 class="redeem-history-title">Redeem History</h2>
      <button class="toggle-list-button">
        {{ isOpen ? '−' : '+' }}
      </button>
    </div>

    <transition name="fade">
      <div v-if="isOpen" class="redeem-history-list">
        <div v-if="history.length > 0">
          <div
            v-for="(item, index) in history"
            :key="item.transactionHash"
            class="redeem-entry"
          >
            <span class="amount">{{ item.amount }} tokens</span>
            <span class="date">{{ formatDate(item.date) }}</span>
          </div>
        </div>
        <div v-else-if="!loading">
          <p>No redeem found</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { getCashbackHistory, getTransactionEvents } from '@/services/events.services.js'

export default {
  name: 'RedeemHistory',
  props: {
    // history: {
    //   type: Array,
    //   required: true,
    // },
  },
  data() {
    return {
      isOpen: false,
      history: [],
      loading: false,
      error: null
    }
  },
  async mounted() {
    await this.fetchHistory()
  },
  methods: {
    toggleList() {
      this.isOpen = !this.isOpen
    },
    formatDate(dateStr) {
      const date = new Date(dateStr)
      return date.toLocaleString()
    },
    async fetchHistory() {
      this.loading = true
      this.error = null
      try {
        console.log('Fetching history...')
        const data = await getCashbackHistory()
        await getTransactionEvents()
        this.history = data
        if (data.length > 0) this.isOpen = true
      } catch (err) {
        this.error = err.message
        console.error('Fetch error:', err)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.redeem-history {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background-color: #f9fafb;
  padding: 1rem;
  margin-top: 2rem;
}

.redeem-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.redeem-history-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.toggle-list-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #4b5563;
  cursor: pointer;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  transition: background 0.2s ease;
}

.toggle-list-button:hover {
  background-color: #e5e7eb;
}

.redeem-history-list {
  margin-top: 1rem;
}

.redeem-entry {
  padding: 0.5rem 0;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  color: #374151;
}

.redeem-entry:first-child {
  border-top: none;
}

.amount {
  font-weight: 600;
  color: #10b981;
}

.date {
  color: #6b7280;
}

/* Optional fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
