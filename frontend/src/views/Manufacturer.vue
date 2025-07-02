<template>
  <AppHeader></AppHeader>
  <div class="manufacturer-page"><ManufactorerCard></ManufactorerCard></div>
</template>

<script>
import ManufactorerCard from '@/components/ManufacturerCard.vue'
import AppHeader from '@/components/AppHeader.vue'

export default {
  name: 'MetaMaskConnect',
  components: {
    ManufactorerCard,
    AppHeader,
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
