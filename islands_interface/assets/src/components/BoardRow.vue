<template>
  <tr class="row">
    <box :value="value"/>
    <coordinate v-for="coord in coordinates" :row="coord.row" :col="coord.col" :className="coord.className" :key="coord.row + coord.col"></coordinate>
  </tr>
</template>

<script>
import Box from "./Box"
import Coordinate from "./Coordinate"

export default {
  name: 'board-row',
  components: {
    Box,
    Coordinate
  },
  props: {
    value: Number,
    coordinates: Array
  }
}
</script>

<style scoped>
</style>
