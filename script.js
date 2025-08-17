const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const setupScreen = document.getElementById("setupScreen");
const gameScreen = document.getElementById("gameScreen");
const winnerScreen = document.getElementById("winnerScreen");
const winnerText = document.getElementById("winnerText");
const winnerCanvas = document.getElementById("winnerCanvas");
const tapButtonsContainer = document.getElementById("tapButtons");
const camera = document.getElementById("camera");
const startGameBtn = document.getElementById("startGameBtn");
const playerInputs = document.getElementById("playerInputs");

const modal = document.getElementById("photoEditorModal");
const modalCanvas = document.getElementById("editorCanvas");
const modalCtx = modalCanvas.getContext("2d");
const confirmBtn = document.getElementById("confirmPhoto");
const cancelBtn = document.getElementById("cancelPhoto");

const finishLine = 700;
let players = [];
let photos = [];
let tempPhoto = null;
let editingIndex = null;
let offsetX = 0, offsetY = 0, isDragging = false;

let countdownAudio = new Audio('sounds/countdown.mp3');
let winAudio = new Audio('sounds/win.mp3');

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    camera.srcObject = stream;
  } catch (err) {
    alert("Unable to access camera: " + err.message);
  }
}

class Player {
  constructor(name, axoImage, faceImage, color, offset = { x: 0, y: 0 }) {
    this.name = name;
    this.axoImage = axoImage;
    this.faceImage = faceImage;
    this.color = color;
    this.offset = offset;
    this.x = 0;
  }

  move() {
    this.x += 5;
    if (this.x > finishLine) this.x = finishLine;
  }

  draw(y) {
    ctx.drawImage(this.axoImage, this.x, y, 80, 80);
    if (this.faceImage) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(this.x + 40, y + 32, 12, 16, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(this.faceImage, this.x + 28 + this.offset.x, y + 16 + this.offset.y, 24, 32);
      ctx.restore();
    }
  }
}

function showPlayerInputs() {
  playerInputs.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <input type="text" id="player${i}Name" placeholder="Player ${i + 1} Name" />
      <button class="photo-btn" onclick="takePhoto(${i})">📷 Take Photo</button>
    `;
    playerInputs.appendChild(wrapper);
  }
}

window.takePhoto = function(index) {
  const snapCanvas = document.createElement("canvas");
  snapCanvas.width = 80;
  snapCanvas.height = 80;
  const snapCtx = snapCanvas.getContext("2d");
  snapCtx.drawImage(camera, 0, 0, 80, 80);
  const image = new Image();
  image.onload = () => {
    tempPhoto = image;
    editingIndex = index;
    openEditorModal();
  };
  image.src = snapCanvas.toDataURL("image/png");
};

function openEditorModal() {
  offsetX = 0;
  offsetY = 0;
  modal.style.display = "flex";
  drawModal();
}

function drawModal() {
  modalCtx.clearRect(0, 0, 200, 200);
  const axo = new Image();
  axo.src = `images/AXOLOTL ${editingIndex + 1}.png`;
  axo.onload = () => {
    modalCtx.drawImage(axo, 60, 60, 80, 80);
    if (tempPhoto) {
      modalCtx.save();
      modalCtx.beginPath();
      modalCtx.ellipse(100, 96, 12, 16, 0, 0, Math.PI * 2);
      modalCtx.clip();
      modalCtx.drawImage(tempPhoto, 88 + offsetX, 80 + offsetY, 24, 32);
      modalCtx.restore();
    }
  };
}

modalCanvas.addEventListener("mousedown", (e) => {
  isDragging = true;
});
modalCanvas.addEventListener("mouseup", () => {
  isDragging = false;
});
modalCanvas.addEventListener("mousemove", (e) => {
  if (isDragging) {
    offsetX += e.movementX;
    offsetY += e.movementY;
    drawModal();
  }
});

confirmBtn.onclick = () => {
  photos[editingIndex] = {
    img: tempPhoto,
    offset: { x: offsetX, y: offsetY }
  };
  modal.style.display = "none";
};

cancelBtn.onclick = () => {
  modal.style.display = "none";
};

startGameBtn.onclick = () => {
  setupScreen.style.display = "none";
  gameScreen.style.display = "block";

  const names = [];
  for (let i = 0; i < 4; i++) {
    const name = document.getElementById(`player${i}Name`).value.trim() || `Player ${i + 1}`;
    names.push(name);
  }

  players = [];
  const colors = ["#f06292", "#4dd0e1", "#ffd54f", "#81c784"];
  let loaded = 0;

  for (let i = 0; i < 4; i++) {
    const axo = new Image();
    axo.src = `images/AXOLOTL ${i + 1}.png`;
    axo.onload = () => {
      const face = photos[i]?.img || null;
      const offset = photos[i]?.offset || { x: 0, y: 0 };
      players[i] = new Player(names[i], axo, face, colors[i], offset);
      loaded++;
      if (loaded === 4) startCountdown();
    };
  }
};

function startCountdown() {
  let count = 3;
  countdownAudio.play();
  const interval = setInterval(() => {
    drawLake();
    ctx.font = "80px Comic Sans MS";
    ctx.fillStyle = "#ffeb3b";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.textAlign = "center";
    ctx.strokeText(count > 0 ? count : "GO!", canvas.width / 2, canvas.height / 2);
    ctx.fillText(count > 0 ? count : "GO!", canvas.width / 2, canvas.height / 2);
    count--;
    if (count < -1) {
      clearInterval(interval);
      initTapButtons();
      drawGame();
    }
  }, 1000);
}

function drawLake() {
  ctx.fillStyle = "#a0d6b4";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const spacing = 80;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = `rgba(0,100,100,0.3)`;
    ctx.fillRect(0, 60 + spacing * i, canvas.width, 60);
  }
  ctx.fillStyle = "#8B5E3C";
  ctx.fillRect(finishLine + 85, 40, 10, canvas.height - 80);
}

function drawGame() {
  drawLake();
  players.forEach((player, i) => player.draw(60 + i * 80));

  const winner = players.find(p => p.x >= finishLine);
  if (winner) {
    endGame(winner);
    return;
  }

  requestAnimationFrame(drawGame);
}

function initTapButtons() {
  tapButtonsContainer.innerHTML = "";
  players.forEach((player, i) => {
    const btn = document.createElement("button");
    btn.textContent = `${player.name} TAP!`;
    btn.onclick = () => {
      player.move();
      btn.classList.add("tapped");
      setTimeout(() => btn.classList.remove("tapped"), 100);
    };
    tapButtonsContainer.appendChild(btn);
  });
}

function endGame(winner) {
  gameScreen.style.display = "none";
  winnerScreen.style.display = "block";
  winnerText.textContent = `WINNER: ${winner.name}`;
  const ctxWin = winnerCanvas.getContext("2d");
  ctxWin.clearRect(0, 0, 80, 80);
  ctxWin.drawImage(winner.axoImage, 0, 0, 80, 80);
  if (winner.faceImage) {
    ctxWin.save();
    ctxWin.beginPath();
    ctxWin.ellipse(40, 32, 12, 16, 0, 0, Math.PI * 2);
    ctxWin.clip();
    ctxWin.drawImage(winner.faceImage, 28 + winner.offset.x, 16 + winner.offset.y, 24, 32);
    ctxWin.restore();
  }
  winAudio.play();
}

function newGame() {
  setupScreen.style.display = "block";
  gameScreen.style.display = "none";
  winnerScreen.style.display = "none";
  showPlayerInputs();
}

window.onload = () => {
  showPlayerInputs();
  startCamera();
};
