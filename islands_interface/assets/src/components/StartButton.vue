<template>
  <div class='button' @click='onClick'>{{ message }}</div>
</template>

<script>
export default {
  name: 'start-button',
  props: {
    message: {
      type: String,
      required: true
    },
    onClick: {
      type: Function,
      required: true
    }
  }
}
</script>

<style scoped>
</style>
