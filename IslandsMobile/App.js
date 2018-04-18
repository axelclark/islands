import React from 'react'
import {
  Button,
  Image,
  ScrollView,
  StyleSheet, 
  Text, 
  TouchableHighlight,
  View 
} from 'react-native'

import _ from 'underscore';
import { Socket } from 'phoenix';

const socket = new Socket('ws://localhost:4000/socket', {});
socket.connect();

function blankBoard() {
  let board = {};

  for (let i = 1; i <= 10; i++) {
    for (let j = 1; j <= 10; j++) {
      board[i + ":" + j] = {row: i, col: j, className: "coordinate"};
    }
  }
  return board;
}

function getRows(board) {
  let rows = {1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: []};
  let boardValues = Object.values(board);

  _.each(boardValues, function(value) {
    rows[value.row].push(value);
  })
  return rows;
}

function hit(board, row, col) {
  board[row + ":" + col].className = "coordinate hit";
  return board;
}

function miss(board, row, col) {
  board[row + ":" + col].className = "coordinate miss";
  return board;
}

function inIsland(board, coordinates) {
  _.each(coordinates, function(coord) {
    board[coord.row + ":" + coord.col].className = "coordinate island";
  });
  return board;
}

function Coordinate(props) {
  return (
    <View style={styles.coordinate} />
  )
}

function Box(props) {
  return (
    <View style={styles.box}>
      <Text style={styles.boxText}>{props.value}</Text>
    </View>
  );
}

function MessageBox(props) {
  return (
    <View style={styles.messageBox}>
      <Text style={styles.messageText}>{props.message}</Text>
    </View>
  )
}

function HeaderRow(props) {
  const range = _.range(1,11);

  return (
    <View style={styles.row}>
        <Box />
        {range.map(function(i) {
          return (<Box value={i} key={i} />) 
        })}
    </View>
  );
}

class OwnBoard extends React.Component {
  constructor(props) {
    super(props),
      this.state = {
        board: blankBoard(),
        player: props.player,
        channel: props.channel,
        message: 'Welcome!',
        islands: ['atoll', 'dot', 'l_shape', 's_shape', 'square']
      }
  }

  handleClick(input) {
    console.log(input)
  }

  renderRow(coordinates, key) {
    return (
      <View style={styles.row} key={key}>
        <Box value={key} />
        {coordinates.map(function(coord, i) { 
          return ( 
            <Coordinate
              row={coord.row}
              col={coord.col}
              key={i}
            />
          )
        })}
      </View>
    )
  }

  render() {
    const { message } = this.state
    const rows = getRows(this.state.board)
    const range = _.range(1,11)
    const context = this;

    return (
      <View>
        <Text style={styles.boardTitle}>Own Board</Text>
        <MessageBox message={message} />
        <View style={styles.board} >
          <HeaderRow />
          {range.map(function(i) {
            return (context.renderRow(rows[i], i))
          })}
        </View>
        <View style={styles.button}>
          <Button
            onPress={() => this.handleClick('start-game')}
            title='Set Islands'
          />
        </View>
      </View>
    );
  }
}

class OpponentBoard extends React.Component {
  constructor(props) {
    super(props),
      this.state = {
        board: blankBoard(),
        player: props.player,
        channel: props.channel,
        message: 'No opponent yet.'
      }
  }

  renderRow(coordinates, key) {
    return (
      <View style={styles.row} key={key}>
        <Box value={key} />
        {coordinates.map(function(coord, i) { 
          return ( 
            <Coordinate
              row={coord.row}
              col={coord.col}
              key={i}
            />
          )
        })}
      </View>
    )
  }

  render() {
    const { message } = this.state
    const rows = getRows(this.state.board)
    const range = _.range(1,11)
    const context = this;

    return (
      <View>
        <Text style={styles.boardTitle}>Opponent's Board</Text>
        <MessageBox message={message} />
        <View style={styles.board} >
          <HeaderRow />
          {range.map(function(i) {
            return (context.renderRow(rows[i], i))
          })}
        </View>
      </View>
    );
  }
}

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
      <ScrollView>
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
        {<OwnBoard channel={this.state.channel} player={this.state.player} />}
        {<OpponentBoard channel={this.state.channel} player={this.state.player} />}
      </ScrollView>
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
  startText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18
  },
  imagesContainer: {
    margin: 10,
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  islandImages: {},
  messageBox: {
    margin: 10,
    borderWidth: 1
  },
  messageText: {
    textAlign: 'center',
    fontSize: 18,
    margin: 10
  },
  boardTitle: {
    fontSize: 24,
    textAlign: 'center',
    margin: 10
  },
  box: {
    width: 30,
    height: 30,
  },
  boxText: {
    textAlign: 'center',
  },
  board: {
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  row: {
    flexDirection: 'row',
  },
  coordinate: {
    width: 30,
    height: 30,
    borderWidth: 1,
    backgroundColor: 'blue'
  },
  button: {
    margin: 10
  }
})

export default Game
