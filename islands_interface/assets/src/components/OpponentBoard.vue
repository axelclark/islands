<template>
  <div id="opponent_board">
    <div class="message_box">{{ message }}</div>
    <table class="board" id="opponentBoard">
      <caption class="board_title">your opponent's board</caption>
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
  name: "opponents-board",
  data () {
    return {
      board: blankBoard(),
      message: "No opponent yet.",
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
