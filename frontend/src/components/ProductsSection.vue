<template>
  <div class="products-page-wrapper">
    <div class="products-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1 class="page-title">My Inventory</h1>
          </div>

          <div class="stats-section">
            <div class="stat-card">
              <span class="stat-number">{{ productStats.total }}</span>
              <span class="stat-label">Lots</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">{{ productStats.totalQuantity }}</span>
              <span class="stat-label">Products</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="search-section">
        <div class="search-container">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search your products..."
              class="search-input"
            />
            <button v-if="searchQuery" @click="clearSearch" class="clear-button">✕</button>
          </div>
        </div>
      </div>

      <!-- Results Summary -->
      <div class="results-summary">
        <span class="results-count"> {{ filteredProducts.length }} lots found </span>
        <span v-if="searchQuery" class="search-term"> for "{{ searchQuery }}" </span>
      </div>

      <!-- Products Grid -->
      <div class="products-grid" v-if="filteredProducts.length > 0">
        <ProductCard
          v-for="product in filteredProducts"
          :key="product.id"
          :product="product"
          @sell="sell"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { getAllDbProducts, getAllProducts, getLot, getProduct } from '@/services/product.services'
import ProductCard from './ProductCard.vue'
import defaultImage from '@/assets/logo.svg'
import { getInventory } from '@/services/inventory.services'
import { processLots } from '@/utils/abi.config'

export default {
  components: {
    ProductCard,
  },
  data() {
    return {
      products: [],
      searchQuery: '',
    }
  },
  mounted() {
    this.getProducts()
  },
  computed: {
    filteredProducts() {
      let filtered = this.products

      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase().trim()
        filtered = filtered.filter((product) => product.productIdentification.toLowerCase().includes(query))
      }
      return filtered
    },
    productStats() {
      const total = this.products.length
      const available = this.products.filter((p) => p.quantity > 0).length
      const totalQuantity = this.products.reduce((sum, p) => sum + p.quantity, 0)
      return { total, available, totalQuantity }
    },
  },
  methods: {
    clearSearch() {
      this.searchQuery = ''
    },
    sell(item) {
      console.log('Selling...')

      let product = this.products.find((p) => p.id === item.id)
      product.quantity = parseInt(product.quantity) - parseInt(item.amount)
    },
    async getProducts() {
      // console.log(await getAllProducts())
      // console.log(await getAllDbProducts())
      // Call the db to display the product info
      // this.products = await getAllDbProducts()
      // console.log(await getInventory())
      let { lotIds, quantities } = await getInventory();
      let ids = lotIds;

      if (ids.length === 0) {
        return;
      }

      console.log(ids);

      const results = await Promise.all(
        ids.map(async (element, index) => {
          const lot = await getLot(element);
          return {
            ...lot,           // proprietà originali del lot
            6: element,   // aggiungi l'id
            7: quantities[index], // aggiungi la quantità corrispondente
          };
        })
      );

      console.log("resulto: ", results)
      
      // console.log(await processLots(results))
      this.products = await processLots(results)

    },
  },
}
</script>

<style scoped>
.products-page-wrapper {
  min-height: 100vh;
  background: #f8fafc;
}

.products-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Page Header */
.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 2rem;
}

.title-section {
  flex: 1;
  min-width: 300px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.stats-section {
  display: flex;
  gap: 1rem;
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

/* Search Section */
.search-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  font-size: 1.25rem;
  color: #64748b;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: #f8fafc;
}

.search-input:focus {
  outline: none;
  border-color: #42b883;
  background: white;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.clear-button {
  position: absolute;
  right: 1rem;
  background: #e2e8f0;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.clear-button:hover {
  background: #cbd5e1;
  color: #374151;
}

/* Results Summary */
.results-summary {
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
}

.results-count {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.search-term {
  font-size: 0.875rem;
  color: #64748b;
  font-style: italic;
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
</style>
