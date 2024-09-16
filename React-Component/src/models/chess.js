import Swal from 'sweetalert2';

const chessClientURL = "YOUR_CHESS_CLIENT_URL_HERE"; // Replace with your actual URL

class Chess {
  constructor(frameId, isLesson) {
    this.frameId = frameId;
    this.isLesson = isLesson;
    this.stopTheGameFlag = false;
    this.color = '';
    this.chessBoard = null;

    this.preGame();
  }

  preGame() {
    const eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
    const messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

    window[eventMethod](messageEvent, (e) => {
      this.chessBoard = document.getElementById(this.frameId).contentWindow;
      if (typeof e.data === 'object') return;

      const isDataAFen = e.data.indexOf('/') > -1;
      const info = this.dataTransform(e.data);
      const msg = this.createAmessage(info, this.color);
      this.chessBoard.postMessage(msg, chessClientURL);

      if (e.data.indexOf('p') === -1 && isDataAFen) {
        setTimeout(() => {
          Swal.fire('Lesson completed', 'Good Job', 'success');
          this.newGameInit('8/8/8/8/8/8/8/8 w - - 0 1');
        }, 200);
      }
    }, false);
  }

  newGameInit(FEN, color) {
    this.stopTheGameFlag = false;
    if (color) {
      this.color = color;
    }
    const msg = this.createAmessage(FEN, this.color);
    this.chessBoard.postMessage(msg, chessClientURL);
    
    this.chessBoard.postMessage(
      JSON.stringify({
        highlightFrom: "remove",
        highlightTo: "remove"
      }),
      chessClientURL
    );
  }

  dataTransform(data) {
    if (data === 'ReadyToRecieve') data = '8/8/8/8/8/8/8/8 w - - 0 1';
    if (data.split('/')[7]) {
      let laststringArray = data.split('/')[7].split(' '); // Keep this as an array
      laststringArray[1] = 'w';
      laststringArray[2] = '-';
      laststringArray[3] = '-';
      laststringArray[4] = '0';
      laststringArray[5] = '1';
      const laststring = laststringArray.join(' '); // Join it back to a string
      const transformed = data.split('/');
      transformed[7] = laststring; // Assign the string back to the array
      return transformed.join('/');
    }
    return data;
  }

  createAmessage(fen, color) {
    return JSON.stringify({
      boardState: fen,
      color: color,
      lessonFlag: this.isLesson,
    });
  }
}

export default Chess;
