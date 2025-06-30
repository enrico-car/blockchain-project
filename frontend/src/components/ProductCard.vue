<template>
  <div class="product-card">
    <div class="product-image-container">
      <img :src="product.image" :alt="product.name" class="product-image" loading="lazy" />
    </div>

    <div class="product-info">
      <h3 class="product-name">{{ product.productIdentification }}</h3>
      <div class="product-id-container">
        <span class="product-id-label">Lot ID:</span>
        <span class="product-id-value" :title="product.id">{{ shortId(product.lotId) }}</span>
        <button class="copy-id-button" @click="copyId">Copy</button>
        <span v-if="copied" class="copy-feedback">Copied!</span>
      </div>
      <div class="product-details">
        <div class="quantity-info">
          <div class="price-quantity">
            <div>
              <span class="quantity-label">Unit price: </span>
              <span class="price-value">{{ product.unitPrice }}</span>
            </div>
            <div>
              <span class="quantity-label">Quantity: </span>
              <span class="quantity-value">{{ product.quantity }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!--  -->
      <div v-if="showModal" class="modal-overlay">
        <div class="modal-content">
          <button class="modal-close" @click="showModal = false">×</button>
          <h2>Product Details</h2>
          <ul class="modal-info-list">
            <template v-for="key in infoKeys" :key="key">
              <li v-if="product[key]">
                <p>{{ formatLabel(key)}}: {{ product[key] }}</p>
              </li>
            </template>
          </ul>
        </div>
      </div>

      <div class="sell-control">
        <button class="more-info-button" @click="showModal = true">More info...</button>
        <div class="input-group">
          <input
            type="number"
            min="0"
            :max="product.quantity"
            v-model.number="sellAmount"
            class="amount-input"
          />
        </div>
        <button class="sell-button" @click="sell">Sell</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    product: {
      type: Object,
      required: true,
    },
  },
  emits: ['sell'],
  data() {
    return {
      sellAmount: 0,
      copied: false,
      showModal: false,
      infoKeys: [
        'productIdentification',
        'materials',
        'design',
        'specifications',
        'lifecycle',
        'installation_maintenance',
        'composition',
        'microplastics',
        'env_impact',
        'transport_packaging',
        'sustainability',
        'maintenance',
        'warranty',
        'energy_recovery',
        'substance_of_concern',
      ],
    }
  },
  methods: {
    shortId(id) {
      if (!id) return ''
        // Mostra i primi 4 e gli ultimi 4 caratteri (es: "abcd...1234")
        return id.length > 18 ? `${id.slice(0,9)}...${id.slice(-3)}` : id
    },
    copyId() {
      navigator.clipboard.writeText(this.product.lotId).then(() => {
        this.copied = true
        setTimeout(() => {
          this.copied = false
        }, 1200) 
      }).catch(() => {
        console.error('Errore durante la copia')
      })
    },
    sell() {
      if (this.sellAmount > 0 && this.sellAmount <= this.product.quantity) {
        // TODO Logica per vendere da gestire nel padre, non possiamo modificare il prop da qui
        this.$emit('sell', { id: this.product.lotId, amount: this.sellAmount })

        // Reset
        this.sellAmount = 0
      } else {
        alert('Invalid amount')
      }
    },
    formatLabel(key) {
      return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
    },
  },
}
</script>

<style scoped>
.product-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #42b883;
}

.product-image-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f8fafc;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.product-info {
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.product-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  line-height: 1.4;
}

.quantity-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.quantity-value {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  background: linear-gradient(135deg, #42b883, #35495e);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  min-width: 2rem;
  text-align: center;
}

/* Sell Process */

.sell-control {
  display: flex;
  align-items: center;
  justify-content: right;
}

.input-group {
  display: flex;
  align-items: stretch;
}

.amount-input {
  width: 60px;
  height: 60px;
  text-align: center;
  font-size: 1.2rem;
  border: 1px solid #ccc;
  border-radius: 6px 0 0 6px;
}

.amount-input:hover,
:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.sell-button {
  width: 20%;
  height: 100%;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 0 6px 6px 0;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.sell-button:hover {
  background-color: #c0392b;
}

/* Container ID */

.product-id-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #475569;
}

.product-id-label {
  font-weight: 500;
}

.product-id-value {
  font-family: monospace;
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.copy-id-button {
  padding: 0.25rem 0.5rem;
  font-size: 1rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.copy-id-button:hover {
  background-color: #2c9c74;
}

.copy-feedback {
  font-size: 0.75rem;
  color: #16a34a;
  transition: opacity 0.3s ease;
  animation: fadeInOut 2s ease forwards;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateY(-2px);
  }
  10% {
    opacity: 1;
    transform: translateY(0);
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-2px);
  }
}

/* More info modal display */

.more-info-button {
  /* margin-top: 0.5rem; */
  padding: 0.4rem 0.75rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  max-width: 100px;
  cursor: pointer;
  transition: background-color 0.3s;
  align-self: self-end;
  margin-right: auto;
}

.more-info-button:hover {
  background-color: #2c9c74;
}

.modal-overlay {
  position: absolute; /* cambiato da fixed a absolute */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(30, 41, 59, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  border-radius: 12px; /* opzionale, per arrotondare gli angoli */
}

.modal-content {
  max-width: 100%;  /* si adatta alla larghezza della card */
  max-height: 100%; /* si adatta all'altezza della card */
  overflow-y: auto;
  /* rimuovi width: 90% e max-width: 600px, lascia che si adatti */
  padding: 1rem;
  border-radius: 12px;
  background: white;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #e2e8f0;
  border: none;
  border-radius: 9999px;
  width: 32px;
  height: 32px;
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

.modal-close:hover {
  background: #cbd5e1;
}

.modal-info-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
}

.price-quantity {
  display: flex;
  gap: 4.8rem;
}

.price-value {
  font-size: 18px;
}

</style>
