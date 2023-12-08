const GAME_STATE = { moves: 0, level: 1, time: 0, board: [], resolvedAt: 0, errors: 0 };
const EMPTY = '&nbsp;';

const clickOnNumber = (number) => {
  // Seacrh for selected cell
  const el = document.querySelector(`.square .cell.selected`);
  if (!el) return;
  // Get cell value
  const value = GAME_STATE.board[el.dataset.row][el.dataset.col];
  let numberUse = number;
  // Is base number or no number is selected
  if (value.visible || (value.user == 0 && numberUse == EMPTY)) return;
  // Get current value
  value.user = numberUse == EMPTY ? 0 : numberUse;
  el.innerHTML = numberUse;
  // Count the moves
  GAME_STATE.moves++;
  // Set to empty
  if (numberUse == EMPTY) {
    el.classList.remove('error');
    el.classList.add('empty');
    updateStats();
    return;
  }
  // Is not empty
  el.classList.remove('empty');
  // Check if number is correct
  if (GAME_STATE.board[el.dataset.row][el.dataset.col].value == numberUse) {
    el.classList.remove('error');
    if (isSolved()) GAME_STATE.level++;
  } else {
    GAME_STATE.errors++;
    el.classList.add('error');
  }
  // Update stats
  updateStats();
};

// Click on number
const clickOnCell = (el) => {
  // If is base cell, return
  if (el.classList.contains('base')) return;
  // Remove selected class from all cells
  document.querySelectorAll('.square .cell.selected').forEach((item) => item.classList.remove('selected'));
  el.classList.add('selected');
};

const filterByLevel = (board) => {
  const availables = [];
  // Create array with all cells
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      availables.push({ row: i, col: j });
    }
  }
  // Set the number of cells to remove by level
  let remove = GAME_STATE.level + 30;
  if (remove > 55) remove = 55;
  // Remove cells randomly (Based on level)
  for (let i = 0; i < remove; i++) {
    const random = Math.floor(Math.random() * availables.length);
    const { row, col } = availables[random];
    availables.splice(random, 1);
    board[row][col].visible = false;
  }
  // Return board
  return board;
};

// Create a new board
const createBoard = () => {
  let [iterations, rows, row] = [0, [], []];
  // Iterate until a valid board is created
  do {
    [iterations, rows] = [0, [], []];
    do {
      iterations++;
      if (iterations > 250) {
        iterations = -1;
        break;
      }
      row = createNewRow(rows);
      if (!row) continue;
      rows.push(row);
    } while (rows.length < 9);
  } while (iterations === -1);
  // Fill board with new values
  const board = [];
  rows.forEach((row) => board.push(row.map((item) => ({ value: item, user: 0, visible: true }))));
  // Save board in game state
  GAME_STATE.board = filterByLevel(board);
};

// Create a new row whithout repeating numbers on row, column or square
const createNewRow = (rows) => {
  const row = [];
  let [selectables, availables, selected, random] = [[1, 2, 3, 4, 5, 6, 7, 8, 9], [], 0, 0];
  // Create the row
  for (let i = 0; i < 9; ++i) {
    // Get exiting values on colum i
    const onColumn = rows.map((item) => item[i]);
    // Get item on same square
    const [squareRow, squareCol] = [Math.floor(rows.length / 3) * 3, Math.floor(i / 3) * 3];
    const onSquare = [];
    for (let k = squareRow; k < squareRow + 3; k++) for (let l = squareCol; l < squareCol + 3; l++) rows[k]?.[l] && onSquare.push(rows[k]?.[l]);
    // Filter available values where is not on row or column and not in the same block
    availables = selectables.filter((item) => !row.includes(item) && !onColumn.includes(item) && !onSquare.includes(item));
    random = availables.length > 1 ? Math.floor(Math.random() * availables.length) : 0;
    // Add the new value to the row
    selected = availables[random];
    if (selected === undefined) return false;
    row.push(selected);
  }
  // Return new row
  return row;
};

// Fill the board with the values
const fillBoard = () => {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const value = GAME_STATE.board[i][j];
      const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
      cell.classList.remove('empty', 'error', 'base');
      if (value.visible) cell.classList.add('base');
      else if (value.user == 0) cell.classList.add('empty');
      else if (value.user != value.value) cell.classList.add('error');
      cell.innerHTML = value.visible ? value.value : value.user == 0 ? EMPTY : value.user;
    }
  }
  updateStats();
};

