<template>
  <div>
    <button @click="pingBackend">Test Backend Connection</button>
    <p>Response: {{ response }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      response: ''
    }
  },
  methods: {
    async pingBackend() {
      try {
        // 💡 usa l'istanza globale $api
        const res = await this.$api.get('/')
        this.response = res.data
      } catch (err) {
        this.response = `Error: ${err.message}`
      }
    }
  }
}
</script>
