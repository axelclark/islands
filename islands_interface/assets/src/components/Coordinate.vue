<template>
  <td :class="className" :data-row="row" :data-col="col" v-on:dragover="allowDrop" 
    v-on:drop="handleDrop" v-on:click="handleClick">
  </td>
</template>

<script>
export default {
  name: 'coordinate',
  props: {
    row: Number,
    col: Number,
    className: String
  },
  methods: {
    allowDrop: function (event) {
      event.preventDefault();
    },
    handleDrop: function (event) {
      this.$emit("droppedIsland", event)
    },
    handleClick: function (event) {
      this.$emit("clickedCoord", event)
    }
  }
}
</script>

<style scoped>
</style>
