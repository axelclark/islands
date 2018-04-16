import React from 'react'
import { StackNavigator } from 'react-navigation'
import Game from './components/Game'

const App = StackNavigator({
  Game: {
    screen: Game
  }
})

export default App
