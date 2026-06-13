const startButton = document.getElementById("start-button");
const statusLight =
  document.querySelector(".status-red") ||
  document.querySelector(".status-green");
const highScoreElement = document.querySelector(".high-score");
const scoreElement = document.querySelector(".score");

const buttonArray = Array.from(document.querySelectorAll("[data-color]"));
//will output ['green', 'element']
const buttonKeyValuePair2DArray = buttonArray.map((button) => [
  button.dataset.color,
  button,
]);

const colourButtonObject = Object.fromEntries(buttonKeyValuePair2DArray);

//initial game state
let sequence = [];
let playerIndex = 0;
let inPlay = false; //decides if the game is on or not
let inputEnable = false; //player's turn
let score = 0;
let highScore = 0;
let responseTimer = null;

const highScore_key = "highscore_1";

function loadHighScore() {
  const saved = localStorage.getItem(highScore_key);
  highScore = saved ? Number(saved) : 0;
}

function saveHighScore() {
  localStorage.setItem(highScore_key, String(highScore));
}

function setStatus(colour) {
  if (colour === "green") {
    statusLight.classList.remove("status-red");
    statusLight.classList.add("status-green");
  } else {
    statusLight.classList.remove("status-green");
    statusLight.classList.add("status-red");
  }
}

function updateDisplays() {
  highScoreElement.textContent = String(highScore).padStart(2, "0");
  scoreElement.textContent = String(score).padStart(2, "0");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function flashButton(buttonElement, duration = 450) {
  const tempFilter = buttonElement.style.filter;
  const tempShadow = buttonElement.style.boxShadow;

  buttonElement.style.filter = "brightness(1.6)";
  buttonElement.style.boxShadow = "0 0 30px rgba(255, 255, 255, 0.9)";

  await sleep(duration);

  buttonElement.style.filter = tempFilter;
  buttonElement.style.boxShadow = tempShadow;
}

function getPlaybackTimings(seqLength) {
  let interval;
  if (seqLength >= 13) {
    interval = 300;
  } else if (seqLength >= 9) {
    interval = 400;
  } else if (seqLength >= 5) {
    interval = 550;
  } else {
    interval = 700; //base speed
  }

  //flash duration
  const flash = Math.max(250, interval - 200);

  return { interval, flash };
}

function addRandomColor() {
  const colours = ["green", "red", "yellow", "blue"];
  const choice = colours[Math.floor(Math.random() * colours.length)];
  sequence.push(choice);
}

async function playSequence() {
  inputEnable = false;
  const { interval, flash } = getPlaybackTimings(sequence.length);

  for (let i = 0; i < sequence.length; i++) {
    const colour = sequence[i];
    const button = colourButtonObject[colour];
    await flashButton(button, flash);
    await sleep(interval);
  }

  //prep for player response
  playerIndex = 0;
  inputEnable = true;
  startResponseTimer();
}

//it resets any existing timer, then starts a new 5-second countdown, when the time is up it calls loseGame()
function startResponseTimer() {
  clearResponseTimer();
  responseTimer = setTimeout(() => {
    loseGame();
  }, 5000);
}
//if responseTimer holds a timer ID it calls clearTimeout to stop it
//and then sets responseTimer = null so there are not any overlapping timers
function clearResponseTimer() {
  if (responseTimer) {
    clearTimeout(responseTimer);
    responseTimer = null;
  }
}

async function flashAll(times = 3, onMs = 220, offMs = 140) {
  const buttons = Object.values(colourButtonObject);
  for (let i = 0; i < times; i++) {
    await Promise.all(buttons.map((btn) => flashButton(btn, onMs)));
    await sleep(offMs);
  }
}

async function loseGame() {
  // stop accepting input and cancel timer
  inputEnable = false;
  clearResponseTimer();
  setStatus("red");
  await flashAll(3);
  // end the game
  inPlay = false;
  if (score > highScore) {
    highScore = score;
    saveHighScore();
  }
  updateDisplays();
}

async function handlePadClick(color) {
  if (!inPlay || !inputEnable) return;

  const expected = sequence[playerIndex];

  if (color !== expected) {
    await loseGame();
    return;
  }

  //correct:player moves up the sequence
  playerIndex += 1;
  startResponseTimer();

  //---advance to next round---
  if (playerIndex === sequence.length) {
    score = sequence.length;

    if (score > highScore) {
      highScore = score;
      saveHighScore();
    }

    updateDisplays();

    // small pause before next round
    inputEnable = false;
    clearResponseTimer();
    await sleep(600);

    // next round
    addRandomColor();
    await playSequence();
  }
}

async function startGame() {
  inPlay = true;
  inputEnable = false;
  sequence = [];
  playerIndex = 0;
  score = 0;
  updateDisplays();
  setStatus("green");
  await sleep(1000);
  addRandomColor();
  await playSequence();
}

loadHighScore();
updateDisplays();
setStatus("red");
startButton.addEventListener("click", startGame);

Object.entries(colourButtonObject).forEach(([color, button]) => {
  button.addEventListener("click", () => handlePadClick(color));
});