// Verify if game is finished (No error and no empty cells)
const isSolved = () =>
  (document.querySelectorAll('.square .cell.error')?.length ?? 999) + (document.querySelectorAll('.square .cell.empty')?.length ?? 999) == 0;

// Solve game (Replace user values with the correct values)
const solveGame = () => {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) if (GAME_STATE.board[i][j].user == 0) GAME_STATE.board[i][j].user = GAME_STATE.board[i][j].value;
  }
  document.body.classList.add('auto-solved');
  fillBoard();
};

// create string in format 00:00:00 from milliseconds
const formatTime = (time) => {
  const totalSeconds = Math.floor(time / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${completeWithZero(hours, 2)}:${completeWithZero(minutes, 2)}:${completeWithZero(seconds, 2)}`;
};

// Reset and start game
const startGame = (fromInit) => {
  // remove auto-solved class from body
  document.body.classList.add('auto-solved');
  // Setup variables
  const emptyStats = { moves: 0, resolvedAt: 0, errors: 0, time: Date.now() };
  let current = {};
  // Recover game state
  if (fromInit) current = JSON.parse(localStorage.getItem('gameState') ?? '{ "level": 1 }');
  Object.assign(GAME_STATE, { ...emptyStats, ...current });
  // Must create a new game
  if (GAME_STATE.board.length == 0) createBoard();
  // Draw the values in the board
  fillBoard();
};

// Update stats
const updateStats = () => {
  const solved = isSolved();
  // Set solved or not
  if (solved) {
    document.body.classList.add('solved');
    if (GAME_STATE.resolvedAt == 0) GAME_STATE.resolvedAt = Date.now();
  } else document.body.classList.remove('solved');
  // Draw stats
  ['moves', 'level', 'time', 'errors'].forEach(
    (item) =>
      (document.querySelector(`#${item}`).innerHTML =
        item != 'time' ? GAME_STATE[item] : solved ? formatTime(GAME_STATE.resolvedAt - GAME_STATE.time) : formatTime(Date.now() - GAME_STATE.time))
  );
  // Save game state
  localStorage.setItem('gameState', JSON.stringify(GAME_STATE));
};

// Init game
const init = () => {
  // Set mobile class to body
  if (isMobile()) document.body.classList.add('mobile');
  // Add numbers and buttons events
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', EMPTY].forEach((number) => {
    const button = createDiv(['button-number'], { selector: number }, number == EMPTY ? '-' : number);
    document.querySelector('#number-selector').append(button);
    button.addEventListener('click', () => !isSolved() && clickOnNumber(button.dataset.selector));
  });
  // button: New game
  document.querySelector('#new-game').addEventListener('click', () => {
    GAME_STATE.board = [];
    localStorage.setItem('gameState', JSON.stringify(GAME_STATE));
    updateStats();
    startGame();
  });
  // button: Solve game
  document.querySelector('#solve').addEventListener('click', () => solveGame());
  // Add squares (By template)
  let count = -1;
  document.querySelectorAll('#board .row').forEach((row) => {
    for (let i = 0; i < 3; i++) {
      count++;
      let rowStart = Math.floor(count / 3) * 27;
      // create new square
      const square = createDiv(['square'], {});
      // Create cells for square
      for (let j = 0; j < 9; j++) {
        const cell = createDiv(['cell', 'empty'], {}, EMPTY);
        // TODO: Maybe this is not the best way to do it (Simplify)
        cell.dataset.row = Math.floor(j / 3) + Math.floor(rowStart / 27) * 3;
        cell.dataset.col = -(cell.dataset.row * 9) + rowStart + i + [0, -1, -2][i] + i * 3 + Math.floor(j / 3) * 9 + (j - Math.floor(j / 3) * 3);
        // Add cell to square
        square.append(cell);
        // Add click event
        cell.addEventListener('click', (evt) => !isSolved() && clickOnCell(evt.target))
      }
      row.append(square); // Add square to row
    }
  });
  // Start game
  startGame(true);
  // Update stats
  setInterval(() => updateStats(), 500);
};

// Create div with class, dataset and innerHTML
const createDiv = (addClass, dataset, innerHTML) => {
  const div = document.createElement('div');
  div.classList.add(...addClass);
  dataset && Object.assign(div.dataset, dataset);
  innerHTML && (div.innerHTML = innerHTML);
  return div;
};

// Complete string with zero at left
const completeWithZero = (number, length) => number.toString().padStart(length, '0');
// Mobile detection
const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export { init };
