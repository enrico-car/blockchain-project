<template>
  <div>
    <AppHeader></AppHeader>
    <RequestManager></RequestManager>
  </div>
</template>

<script>
import RequestManager from '@/components/RequestManager.vue'
import AppHeader from '@/components/AppHeader.vue'

export default {
  name: 'HomePage',
  components: {
    AppHeader,
    RequestManager,
  },
  data() {
    return {
      account: '',
    }
  },
  mounted() {},
  setup() {},
  methods: {},
}
</script>
