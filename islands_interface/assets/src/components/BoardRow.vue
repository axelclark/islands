<template>
  <tr class="row">
    <box :value="value"/>
    <coordinate v-for="coord in coordinates" :row="coord.row" :col="coord.col"
      :className="coord.className" :key="coord.row + coord.col"
      v-on:droppedIsland="handleDrop"/>
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
  },
  methods: {
    handleDrop: function (event) {
      this.$emit("droppedIsland", event)
    }
  }
}
</script>

<style scoped>
</style>
