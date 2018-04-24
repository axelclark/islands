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
  TouchableOpacity,
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
      board[i + ":" + j] = {row: i, col: j, className: "water"};
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
  board[row + ":" + col].className = "hit";
  return board;
}

function miss(board, row, col) {
  board[row + ":" + col].className = "miss";
  return board;
}

function inIsland(board, coordinates) {
  _.each(coordinates, function(coord) {
    board[coord.row + ":" + coord.col].className = "island";
  });
  return board;
}

function Coordinate(props) {
  return (
    <TouchableOpacity 
      style={[styles.coordinate, styles[props.className]]} 
      onPress={() => props.handlePress(props.row, props.col)}
    />
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

        if(this.props.onRelease(gesture, this.props.island)){
          console.log('added coord')
        }else{
          Animated.spring(
            this.state.pan,
            {toValue:{x:0,y:0}}
          ).start();
        }
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

class OwnBoard extends React.Component {
  constructor(props) {
    super(props),
      this.state = {
        board: blankBoard(),
        player: props.player,
        channel: props.channel,
        message: 'Welcome!',
        islands: ['atoll', 'dot', 'l_shape', 's_shape', 'square'],
        islandsSet: false,
        boardValues: {y: 178, width: 272, x: 89, height: 272} 
      }
      this.handleRelease = this.handleRelease.bind(this)
      this.handleSetIslands = this.handleSetIslands.bind(this)
      this.handlePress = this.handlePress.bind(this)
  }

  componentDidMount() {
    this.state.channel.on("player_guessed_coordinate", response => {
      this.processOpponentGuess(response);
    })
  }

  componentWillUnmount() {
    this.state.channel.off("player_guessed_coordinate", response => {
      this.processOpponentGuess(response);
    })
  }

  renderRow(coordinates, key, handlePress) {
    return (
      <View style={styles.row} key={key}>
        <Box value={key} />
        {coordinates.map(function(coord, i) { 
          return ( 
            <Coordinate
              row={coord.row}
              col={coord.col}
              key={i}
              className={coord.className}
              handlePress={handlePress}
            />
          )
        })}
      </View>
    )
  }

  handleRelease(gesture, island){
    if(this.isBoard(gesture)){
      const { y, width, x, height } = this.state.boardValues 
      colCoord = Math.floor(((gesture.moveX - x)/ (width / 10 )) + 1)
      console.log('x coord', colCoord)
      rowCoord = Math.floor(((gesture.moveY - y)/ (height / 10 )) + 1)
      console.log('y coord', rowCoord)
      console.log('island', island)
      this.positionIsland(null, island, rowCoord, colCoord)
      return true
    }else{
      return false
    }
  }

  isBoard(gesture){
    var dz = this.state.boardValues;
    console.log('moveX', gesture.moveX)
    console.log('moveY', gesture.moveY)
    console.log('boardValues', dz)
    return (
      gesture.moveY > dz.y 
      && gesture.moveY < dz.y + dz.height
      && gesture.moveX > dz.x 
      && gesture.moveX < dz.x + dz.width
    )
  }

  handleSetIslands() {
    this.setIslands(this.state.player);
  }

  setIslands(player) {
    this.state.channel.push("set_islands", player)
      .receive("ok", response => {
        this.setIslandCoordinates(response.board);
        this.setState({message: "Islands set!", islandsSet: true});
      })
      .receive("error", response => {
        this.setState({message: "Oops. Can't set your islands yet."});
      })
  }

  positionIsland(coordinate, island, row, col) {
    const params = {"player": this.state.player, "island": island, "row": row, "col": col};
    this.state.channel.push("position_island", params)
      .receive("ok", response => {
        this.setState({message: "Island Positioned!"});
        console.log("Island Positioned!")
      })
      .receive("error", response => {
        console.log("error with position")
        this.setState({message: "Oops!"});
      })
  }

  extractCoordinates(board) {
    let coords = this.state.islands.reduce(
      function(acc, island) {
        return acc.concat(board[island].coordinates);
      }, []
    );
    return coords;
  }

  setIslandCoordinates(responseBoard) {
    const coordinates = this.extractCoordinates(responseBoard, this.state.islands);
    const newBoard = inIsland(this.state.board, coordinates);
    this.setState({board: newBoard});
  }

  handlePress(row, col) {
    this.setState({ message: 'Must guess on opponent board' })
  }

  processOpponentGuess(response) {
    let board = this.state.board;
    if (response.player !== this.state.player) {
      if (response.result.win === "win") {
        this.setState({message: "Your opponent won."});
        board = hit(board, response.row, response.col);
      } else if (response.result.island !== "none") {
        this.setState({message: "Your opponent forested your " + response.result.island + " island."});
        board = hit(board, response.row, response.col);
      } else if (response.result.hit === true) {
        this.setState({message: "Your opponent hit your island."});
        board = hit(board, response.row, response.col);
      } else {
        this.setState({message: "Your opponent missed."});
        board = miss(board, response.row, response.col);
      }
    }

    this.setState({board: board});
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
            return (context.renderRow(rows[i], i, context.handlePress))
          })}
        </View>
        {!this.state.islandsSet ? ( 
          <View>
            <View style={styles.button}>
              <Button
                onPress={this.handleSetIslands}
                title='Set Islands'
              />
            </View>
            <View style={styles.imagesContainer}>
              <Island 
                source={require('./images/atoll.png')} 
                style={[styles.islandImages, {width: 60, height: 90}]} 
                setScroll={this.props.setScroll}
                onRelease={this.handleRelease}
                boardValues={this.state.boardValues}
                island={'atoll'}
              />
              <Island 
                source={require('./images/dot.png')} 
                style={[styles.islandImages, {width: 30, height: 30}]} 
                setScroll={this.props.setScroll}
                onRelease={this.handleRelease}
                boardValues={this.state.boardValues}
                island={'dot'}
              />
              <Island 
                source={require('./images/l_shape.png')} 
                style={[styles.islandImages, {width: 60, height: 90}]} 
                setScroll={this.props.setScroll}
                onRelease={this.handleRelease}
                boardValues={this.state.boardValues}
                island={'l_shape'}
              />
              <Island 
                source={require('./images/s_shape.png')} 
                style={[styles.islandImages, {width: 90, height: 60}]} 
                setScroll={this.props.setScroll}
                onRelease={this.handleRelease}
                boardValues={this.state.boardValues}
                island={'s_shape'}
              />
              <Island 
                source={require('./images/square.png')} 
                style={[styles.islandImages, {width: 60, height: 60}]} 
                setScroll={this.props.setScroll}
                onRelease={this.handleRelease}
                boardValues={this.state.boardValues}
                island={'square'}
              />
            </View>
          </View>
          ) : null
        }
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
      this.handlePress = this.handlePress.bind(this)
  }

  componentDidMount() {
    this.state.channel.on("player_added", response => {
      this.processPlayerAdded();
    })

    this.state.channel.on("player_set_islands", response => {
      this.processOpponentSetIslands(response);
    })

    this.state.channel.on("player_guessed_coordinate", response => {
      this.processGuess(response);
    })
  }

  componentWillUnmount() {
    this.state.channel.off("player_added", response => {
      this.processPlayerAdded();
    })

    this.state.channel.off("player_set_islands", response => {
      this.processOpponentSetIslands();
    })

    this.state.channel.off("player_guessed_coordinate", response => {
      this.processGuess(response);
    })
  }

  processPlayerAdded() {
    this.setState({message: "Both players present."});
  }

  processOpponentSetIslands(response) {
    if (this.state.player !== response.player) {
      this.setState({message: "Your opponent set their islands."});
    }
  }

  handlePress(row, col) {
    this.guessCoordinate(this.state.player, row, col);
  }

  guessCoordinate(player, row, col) {
    const params = {"player": player, "row": row, "col": col};
    this.state.channel.push("guess_coordinate", params)
      .receive("error", response => {
          this.setState({message: response.reason});
        })
  }

  processGuess(response) {
    let board = this.state.board;
    if (response.player === this.state.player) {
      if (response.result.win === "win") {
        this.setState({message: "You won!"});
        board = hit(board, response.row, response.col);
      } else if (response.result.island !== "none") {
        this.setState({message: "You forested your opponent's " + response.result.island + " island!"});
        board = hit(board, response.row, response.col);
      } else if (response.result.hit === true) {
        this.setState({message: "It's a hit!"});
        board = hit(board, response.row, response.col);
      } else {
        this.setState({message: "Oops, you missed."});
        board = miss(board, response.row, response.col);
      }
    }

    this.setState({board: board});
  }

  renderRow(coordinates, key, handlePress) {
    return (
      <View style={styles.row} key={key}>
        <Box value={key} />
        {coordinates.map(function(coord, i) { 
          return ( 
            <Coordinate
              row={coord.row}
              col={coord.col}
              key={i}
              className={coord.className}
              handlePress={handlePress}
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
            return (context.renderRow(rows[i], i, context.handlePress))
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
        scroll: true,
      },
      this.handlePress = this.handlePress.bind(this)
      this.setScroll = this.setScroll.bind(this)
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

  renderGame() {
    return (
      <ScrollView scrollEnabled={this.state.scroll}>
        {
          <OwnBoard 
            channel={this.state.channel} 
            player={this.state.player} 
            setScroll={this.setScroll}
          />
        }
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
    justifyContent: 'center',
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
  },
  coordinate: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: 'white',
  },
  water: {
    backgroundColor: 'blue'
  },
  island: {
    backgroundColor: 'tan'
  },
  hit: {
    backgroundColor: 'green'
  },
  miss: {
    backgroundColor: 'black'
  },
  button: {
    margin: 10
  }
})

export default Game
