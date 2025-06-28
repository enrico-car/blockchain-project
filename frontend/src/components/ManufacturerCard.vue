<template>
  <div class="component">
    <h1 class="title">Manufacturer Menu</h1>

    <div class="create-card">
      <div class="card-title">
        <h1>Products & Lots</h1>
      </div>
      <div class="header-card">
        <div class="button-box">
          <button @click="showCreateProduct" class="create-button">
            <span class="plus-icon">+</span>
            Create Product
          </button>

          <button @click="showCreateLot" class="create-button">
            <span class="plus-icon">+</span>
            Create Lot
          </button>
        </div>
      </div>
    </div>

    <div class="create-card">
      <div class="card-title">
        <h1>Cashback</h1>
      </div>
      <MultiplierCard></MultiplierCard>
    </div>

    <!-- Create New Product -->
    <div v-if="createProduct" class="modal-overlay" @click="closeCreateProduct">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Create New Product</h3>
          <button @click="closeCreateProduct" class="close-button">&times;</button>
        </div>
        <form @submit.prevent="submitProductRequest" class="modal-form">
          <div class="form-row">
            <div class="form-left">
              <div class="image-preview">
                <img :src="imagePreview" alt="Product Image" />
              </div>

              <div class="image-selector">
                <input type="file" @change="handleImageUpload" accept="image/*" />

                <button
                  type="button"
                  class="remove-image-button"
                  @click="removeImage"
                  v-if="imagePreview !== defaultImage"
                >
                  &times;
                </button>
              </div>
            </div>

            <div class="vertical-divider"></div>

            <div class="form-right">
              <div class="form-group">
                <label for="productName">Name</label>
                <input
                  id="productName"
                  v-model="newProduct.name"
                  type="text"
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div class="form-group">
                <label for="productMaterial">Material</label>
                <input
                  id="productMaterial"
                  v-model="newProduct.material"
                  type="text"
                  placeholder="Enter product material"
                  required
                />
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeCreateProduct" class="cancel-button">Cancel</button>
            <button type="submit" class="submit-button">Create Request</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Create New Lot -->
  <div v-if="createLot" class="modal-overlay" @click="closeCreateLot">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Create New Lot</h3>
        <button @click="closeCreateLot" class="close-button">&times;</button>
      </div>
      <form @submit.prevent="submitLotRequest" class="modal-form">
        <!-- Autocomplete menu -->
        <div class="form-group">
          <label>Product</label>
          <SuggestionInput v-model="newLot.productId" :suggestions="products"></SuggestionInput>
        </div>
        <div class="form-group">
          <label for="expirationDate">Expiration Date</label>
          <input
            id="expirationDate"
            v-model="newLot.expirationDate"
            type="text"
            placeholder="Enter expiration date"
            required
          />
        </div>
        <div class="form-group">
          <label for="quantity">Quantity</label>
          <input
            id="quantity"
            v-model="newLot.totalQuantity"
            type="text"
            placeholder="Enter quantity"
            required
          />
        </div>
        <div class="form-group">
          <label for="unitPrice">Unit Price</label>
          <input
            id="unitPrice"
            v-model="newLot.unitPrice"
            type="text"
            placeholder="Enter unit price"
            required
          />
        </div>
        <div class="modal-actions">
          <button type="button" @click="closeCreateLot" class="cancel-button">Cancel</button>
          <button type="submit" class="submit-button">Create Request</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
// TODO implementare una lista di prodotti collegata al database, in modo da poter far vedere i possibili prodotti in modo visivo
import { createProduct, removeProduct, getProduct } from '@/services/product.services'
import defaultImage from '@/assets/logo.svg'
import SuggestionInput from './SuggestionInput.vue'
import MultiplierCard from './MultiplierCard.vue'

