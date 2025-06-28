<template>
  <div class="balance-card">
    <h2>💰 Il tuo saldo</h2>

    <div v-if="loading" class="status">🔄 Caricamento...</div>

    <div v-else-if="balance">
      <div class="balance">{{ balance }} ETH</div>
      <div class="address">Account: {{ accountShort }}</div>
    </div>

    <div v-else class="error">⚠️ Impossibile ottenere il saldo</div>
  </div>
</template>

<script>
import { getContractBalanceInETH } from '@/services/contract.services' // Adatta il path se necessario

export default {
  name: 'BalanceCard',
  props: {
    account: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      balance: null,
      loading: true,
    }
  },
  computed: {
    accountShort() {
      if (!this.account) return ''
      return `${this.account.slice(0, 6)}...${this.account.slice(-4)}`
    },
  },
  async mounted() {
    try {
      this.balance = await getContractBalanceInETH(this.account)
    } catch (error) {
      console.error('Errore durante il recupero del saldo:', error)
    } finally {
      this.loading = false
    }
  },
}
</script>

<style scoped>
.balance-card {
  max-width: 400px;
  margin: 60px auto;
  padding: 24px;
  border-radius: 12px;
  background: #fdfdfd;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #eee;
  font-family: 'Segoe UI', sans-serif;
  text-align: center;
}

.balance-card h2 {
  font-size: 1.8rem;
  margin-bottom: 20px;
  color: #333;
}

.status,
.error {
  color: #888;
  font-style: italic;
}

.error {
  color: #c0392b;
}

.balance {
  font-size: 2.2rem;
  color: #27ae60;
  font-weight: bold;
  margin-bottom: 10px;
}

.address {
  font-size: 0.9rem;
  color: #666;
}
</style>
