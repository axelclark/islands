<template>
  <div id="opponent_board">
    <div class="message_box">{{ message }}</div>
    <table class="board" id="opponentBoard">
      <caption class="board_title">your opponent's board</caption>
      <header-row/>
      <tbody>
        <board-row v-for="n in 10" :coordinates="rows[n]" :value="n" :key="n" 
          v-on:clickedCoord="handleClick"/>
      </tbody>
    </table>
  </div>
</template>

<script>
import { blankBoard, getRows, hit, miss, inIsland } from "../utils/board"
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
  },

  mounted () {
    this.channel.on("player_added", response => {
      this.processPlayerAdded();
    })

    this.channel.on("player_set_islands", response => {
      this.processOpponentSetIslands(response);
    })

    this.channel.on("player_guessed_coordinate", response => {
      this.processGuess(response);
    })
  },

  beforeDestroy () {
    this.channel.off("player_added", response => {
      this.processPlayerAdded();
    })

    this.channel.off("player_set_islands", response => {
      this.processOpponentSetIslands();
    })

    this.channel.off("player_guessed_coordinate", response => {
      this.processGuess(response);
    })
  },

  methods: {
    processPlayerAdded: function () {
      this.message = "Both players present.";
    },

    processOpponentSetIslands: function (response) {
      if (this.player !== response.player) {
        this.message = "Your opponent set their islands.";
      }
    },

    handleClick: function (eventl) {
      let row = event.target.dataset.row;
      let col = event.target.dataset.col;
      this.guessCoordinate(this.player, row, col);
    },

    guessCoordinate: function (player, row, col) {
      const params = {"player": player, "row": row, "col": col};
      this.channel.push("guess_coordinate", params)
        .receive("error", response => {
          this.message = response.reason;
        })
    },

    processGuess: function (response) {
      let board = this.board;
      if (response.player === this.player) {
        if (response.result.win === "win") {
          this.message = "You won!";
          board = hit(board, response.row, response.col);
        } else if (response.result.island !== "none") {
          this.message = "You forested your opponent's " + response.result.island + " island!";
          board = hit(board, response.row, response.col);
        } else if (response.result.hit === true) {
          this.message = "It's a hit!";
          board = hit(board, response.row, response.col);
        } else {
          this.message = "Oops, you missed.";
          board = miss(board, response.row, response.col);
        }
      }

      this.board = board;
    }
  }
}
</script>

<style scoped>
</style>