export default {
  components: {
    SuggestionInput,
    MultiplierCard,
  },
  data() {
    return {
      account: '',
      createProduct: false,
      createLot: false,
      newProduct: {
        name: '',
        material: '',
      },
      newLot: {
        expirationDate: '',
        totalQuantity: '',
        unitPrice: '',
        productId: '',
      },
      defaultImage: defaultImage,
      imagePreview: defaultImage,
      products: ['Product 1', 'Product 2', 'Product 3', 'Product 4'],
    }
  },
  methods: {
    creteProduct() {
      console.log('Creating product...')
      //   createProduct()
    },
    showCreateProduct() {
      this.createProduct = true
    },
    showCreateLot() {
      this.createLot = true
    },
    closeCreateProduct() {
      this.createProduct = false
      this.resetProduct()
    },
    closeCreateLot() {
      this.createLot = false
      this.resetLot()
    },
    resetProduct() {
      this.newProduct.name = ''
      this.newProduct.material = ''
      this.removeImage()
    },
    resetLot() {
      this.newLot.expirationDate = ''
      this.newLot.productId = ''
      this.newLot.totalQuantity = ''
      this.newLot.unitPrice = ''
    },
    async submitProductRequest() {
      console.log('Creating new product...')
      console.log('Name: ', this.newProduct.name, 'Material: ', this.newProduct.material)
      var dpp = {
        productIdentification: this.newProduct.name,
        materials: this.newProduct.material,
        image: this.newProduct.image,
      }

      await createProduct(dpp)

      //createproduct modifies dpp and so the final hash
      // delete dpp.id;
      // await removeProduct(dpp);

      //id is present as generated from createProduct
      await getProduct(dpp.id)

      this.resetProduct()
    },
    async submitLotRequest() {
      console.log('Creating new lot...')
      console.log(this.newLot)

      this.resetLot()
    },
    handleImageUpload(event) {
      const file = event.target.files[0]
      if (file) {
        this.newProduct.image = file
        this.imagePreview = URL.createObjectURL(file)
      }
    },
    removeImage() {
      this.newProduct.image = null
      this.imagePreview = this.defaultImage
    },
  },
}
</script>

<style>
.component {
  max-width: 1200px;
  padding-left: 2rem;
  padding-right: 2rem;
  margin: auto;
}

.create-card {
  max-width: 1200px;
  padding: 2rem 0;
  margin: auto;
}

.button-box {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 3rem;
}

.header-card {
  flex-direction: column;
  align-items: stretch;
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* margin-bottom: 1rem; */
  flex-wrap: wrap;
  gap: 1rem;

  border-style: solid;
  border-width: 1px;
  border-color: #e2e8f0;
  border-radius: 8px;
  padding: 2rem;

  overflow: hidden;
}

.create-button {
  display: flex;
  flex: 1;
  width: 175px;
  min-width: 0px;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #42b883, #35495e);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  justify-content: center;
}

.create-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin-top: 1rem;
}
.card-title {
  font-size: 0.7rem;
  color: #2c3e50;
}

/* Overlay setup */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 900px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-form {
  padding: 0 1rem 1.5rem 1rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}
.form-group {
  display: flex;
  padding: 1.5rem;
  gap: 1rem;
  align-items: center;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.cancel-button,
.submit-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button {
  background: #f1f5f9;
  color: #64748b;
}

.cancel-button:hover {
  background: #e2e8f0;
}

.submit-button {
  background: #42b883;
  color: white;
}

.submit-button:hover {
  background: #369870;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f1f5f9;
  color: #2c3e50;
}

/* Divider style */

.form-row {
  display: flex;
  flex-direction: row;
  /* gap: 1rem; */
  margin-top: 2rem;
}

.form-left {
  flex: 1; /* 1 parte su 3 */
  min-width: 0;
}

.form-right {
  flex: 2; /* 2 parti su 3 */
  min-width: 0;
}

.vertical-divider {
  width: 1px;
  background-color: #e2e8f0;
  align-self: stretch;
}

/* Image management */

.form-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.image-preview {
  width: 100%;
  max-width: 200px;
  aspect-ratio: 1 / 1;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.remove-image-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.remove-image-button:hover {
  color: black;
  background-color: #f1f5f9;
}

.image-selector {
  display: flex;
  align-items: center;
}
</style>
