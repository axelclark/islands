import React from 'react'
import { StackNavigator } from 'react-navigation'
import StartGame from './components/StartGame'

const App = StackNavigator({
  StartGame: {
    screen: StartGame
  }
})

export default App
