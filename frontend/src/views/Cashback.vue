<template>
  <AppHeader></AppHeader>
  <CashbackCard></CashbackCard>
  <div></div>
</template>

<script>
// import LoginCard from '@/components/LoginCard.vue'
import AppHeader from '@/components/AppHeader.vue'
import CashbackCard from '@/components/CashbackCard.vue'

export default {
  name: 'MetaMaskConnect',
  components: {
    AppHeader,
    CashbackCard,
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
