import React from 'react'
import {
  Image,
  StyleSheet, 
  Text, 
  TouchableHighlight,
  View 
} from 'react-native'

import { Socket } from 'phoenix';

const socket = new Socket('ws://localhost:4000/socket', {});
socket.connect();

class Game extends React.Component {
  constructor() {
    super(),
      this.state = {
        isGameStarted: false,
        channel: null,
        player: null,
      },
      this.handlePress = this.handlePress.bind(this)
  }

  renderStartButtons() {
    return (
      <View>
        <TouchableHighlight
          style={styles.startBox}
          onPress={() => this.handlePress("start-game")} 
        >
          <Text style={styles.startText}>Start the Demo Game</Text>
        </TouchableHighlight>
        <TouchableHighlight 
          style={styles.startBox}
          onPress={() => this.handlePress("join-game")} 
        >
          <Text style={styles.startText}>Join the Demo Game</Text>
        </TouchableHighlight>
      </View>
    )
  }

  newChannel(screen_name) {
    return socket.channel("game:player1", {screen_name: screen_name});
  }

  join(channel) {
    channel.join()
      .receive("ok", response => {
         console.log("Joined successfully!");
       })
      .receive("error", response => {
         console.log("Unable to join");
       })
  }

  newGame(channel) {
    channel.push("new_game")
      .receive("ok", response => {
         console.log("New Game!");
       })
      .receive("error", response => {
         console.log("Unable to start a new game.");
       })
  }

  addPlayer(channel, player) {
    channel.push("add_player", player)
      .receive("ok", response => {
         console.log("Player added!");
       })
      .receive("error", response => {
          console.log("Unable to add new player: " + player, response);
        })
  }

  handlePress(action) {
    const player1_channel = this.newChannel("player1");
    const player2_channel = this.newChannel("player2");

    if (action === "start-game") {
      this.setState({channel: player1_channel});
      this.setState({player: "player1"});
      this.join(player1_channel);
      this.newGame(player1_channel);
    } else {
      this.setState({channel: player2_channel});
      this.setState({player: "player2"});
      this.join(player2_channel);
      this.addPlayer(player2_channel, "player2");
    }
    this.setState({isGameStarted: true})
  }

  renderGame() {
    return (
      <View>
        <View style={styles.imagesContainer}>
          <Image 
            source={require('./images/atoll.png')} 
            style={[styles.islandImages, {width: 60, height: 90}]} 
          />
          <Image 
            source={require('./images/dot.png')} 
            style={[styles.islandImages, {width: 30, height: 30}]} 
          />
          <Image 
            source={require('./images/l_shape.png')} 
            style={[styles.islandImages, {width: 60, height: 90}]} 
          />
          <Image 
            source={require('./images/s_shape.png')} 
            style={[styles.islandImages, {width: 90, height: 60}]} 
          />
          <Image 
            source={require('./images/square.png')} 
            style={[styles.islandImages, {width: 60, height: 60}]} 
          />
        </View>
        <Text>Your Board Here</Text>
        <Text>Your Opponent's Board Here</Text>
      </View>
    )
  }

  render() {
    let contents
    const { isGameStarted } = this.state
    if(isGameStarted){
      contents = this.renderGame()
    } else {
      contents = this.renderStartButtons()
    }
    return (
      <View style={[styles.container, { justifyContent: !isGameStarted ? 'center' : null }]}>
        { contents }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 20
  },
  startBox: {
    padding: 20,
    justifyContent: 'center',
    borderColor: 'rgba(23, 31, 61, .2)',
    borderWidth: 1,
    margin: 20,
    backgroundColor: 'green'
  },
  imagesContainer: {
    margin: 10,
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  islandImages: {},
  startText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18
  }
})

export default Game
