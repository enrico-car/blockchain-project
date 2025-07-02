<template>
  <div class="cashback-card">
    <h1 class="title">Cashback</h1>
    <div class="row-menu">
      <div class="left-part">

        <!-- Token counter -->
        <div class="counter-section">
          <div class="stat-card">
            <span class="stat-number">{{ balance }}</span>
            <span class="stat-label">CSHBK</span>
          </div>
        </div>
      </div>
      <div class="separetor"></div>
      <div class="right-part">
        <h1 class="redeem-title">Redeem your discounts</h1>
        <form @submit.prevent="submitLotRequest" class="redeem-form">
          <button type="submit" class="submit-button">Redeem now</button>

          <!-- Reddem status -->
          <transition name="fade">
            <div class="redeem-border" v-if="redeemMessage">
              <p :class="['redeem-info', redeemSuccess ? 'success' : 'error']">
                {{ redeemMessage }}
              </p>
            </div>
          </transition>
        </form>
      </div>
    </div>

    <!-- Reddem History -->
    <RedeemHistory :history="redeemHistoryData"></RedeemHistory>
  </div>
</template>

<script>
import RedeemHistory from './RedeemHistory.vue'
import { redeemCashback, getTokenBalance } from '@/services/cashback.services'
import { getCashbackHistory } from '@/services/events.services.js'
import { useToaster } from '@/composables/useToaster';

export default {
  name: 'CashbackCard',
  props: {},
  components: {
    RedeemHistory,
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
      query: '',
      balance: -1,
      filtered: [],
      showSuggestions: false,
      redeemAmount: '',
      redeemMessage: '',
      redeemSuccess: null,
      messageTimeout: null,
      redeemHistoryData: [],
    }
  },
  async mounted(){
    // Get token balance
    try{
      this.balance = await getTokenBalance();
      
      // Fetch redeem history
      this.fetchHistory();
    }catch(e){
      this.showError("Error while obtaining cashback balance");
    }
  },
  methods: {
    async submitLotRequest() {
      if(await redeemCashback()){
        //cashback request ok
        this.redeemMessage = 'Redeem request sent successfully!'
        this.redeemSuccess = true

        // Fetch the new balance and updated history
        this.balance = await getTokenBalance();
        this.fetchHistory();

      } else {
        // Error during cashback redemption
        this.redeemMessage = 'Error: it was not possible to fulfill the request!'
        this.redeemSuccess = false
      }
      
      // Reset timeout if already active
      if (this.messageTimeout) clearTimeout(this.messageTimeout)

      // Auto-hide redemption message after 3 seconds
      this.messageTimeout = setTimeout(() => {
        this.redeemMessage = ''
        this.redeemSuccess = null
      }, 3000)
    },
    async getTokenBalance(){
      let balance = await getTokenBalance();

      if(balance < 0) this.showError("Error token balance", "It was not possible to obtain the balance");

      return balance;
    },
    async fetchHistory() {
      try {
        console.log('Fetching history...')
        const data = await getCashbackHistory()
        this.redeemHistoryData = data
      } catch (err) {
        this.error = err.message
        console.error('Fetch error:', err)
        this.showError("Erorr redeem history", "It was not possible to obtain the history");
      } finally {
        this.loading = false
      }
    }
  },
}
</script>

<style>
.cashback-card {
  max-width: 1200px;
  margin: auto;
  width: 100%;
  padding-left: 2rem;
  padding-right: 2rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin-top: 1rem;
}

.counter-section {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.separetor {
  width: 1px;
  background-color: #e2e8f0;
  align-self: stretch;
  margin: 1rem;
}

.row-menu {
  display: flex;
  flex-direction: row;
  min-height: 200px;
  margin-top: 2rem;
  border-style: solid;
  border-width: 1px;
  border-color: #e2e8f0;
  border-radius: 16px;
}

.left-part {
  flex: 1;
  align-self: center;
  justify-items: center;
}

.right-part {
  flex: 3;
}

.stat-card {
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 100px;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #42b883;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.redeem-title {
  margin-top: 0.5rem;
}

.input-section {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.input-section input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.input-section input:hover {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.input-section input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.redeem-border {
  display: inline-block;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background-color: #f9fafb;
  max-width: 100%; /* evita overflow */
}

.redeem-info {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}

.redeem-info.success {
  color: #2ecc71;
}

.redeem-info.error {
  color: #e74c3c;
}

.submit-button {
  max-width: 200px;
}

.redeem-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 300px;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
