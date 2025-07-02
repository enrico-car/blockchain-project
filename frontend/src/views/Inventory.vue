<template>
  <AppHeader></AppHeader>
  <Products></Products>
  <div></div>
</template>

<script>
import AppHeader from '@/components/AppHeader.vue'
import Products from '@/components/ProductsSection.vue'

export default {
  name: 'MetaMaskConnect',
  components: {
    AppHeader,
    Products,
  },
  data() {
    return {
      isMetaMaskAvailable: false,
      isConnecting: false,
      error: '',
      account: '',
    }
  },
  mounted() {},
  setup() {},
  methods: {},
}
</script>
