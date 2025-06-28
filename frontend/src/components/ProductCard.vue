<template>
  <div class="product-card">
    <div class="product-image-container">
      <img :src="product.image" :alt="product.name" class="product-image" loading="lazy" />
    </div>

    <div class="product-info">
      <h3 class="product-name">{{ product.name }}</h3>
      <div class="product-details">
        <div class="quantity-info">
          <span class="quantity-label">Quantity:</span>
          <span class="quantity-value">{{ product.quantity }}</span>
        </div>
      </div>
      <div class="sell-control">
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
    }
  },
  methods: {
    sell() {
      if (this.sellAmount > 0 && this.sellAmount <= this.product.quantity) {
        // TODO Logica per vendere da gestire nel padre, non possiamo modificare il prop da qui
        this.$emit('sell', { id: this.product.id, amount: this.sellAmount })

        // Alert for notification
        alert('Sold ' + this.sellAmount + ' ' + this.product.name)

        // Reset
        this.sellAmount = 0
      } else {
        alert('Invalid amount')
      }
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
  gap: 0.75rem;
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
</style>
