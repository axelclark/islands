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
import { blankBoard, getRows, hit, miss } from "../utils/board"
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
  },
  mounted () {
    this.channel.on("player_guessed_coordinate", response => {
      this.processOpponentGuess(response);
    })
  },
  beforeDestroy () {
    this.channel.off("player_guessed_coordinate", response => {
      this.processOpponentGuess(response);
    })
  },
  methods: {
    processOpponentGuess: function (response) {
      let board = this.board;
      if (response.player !== this.player) {
        if (response.result.win === "win") {
          this.message = "Your opponent won.";
          board = hit(board, response.row, response.col);
        } else if (response.result.island !== "none") {
          this.message = "Your opponent forested your " + response.result.island + " island.";
          board = hit(board, response.row, response.col);
        } else if (response.result.hit === true) {
          this.message = "Your opponent hit your island.";
          board = hit(board, response.row, response.col);
        } else {
          this.message = "Your opponent missed.";
          board = miss(board, response.row, response.col);
        }
      }
      this.board = board;
    },

    allowDrop: function (event) {
      event.preventDefault();
    },

    dropHandler: function (event) {
      event.preventDefault();
      const data = event.dataTransfer.getData("text");
      const image = document.getElementById(data);
      const row = Number(event.target.dataset.row);
      const col = Number(event.target.dataset.col);
      this.positionIsland(event.target, image, row, col);
    },

    positionIsland: function (coordinate, island, row, col) {
      const params = {"player": this.player, "island": island.id, "row": row, "col": col};
      this.channel.push("position_island", params)
        .receive("ok", response => {
          coordinate.appendChild(island);
          island.class = "positioned_island_image";
          this.message = "Island Positioned!";
        })
        .receive("error", response => {
          this.message = "Oops!";
        })
    }
  }
}
</script>

<style scoped>
</style>
