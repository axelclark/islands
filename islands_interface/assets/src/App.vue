<template>
  <game v-if="isGameStarted" :channel="channel" :player="player"/>
  <game-start v-else v-on:startGame="startGame"/>
</template>

<script>
import GameStart from './components/GameStart'
import Game from './components/Game'
import { Socket } from "phoenix";

export default {
  name: 'app',

  data () {
    return {
      isGameStarted: false,
      socket: null,
      channel: null,
      player: null
    }
  },

  components: {
    Game,
    GameStart
  },

  created () {
    this.socket = new Socket("/socket", {});
    this.socket.connect();
    console.log("Socket connected!")
  },

  methods: {
    startGame: function (action) {
      const player1_channel = this.newChannel("player1");
      const player2_channel = this.newChannel("player2");

      if (action === "start-game") {
        this.channel = player1_channel;
        this.player = "player1";
        this.join(player1_channel);
        this.newGame(player1_channel);
      } else {
        this.channel = player2_channel;
        this.player = "player2";
        this.join(player2_channel);
        this.addPlayer(player2_channel, "player2");
      }
      this.isGameStarted = true;
    },

    newChannel: function (screen_name) {
      return this.socket.channel("game:player1", {screen_name: screen_name});
    },

    join: function (channel) {
      channel.join()
        .receive("ok", response => {
          console.log("Joined successfully!");
        })
        .receive("error", response => {
          console.log("Unable to join");
        })
    },

    newGame: function (channel) {
      channel.push("new_game")
        .receive("ok", response => {
          console.log("New Game!");
        })
        .receive("error", response => {
          console.log("Unable to start a new game.");
        })
    },

    addPlayer: function (channel, player) {
      channel.push("add_player", player)
        .receive("ok", response => {
          console.log("Player added!");
        })
        .receive("error", response => {
          console.log("Unable to add new player: " + player, response);
        })
    }
  }
}
</script>

<style>
</style>
