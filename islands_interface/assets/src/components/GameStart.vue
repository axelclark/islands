<template>
  <div>
    <start-button :onClick='() => handleClick("start-game")' message='Start the Demo Game'/>
    <start-button :onClick='() => handleClick("join-game")' message='Join the Demo Game'/>
  </div>
</template>

<script>
import StartButton from './StartButton'
export default {
  name: 'game-start',
  components: {
    StartButton
  },
  methods: {
    handleClick: function (action) {
      this.$emit('startGame', action)
    }
  }
}
</script>

<style scoped>
</style>
