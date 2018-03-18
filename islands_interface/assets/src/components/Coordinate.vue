<template>
    <td :class="className" :data-row="row" :data-col="col">
    </td>
</template>

<script>
export default {
  name: 'coordinate',
  props: {
    row: Number,
    col: Number,
    className: String,
  },
}
</script>

<style scoped>
</style>
