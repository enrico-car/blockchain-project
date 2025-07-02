<template>
  <div class="login-card">
    <div class="login-header">
      <div class="logo-section">
        <h1 class="app-title">PharmaChain</h1>
      </div>
    </div>

    <div class="login-content">

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <span class="error-icon">⚠️</span>
        {{ error }}
      </div>

      <!-- MetaMask Status -->
      <div class="metamask-status">
        <div v-if="isMetaMaskAvailable" class="status-success">
          <span class="status-icon">✅</span>
          MetaMask ready
        </div>
        <div v-else class="status-warning">
          <span class="status-icon">⚠️</span>
          MetaMask not installed
        </div>
      </div>

      <!-- Login Actions -->
      <div class="login-actions">
        <button
          @click="connectWithMetaMask"
          :disabled="!isMetaMaskAvailable || isConnecting"
          class="metamask-button"
          :class="{ connecting: isConnecting }"
        >
          <div class="button-content">
            <div class="metamask-icon">🦊</div>
            <div class="button-text">
              <span v-if="isConnecting">Connecting...</span>
              <span v-else-if="isMetaMaskAvailable">Login with MetaMask</span>
              <span v-else>MetaMask not available</span>
            </div>
          </div>
          <div v-if="isConnecting" class="loading-spinner"></div>
        </button>

        <!-- Download MetaMask Button -->
        <button v-if="!isMetaMaskAvailable" @click="downloadMetaMask" class="download-button">
          <div class="button-content">
            <span class="button-text">Download MetaMask</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'
import { BrowserProvider } from 'ethers'

export default {
  name: 'MetaMaskConnect',
  data() {
    return {
      isMetaMaskAvailable: false,
      isConnecting: false,
      error: '',
      account: '',
    }
  },
  mounted() {
    this.checkMetaMaskAvailability()
  },
  setup() {
    const router = useRouter()
    return { router }
  },
  methods: {
    checkMetaMaskAvailability() {
      if (typeof window.ethereum !== 'undefined') {
        this.isMetaMaskAvailable = true
      }
    },
    async connectWithMetaMask() {
      if (!this.isMetaMaskAvailable) {
        this.error = "MetaMask is not installed. Please install the extension before proceeding."
        return
      }

      this.isConnecting = true
      this.error = ''

      try {
        if (typeof window.ethereum !== 'undefined') {
          // Get accounts from MetaMask
          const provider = new BrowserProvider(window.ethereum)
          const accounts = await provider.send('eth_requestAccounts', [])
          this.account = accounts[0]

          if (this.account.length > 0) {
            console.log('MetaMask connected:', this.account)

            this.router.push({ name: 'Home', params: { account: this.account } })
          } else {
            this.error = 'Account not found'
          }
        }
      } catch (err) {
        this.error = 'Error while connecting to MetaMask.'
        console.error('MetaMask connection error:', err)
      } finally {
        this.isConnecting = false
      }
    },
    // Link to MetaMask download page
    downloadMetaMask() {
      window.open('https://metamask.io/download/', '_blank')
    },
  },
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 480px;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.login-header {
  background: linear-gradient(135deg, #42b883, #35495e);
  color: white;
  padding: 2rem;
  text-align: center;
}

.logo-section {
  margin-bottom: 1rem;
}

.logo-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.app-title {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  font-size: 1rem;
  margin: 0;
  opacity: 0.9;
}

.login-content {
  padding: 2rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fee2e2;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid #fecaca;
}

.error-icon {
  font-size: 1.25rem;
}

.metamask-status {
  margin-bottom: 1.5rem;
}

.status-success,
.status-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.status-warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.status-icon {
  font-size: 1rem;
}

.login-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.metamask-button,
.download-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.metamask-button {
  background: linear-gradient(135deg, #f6851b, #e2761b);
  color: white;
  box-shadow: 0 4px 12px rgba(246, 133, 27, 0.3);
}

.metamask-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(246, 133, 27, 0.4);
}

.metamask-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.metamask-button.connecting {
  animation: pulse 2s infinite;
}

.download-button {
  background: linear-gradient(135deg, #42b883, #35495e);
  color: white;
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.3);
}

.download-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(66, 184, 131, 0.4);
}

.button-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.metamask-icon {
  font-size: 1.5rem;
}

.download-icon {
  font-size: 1.25rem;
}

.button-text {
  font-weight: 600;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
</style>
