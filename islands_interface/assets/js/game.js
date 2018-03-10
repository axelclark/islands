export function join(channel) {
  channel.on("player_added", response => { 
    console.log("Player Added", response)
  })

  channel.on("player_set_islands", response => {
    console.log("Player Set Islands", response)
  })

  channel.on("player_guessed_coordinate", response => { 
    console.log("Player Guessed Coordinate: ", response.result)
  })

  channel.on("subscribers", response => { 
    console.log("These players have joined: ", response)
  })

  channel.join()
    .receive("ok", resp => { console.log("Joined successfully", resp) })
    .receive("error", resp => { console.log("Unable to join", resp) })
}

export function leave(channel) { 
  channel.leave()
    .receive("ok", response => {
      console.log("Left successfully", response)
    })
    .receive("error", response => {
      console.log("Unable to leave", response)
    })
}

export function new_game(channel) { 
  channel.push("new_game")
    .receive("ok", response => { console.log("New Game!", response)
    })
    .receive("error", response => {
      console.log("Unable to start a new game.", response)
    })
}

export function add_player(channel, player) { 
  channel.push("add_player", player)
    .receive("error", response => {
      console.log("Unable to add new player: " + player, response)
    })
}

export function position_island(channel, player, island, row, col) {
  var params = {"player": player, "island": island, "row": row, "col": col} 
  channel.push("position_island", params)
    .receive("ok", response => { console.log("Island positioned!", response)
    })
    .receive("error", response => {
      console.log("Unable to position island.", response) 
    })
}

export function set_islands(channel, player) { 
  channel.push("set_islands", player)
    .receive("ok", response => { console.log("Here is the board:"); console.dir(response.board);
    })
    .receive("error", response => {
      console.log("Unable to set islands for: " + player, response)
    })
}

export function guess_coordinate(channel, player, row, col) { 
  var params = {"player": player, "row": row, "col": col} 
  channel.push("guess_coordinate", params)
    .receive("error", response => {
      console.log("Unable to guess a coordinate: " + player, response)
    }) 
}
