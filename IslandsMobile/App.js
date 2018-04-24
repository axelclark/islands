import React from 'react'
import {
  Animated,
  Button,
  Image,
  PanResponder,
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
        <View onLayout={this.props.onLayout} style={styles.board} >
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

  componentDidMount() {
    this.state.channel.on("player_added", response => {
      this.processPlayerAdded();
    })
  }

  processPlayerAdded() {
    this.setState({message: "Both players present."});
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

class Island extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pan: new Animated.ValueXY()
    };
  }

  componentWillMount() {
    this._animatedValueX = 0;
    this._animatedValueY = 0; 
    this.state.pan.x.addListener((value) => this._animatedValueX = value.value);
    this.state.pan.y.addListener((value) => this._animatedValueY = value.value);

    // Initialize PanResponder with move handling
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (e, gesture) => true,
      onStartShouldSetResponder: (e, gesture) => true,
      onPanResponderGrant: (e, gestureState) => {
        this.state.pan.setOffset({x: this._animatedValueX, y: this._animatedValueY})
        this.state.pan.setValue({x: 0, y: 0})
        this.props.setScroll(false)
      },
      onPanResponderMove: Animated.event([
        null, { dx: this.state.pan.x, dy: this.state.pan.y },
        this.state.pan.setValue({x: 0, y: 0})
      ]),
      onPanResponderRelease: (e, gesture) => {
        this.state.pan.flattenOffset()
        this.props.setScroll(true)
        console.log(gesture)
        console.log('onBoard: ', this.props.onRelease(gesture))
      }
    });
  }

  render() {
    const { source, style } = this.props
    const panStyle = {
      transform: this.state.pan.getTranslateTransform()
    }

    return (
      <Animated.Image 
        source={source} 
        style={[panStyle, style]}
        {...this.panResponder.panHandlers}
      />
    )
  }
}

class Game extends React.Component {
  constructor() {
    super(),
      this.state = {
        isGameStarted: false,
        channel: null,
        player: null,
        scroll: true,
        boardValues: {y: 178, width: 272, x: 89, height: 272} 
      },
      this.handlePress = this.handlePress.bind(this)
      this.setScroll = this.setScroll.bind(this)
      this.setBoardValues = this.setBoardValues.bind(this)
      this.isBoard = this.isBoard.bind(this)
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

  setScroll(bool) {
    this.setState({scroll: bool})
  }

  setBoardValues(event){
      console.log('onLayout', event.nativeEvent.layout)
  }

  isBoard(gesture){
    const { y, width, x, height } = this.state.boardValues 
    console.log('boardValues', this.state.boardValues)
    console.log('moveX', gesture.moveX)
    console.log('moveY', gesture.moveY)
    var dz = this.state.boardValues;
    console.log('x coord', Math.floor(((gesture.moveX - x)/ (width / 10 )) + 1))
    console.log('y coord', Math.floor(((gesture.moveY - y)/ (height / 10 )) + 1))
    return (
      gesture.moveY > dz.y 
      && gesture.moveY < dz.y + dz.height
      && gesture.moveX > dz.x 
      && gesture.moveX < dz.x + dz.width
    )
  }

  renderGame() {
    return (
      <ScrollView scrollEnabled={this.state.scroll}>
        {
          <OwnBoard 
            channel={this.state.channel} 
            player={this.state.player} 
            onLayout={this.setBoardValues}
          />
        }
        <View style={styles.imagesContainer}>
          <Island 
            source={require('./images/atoll.png')} 
            style={[styles.islandImages, {width: 60, height: 90}]} 
            setScroll={this.setScroll}
            onRelease={this.isBoard}
          />
          <Island 
            source={require('./images/dot.png')} 
            style={[styles.islandImages, {width: 30, height: 30}]} 
            setScroll={this.setScroll}
            onRelease={this.isBoard}
          />
          <Island 
            source={require('./images/l_shape.png')} 
            style={[styles.islandImages, {width: 60, height: 90}]} 
            setScroll={this.setScroll}
            onRelease={this.isBoard}
          />
          <Island 
            source={require('./images/s_shape.png')} 
            style={[styles.islandImages, {width: 90, height: 60}]} 
            setScroll={this.setScroll}
            onRelease={this.isBoard}
          />
          <Island 
            source={require('./images/square.png')} 
            style={[styles.islandImages, {width: 60, height: 60}]} 
            setScroll={this.setScroll}
            onRelease={this.isBoard}
          />
        </View>
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
