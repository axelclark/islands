import _ from 'underscore';

export function blankBoard() {
  let board = {};

  for (let i = 1; i <= 10; i++) {
    for (let j = 1; j <= 10; j++) {
      board[i + ":" + j] = {row: i, col: j, className: "coordinate"};
    }
  }
  return board;
}

export function getRows(board) {
  let rows = {1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: []};
  let boardValues = Object.values(board);

  _.each(boardValues, function(value) {
    rows[value.row].push(value);
  })
  return rows;
}

export function hit(board, row, col) {
  board[row + ":" + col].className = "coordinate hit";
  return board;
}

export function miss(board, row, col) {
  board[row + ":" + col].className = "coordinate miss";
  return board;
}

export function inIsland(board, coordinates) {
  _.each(coordinates, function(coord) {
    board[coord.row + ":" + coord.col].className = "coordinate island";
  });
  return board;
}
