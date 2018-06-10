<template>
  <thead class="row">
    <box/>
    <box v-for="n in 10" :key="n" :value="n"></box>
  </thead>
</template>

<script>
import Box from "./Box"

export default {
  name: 'header-row',
  components: {
    Box
  }
}
</script>

<style scoped>
</style>
