
function draw_board() {
    // size of each chess square
    const squareSize = 50;
    // position of board's top left
    const boardTopx = 50;
    const boardTopy = 50;
    let all_canvases = document.getElementsByClassName("canvasboard");

    for (let m=0; m<all_canvases.length; m++) {
      canvas = all_canvases[m]
      board_state = JSON.parse(canvas.id)
      board_dim = Math.floor(Math.sqrt(board_state.length)) // Assuming a square board 
      context = canvas.getContext("2d");
      for(let i=0; i<board_dim; i++) {
        for(let j=0; j<board_dim; j++) {
          linear_idx = i * board_dim + j
          if(board_state[linear_idx]==-1) {
            context.lineWidth=20;
          }
          else {
            context.lineWidth=10;
          }
          context.fillStyle = idx_to_color(board_state[linear_idx]);
          let xOffset = boardTopx + j*squareSize;
          let yOffset = boardTopy + i*squareSize;
          context.fillRect(xOffset, yOffset, squareSize, squareSize);
        }
      }
      // draw the border around the chessboard
      context.strokeStyle = "black";
      context.strokeRect(boardTopx, boardTopy, squareSize*board_dim, squareSize*board_dim)
    }

  }

function idx_to_color(idx) {

  if (idx == 0) {
    color = "blue"
  } else if (idx == 1) {
    color = "red"
  } else if (idx == -1) {
    color = "white"
  } else {
    color = null
  }

  return color
}