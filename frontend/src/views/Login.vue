<template>
  <div class="login-card"><LoginCard></LoginCard></div>
</template>

<script>
import LoginCard from '@/components/LoginCard.vue'

export default {
  name: 'MetaMaskConnect',
  components: {
    LoginCard,
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

<style>
.login-card {
  margin-top: 10rem;
  justify-self: center;
}
</style>
