<template>
  <div>
    <div id="holder">
      <img id="atoll" src="images/atoll.png" width="60" height="90" draggable="true" v-on:ondragstart.native="dragStartHandler" />
      <img id="dot" src="images/dot.png" width="30" height="30" draggable="true" v-on:ondragstart.native="dragStartHandler" />
      <img id="l_shape" src="images/l_shape.png" width="60" height="90" draggable="true" v-on:ondragstart.native="dragStartHandler" />
      <img id="s_shape" src="images/s_shape.png" width="90" height="60" draggable="true" v-on:ondragstart.native="dragStartHandler" />
      <img id="square" src="images/square.png" width="60" height="60" draggable="true" v-on:ondragstart.native="dragStartHandler" />
    </div>
    <own-board :channel="channel" :player="player" />
  </div>
</template>

<script>
import OwnBoard from "./OwnBoard"

export default {
  name: 'game',
  props: {
    channel: Object,
    player: String
  },
  components: {
    OwnBoard
  },
  methods: {
    dragStartHandler: function (event) {
      console.log("dragging")
      event.dataTransfer.setData("text/plain", event.target.id);
    }
  }
}
</script>

<style scoped>
</style>
