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

              <div class="mandatory-separetor">
                <p>Mandatory informations</p>
              </div>

              <div class="form-group">
                <label for="productName">Name</label>
                <input
                  id="productName"
                  v-model="newProduct.productIdentification"
                  type="text"
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div class="form-group">
                <label for="productMaterial">Material</label>
                <input
                  id="productMaterial"
                  v-model="newProduct.materials"
                  type="text"
                  placeholder="Enter product material"
                  required
                />
              </div>
              <div class="optional-separetor">
                <p>Optional informations</p>
              </div>
              <div class="form-group">
                <label for="design">Design</label>
                <input
                  id="design"
                  v-model="newProduct.design"
                  type="text"
                  placeholder="Enter product design"
                />
              </div>
              <div class="form-group">
                <label for="specifications">Specifications</label>
                <input
                  id="specifications"
                  v-model="newProduct.specifications"
                  type="text"
                  placeholder="Enter product specifications"
                />
              </div>
              <div class="form-group">
                <label for="lifecycle">Lifecycle</label>
                <input
                  id="lifecycle"
                  v-model="newProduct.lifecycle"
                  type="text"
                  placeholder="Enter product lifecycle"
                />
              </div>
              <div class="form-group">
                <label for="installation_maintenance">Installation</label>
                <input
                  id="installation_maintenance"
                  v-model="newProduct.installation_maintenance"
                  type="text"
                  placeholder="Enter product Installation"
                />
              </div>
              <div class="form-group">
                <label for="composition">Composition</label>
                <input
                  id="composition"
                  v-model="newProduct.composition"
                  type="text"
                  placeholder="Enter product composition"
                />
              </div>
              <div class="form-group">
                <label for="microplastics">Microplastics</label>
                <input
                  id="microplastics"
                  v-model="newProduct.microplastics"
                  type="text"
                  placeholder="Enter product microplastics"
                />
              </div>
              <div class="form-group">
                <label for="env_impact">Env impact</label>
                <input
                  id="env_impact"
                  v-model="newProduct.env_impact"
                  type="text"
                  placeholder="Enter product env impact"
                />
              </div>
              <div class="form-group">
                <label for="transport_packaging">Transport packaging</label>
                <input
                  id="transport_packaging"
                  v-model="newProduct.transport_packaging"
                  type="text"
                  placeholder="Enter product transport packaging"
                />
              </div>
              <div class="form-group">
                <label for="sustainability">Sustainability</label>
                <input
                  id="sustainability"
                  v-model="newProduct.sustainability"
                  type="text"
                  placeholder="Enter product sustainability"
                />
              </div>
              <div class="form-group">
                <label for="maintenance">Maintenance</label>
                <input
                  id="maintenance"
                  v-model="newProduct.maintenance"
                  type="text"
                  placeholder="Enter product maintenance"
                />
              </div>
              <div class="form-group">
                <label for="warranty">Warranty</label>
                <input
                  id="warranty"
                  v-model="newProduct.warranty"
                  type="text"
                  placeholder="Enter product warranty"
                />
              </div>
              <div class="form-group">
                <label for="energy_recovery">energy/recovery</label>
                <input
                  id="energy_recovery"
                  v-model="newProduct.energy_recovery"
                  type="text"
                  placeholder="Enter product Energy/Recovery"
                />
              </div>
              <div class="form-group">
                <label for="substance_of_concern">Substance of concern</label>
                <input
                  id="substance_of_concern"
                  v-model="newProduct.substance_of_concern"
                  type="text"
                  placeholder="Enter product substance of concern"
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
            require
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
import {
  createProduct,
  removeProduct,
  getProduct,
  getAllDbProducts,
  getAllProducts,
  createProductLot,
  base64DataUrlToFile,
} from '@/services/product.services'
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
        productIdentification: '',
        materials: '',
        design: '',
        specifications: '',
        lifecycle: '',
        installation_maintenance: '',
        composition: '',
        microplastics: '',
        env_impact: '',
        transport_packaging: '',
        sustainability: '',
        maintenance: '',
        warranty: '',
        energy_recovery: '',
        substance_of_concern: '',
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
  async mounted() {
    // TODO non riesco a vedere idati del prodotto dalla blockchain
    // this.getProducts()
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
      this.getProducts()
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
      this.newProduct.productIdentification = ''
      this.newProduct.materials = ''
      this.newProduct.design = ''
      this.newProduct.specifications = ''
      this.newProduct.lifecycle = ''
      this.newProduct.installation_maintenance = ''
      this.newProduct.composition = ''
      this.newProduct.microplastics = ''
      this.newProduct.env_impact = ''
      this.newProduct.transport_packaging = ''
      this.newProduct.sustainability = ''
      this.newProduct.maintenance = ''
      this.newProduct.warranty = ''
      this.newProduct.energy_recovery = ''
      this.newProduct.substance_of_concern = ''
      this.removeImage()
    },
    resetLot() {
      this.newLot.expirationDate = ''
      this.newLot.productId = ''
      this.newLot.totalQuantity = ''
      this.newLot.unitPrice = ''
    },
    async getProducts() {
      let products = await getAllDbProducts()
      products = products.map((product) => ({
        id: product.id,
        name: product.productIdentification,
      }))
      this.products = products
      console.log(products)
    },
    async submitProductRequest() {
      console.log('Creating new product...')
      console.log('Name: ', this.newProduct.productIdentification, 'Material: ', this.newProduct.materials)
      
      let dpp = {
        ...this.newProduct,
        image: this.newProduct.image ? this.newProduct.image : base64DataUrlToFile("data:image/svg+xml;base64," + btoa(decodeURIComponent(defaultImage.split(',')[1])), "default.img"),
      }

      console.log(dpp)

      let result = await createProduct(dpp)
      
      this.closeCreateProduct()
    },
    async submitLotRequest() {
      console.log('Creating new lot...')
      console.log(this.newLot)
      console.log(await createProductLot(this.newLot))

      this.closeCreateLot()
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
  padding: 0.5rem;
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

.optional-separetor{
  border-bottom: 1px solid #e2e8f0;
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-size: 16px
}

.mandatory-separetor{
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 1rem;
  font-size: 16px
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
  overflow-y: auto; 
  max-height: 50vh;
  padding-left: 1rem;
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
