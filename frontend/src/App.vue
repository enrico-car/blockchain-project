<template>
  <!-- Router outlet -->
   <Toast />
  <router-view />
</template>

<script>
import Toast from 'primevue/toast'

export default {
  name: 'App',
  components: { Toast },
}
</script>
