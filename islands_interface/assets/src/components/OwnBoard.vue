<template>
  <div id="own_board">
    <div class="message_box">{{ message }}</div>
    <table class="board" id="ownBoard">
      <caption class="board_title">your board</caption>
      <header-row/>
      <tbody>
        <board-row v-for="n in 10" :coordinates="rows[n]" :value="n" :key="n">
        </board-row>
      </tbody>
    </table>
  </div>
</template>

<script>
import { blankBoard, getRows } from "../utils/board"
import HeaderRow from "./HeaderRow"
import BoardRow from "./BoardRow"

export default {
  name: "own-board",
  data () {
    return {
      board: blankBoard(),
      message: "Welcome!",
      islands: ["atoll", "dot", "l_shape", "s_shape", "square"]
    }
  },
  computed: {
    rows: function () {
      return getRows(this.board)
    }
  },
  props: {
    channel: Object,
    player: String
  },
  components: {
    HeaderRow,
    BoardRow
  }
}
</script>

<style scoped>
</style>
