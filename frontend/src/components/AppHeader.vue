<template>
  <header class="app-header">
    <div class="header-container">
      <div class="header-left">
        <div class="logo-section">
          <!-- <span class="logo-icon"></span> -->
          <span class="app-name">Boh (Cambiare nome)</span>
        </div>
      </div>

      <div class="header-center">
        <nav v-if="connectedAccount" class="main-navigation">
          <router-link :to="`/home/${connectedAccount}`" class="nav-link">
            <!-- <span class="nav-icon"></span> -->
            Home
          </router-link>
          <router-link :to="`/inventory/${connectedAccount}`" class="nav-link">
            <!-- <span class="nav-icon"></span> -->
            Inventory
          </router-link>
          <router-link :to="`/cashback/${connectedAccount}`" class="nav-link">
            <!-- <span class="nav-icon"></span> -->
            Cashback
          </router-link>
          <router-link :to="`/manufacturer/${connectedAccount}`" class="nav-link">
            <!-- <span class="nav-icon"></span> -->
            Manufacturer
          </router-link>
        </nav>
      </div>

      <div class="header-right">
        <div v-if="connectedAccount" class="user-menu">
          <button @click="toggleDropdown" class="user-button">
            <div class="metamask-avatar">🦊</div>
            <span class="user-address">{{ formatAddress(connectedAccount) }}</span>
            <span class="dropdown-arrow" :class="{ open: isDropdownOpen }">▼</span>
          </button>

          <div v-if="isDropdownOpen" class="dropdown-menu">
            <div class="account-info">
              <div class="account-label">Account connesso</div>
              <div class="account-address">{{ connectedAccount }}</div>
            </div>
            <div class="dropdown-divider"></div>
            <button @click="logout" class="logout-button">
              <span class="logout-icon"></span>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'AppHeader',
  data() {
    return {
      connectedAccount: '',
      isDropdownOpen: false,
    }
  },
  methods: {
    async checkConnectedAccount() {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          })
          if (accounts.length > 0) {
            this.connectedAccount = accounts[0]
          }
        } catch (error) {
          console.error('Error getting accounts:', error)
        }
      }
    },
    formatAddress(address) {
      if (!address) return ''
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    },
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen
    },
    logout() {
      this.connectedAccount = ''
      this.isDropdownOpen = false
      this.$router.push('/login')
    },
    closeDropdown() {
      this.isDropdownOpen = false
    },
  },
  mounted() {
    this.checkConnectedAccount()
  },
}

// TODO spostare la parte relativa alla gestione dei wallet su un file apposito
// try {
//   window.ethereum.on('accountsChanged', function (accounts) {
//     console.log('Account chainged to ', accounts[0])

//     // TODO effettuare il logout e rieffettuare il login con il nuovo account
//     location.reload()
//   })
// } catch (error) {
//   console.log(error)
// }
</script>

<style scoped>
.app-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 1.5rem;
}

.app-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.main-navigation {
  display: flex;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 0.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  position: relative;
}

.nav-link:hover {
  color: #2c3e50;
  background: #f1f5f9;
}

.nav-link.router-link-active {
  background: linear-gradient(135deg, #42b883, #35495e);
  color: white;
  box-shadow: 0 2px 4px rgba(66, 184, 131, 0.3);
}

.nav-icon {
  font-size: 1rem;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-menu {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-button:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.metamask-avatar {
  font-size: 1.25rem;
}

.user-address {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.dropdown-arrow {
  font-size: 0.75rem;
  color: #64748b;
  transition: transform 0.2s ease;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  min-width: 280px;
  padding: 0.5rem 0;
  z-index: 200;
}

.account-info {
  padding: 1rem;
}

.account-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.account-address {
  font-size: 0.875rem;
  color: #2c3e50;
  word-break: break-all;
  background: #f8fafc;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.dropdown-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0.5rem 0;
}

.logout-button {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 2rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: #ef4444;
  transition: all 0.2s ease;
  justify-content: right;
}

.logout-button:hover {
  background: #fef2f2;
  color: #dc2626;
}

.logout-icon {
  font-size: 1rem;
}
</style>
