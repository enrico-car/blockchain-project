<template>
  <div class="row-multiplier">

    <!-- Multiplier Visualization -->
    <div class="left-part">
      <div class="counter-section">
        <div class="stat-card">
          <span class="stat-number">{{ actualMultiplierAmount }} %</span>
          <span class="stat-label">Multiplier</span>
        </div>
      </div>
    </div>
    <div class="separetor"></div>

    <!-- Multiplier chainging form -->
    <div class="right-part">
      <h1 class="multiplier-title">Change Cashback multiplier</h1>
      <form @submit.prevent="submitChangeRequest" class="redeem-form">
        <div class="input-section">
          <input type="text" v-model="multiplierAmount" placeholder="Insert multiplier (%)" required />
          <button type="submit" class="submit-button">Change</button>
        </div>

        <!-- Modification Status -->
        <transition name="fade">
          <div class="multiplier-border" v-if="multiplierMessage">
            <p :class="['multiplier-info', multiplierSuccess ? 'success' : 'error']">
              {{ multiplierMessage }}
            </p>
          </div>
        </transition>
      </form>
    </div>
  </div>
</template>

<script>
import { getRewardMultiplier, setRewardMultiplier } from '@/services/cashback.services'

export default {
  name: 'MultiplierCard',
  props: {},
  data() {
    return {
      showSuggestions: false,
      actualMultiplierAmount: '',
      multiplierAmount: '',
      multiplierMessage: '',
      multiplierSuccess: null,
      messageTimeout: null,
    }
  },
  async mounted(){
    this.actualMultiplierAmount = await getRewardMultiplier();
  },
  methods: {
    async submitChangeRequest() {
      if(await setRewardMultiplier(this.multiplierAmount)){
        // Cashback request ok
        this.multiplierMessage = 'Multiplier request sent successfully!'
        this.actualMultiplierAmount = await getRewardMultiplier();
        this.multiplierSuccess = true
      } else {
        // Some error
        this.multiplierMessage = 'Error: it was not possible to fulfill the request!'
        this.multiplierSuccess = false
      }
      
      // Reset timeout if already active
      if (this.messageTimeout) clearTimeout(this.messageTimeout)

      // Auto-hide message after 3 seconds
      this.messageTimeout = setTimeout(() => {
        this.multiplierMessage = ''
        this.multiplierSuccess = null
      }, 3000)
    },
    async getRewardMultiplier(){
      let multiplier = await getRewardMultiplier();

      if(multiplier < 0) this.showError("Error reward multiplier", "It was not possible to obtain the reward multiplier");

      return multiplier;

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
}

.separetor {
  width: 1px;
  background-color: #e2e8f0;
  align-self: stretch;
  margin: 1rem;
}

.row-multiplier {
  display: flex;
  flex-direction: row;
  min-height: 200px;
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

.multiplier-title {
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

.multiplier-border {
  display: inline-block; /* 🚀 Limita la larghezza al contenuto */
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background-color: #f9fafb;
  max-width: 100%; /* evita overflow */
  margin-bottom: 1rem;
}

.multiplier-info {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}

.multiplier-info.success {
  color: #2ecc71;
}

.multiplier-info.error {
  color: #e74c3c;
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
