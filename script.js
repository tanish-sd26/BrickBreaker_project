

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width ;
  canvas.height = rect.height ;
}
resizeCanvas();
window.addEventListener('load', () => {
  resizeCanvas();
  game.onResize();
});

window.addEventListener('resize', () => {
  resizeCanvas();
  game.onResize();
});

const game = {
  score: 0,
  lives: 3,
  level: 1,
  running: false,
  paused: false,
  ballSpeed: 4,
  bricksRowCount: 4,
  bricksColumnount: 6,
  paddle: null,
  ball: null,
  bricks: [],
  keys: {left:false, right:false},
  touchMove: 0
};

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const pauseBtn = document.getElementById('pauseBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

class Paddle {
  constructor() {
    this.width = 120;
    this.height = 14;
    this.x = (canvas.width - this.width) / 2;
    this.y = canvas.height - this.height - 10;
    this.speed = 8;
  }
  draw() {
    ctx.fillStyle = '#66e0ff';
    roundRect(ctx, this.x, this.y, this.width, this.height, 8, true, false);
  }
  move(dir) {
    this.x += dir * this.speed;

    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width ) this.x = canvas.width - this.width;
  }
}


class Ball {
  constructor() {
    this.radius = 8;
    this.reset();
  }
  reset() {
    this.x = canvas.width  / 2;
    this.y = canvas.height  - 60;
    this.dx = (Math.random() > 0.5 ? 1 : -1) * game.ballSpeed;
    this.dy = -game.ballSpeed;
  }
  draw() {
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(this.x, this.y, 2, this.x, this.y, this.radius);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#ff6b6b');
    ctx.fillStyle = gradient;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.fill();
  }
  update() {
    this.x += this.dx;
    this.y += this.dy;
  }
}

function createBricks() {
  game.bricks = [];
  const rows = game.bricksRowCount + game.level - 1; 
  const cols = game.bricksColumnCount;
  const padding = 8;
  const offsetTop = 50;
  const brickWidth = (canvas.width / devicePixelRatio - padding * cols - 60) / cols;
  const brickHeight = 40;

  for (let r = 0; r < rows; r++) {
    game.bricks[r] = [];
    for (let c = 0; c < cols; c++) {
      const brickX = 30 + c * (brickWidth + padding);
      const brickY = offsetTop + r * (brickHeight + padding);
      game.bricks[r][c] = { 
          x: brickX,
          y: brickY,
          w: brickWidth, 
          h: brickHeight, 
          broken: false, 
          hits: 1 + Math.floor((r + c) / 6) 
        };
    }
  }
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof radius === 'undefined') radius = 5;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}


function initGame() {
  game.score = 0;
  game.lives = 3;
  game.level = 1;
  game.ballSpeed = 4;
  game.bricksRowCount = 3;
  game.bricksColumnount = 6;
  game.paddle = new Paddle();
  game.ball = new Ball();
  createBricks();
  updateUI();
  showOverlay('Ready', 'Press Start to play');
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for (let r = 0; r < game.bricks.length; r++) {
    for (let c = 0; c < game.bricks[r].length; c++) {
      const b = game.bricks[r][c];
      if (!b || b.broken) continue;

      const hue = 200 - (r*15 + c*5);
      ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
      roundRect(ctx, b.x, b.y, b.w, b.h, 6, true, false);
      
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    }
  }

  game.paddle.draw();

  game.ball.draw();
}

function detectCollisions() {
  const ball = game.ball;
  const paddle = game.paddle;
  const cw = canvas.width ;
  const ch = canvas.height ;

  if (ball.x + ball.radius >= cw) { ball.x = cw - ball.radius; ball.dx *= -1; }
  if (ball.x - ball.radius <= 0) { ball.x = ball.radius; ball.dx *= -1; }
  if (ball.y - ball.radius <= 0) { ball.y = ball.radius; ball.dy *= -1; }

  if (ball.y + ball.radius >= paddle.y && ball.y + ball.radius <= paddle.y + paddle.height &&
      ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) {

    const hitPos = (ball.x - (paddle.x + paddle.width/2)) / (paddle.width/2);
    const angle = hitPos * Math.PI/3;
    const speed = Math.sqrt(ball.dx*ball.dx + ball.dy*ball.dy);
    ball.dx = speed * Math.sin(angle);
    ball.dy = -Math.abs(speed * Math.cos(angle));
  }

  if (ball.y - ball.radius > ch) {
    game.lives -= 1;
    updateUI();
    if (game.lives <= 0) {
      endGame(false);
    } else {

      game.ball.reset();
      game.paddle = new Paddle();
      game.running = false;
      showOverlay('Life Lost', 'Press Start to continue');
    }
  }

  for (let r = 0; r < game.bricks.length; r++) {
    for (let c = 0; c < game.bricks[r].length; c++) {
      const b = game.bricks[r][c];
      if (!b || b.broken) continue;
      if (game.ball.x > b.x && game.ball.x < b.x + b.w && game.ball.y - game.ball.radius < b.y + b.h && game.ball.y + game.ball.radius > b.y) {
        
        b.hits -= 1;
        game.ball.dy *= -1;
        if (b.hits <= 0) {
          b.broken = true;
          game.score += 10;
          updateUI();
        } else {
          game.score += 5;
          updateUI();
        }
      }
    }
  }

  let allBroken = true;
  for (let r = 0; r < game.bricks.length; r++) {
    for (let c = 0; c < game.bricks[r].length; c++) {
      const b = game.bricks[r][c];
      if (b && !b.broken) { allBroken = false; break; }
    }
    if (!allBroken) break;
  }
  if (allBroken) {
    nextLevel();
  }
}


function gameLoop() {
  if (!game.running || game.paused) return;
  game.ball.update();
  
  if (game.keys.left) game.paddle.move(-1);
  if (game.keys.right) game.paddle.move(1);

  if (game.touchMove) game.paddle.move(game.touchMove);

  detectCollisions();
  draw();

  requestAnimationFrame(gameLoop);
}


function updateUI() {
  scoreEl.textContent = game.score;
  livesEl.textContent = game.lives;
  levelEl.textContent = game.level;
}

function startGame() {
  game.running = true;
  game.paused = false;
  overlay.style.display = 'none';
  gameLoop();
}

function endGame(won) {
  game.running = false;
  overlay.style.display = 'flex';
  if (won) {
    overlayTitle.textContent = 'You Win!';
    overlayText.textContent = 'Congratulations — you cleared all levels.';
  } else {
    overlayTitle.textContent = 'Game Over';
    overlayText.textContent = 'Try again to improve your score.';
  }
}

function nextLevel() {
  game.level += 1;

  if (game.bricksColumnount < 10) game.bricksColumnount += 0; 
  createBricks();
  game.ball.reset();
  game.paddle = new Paddle();
  game.running = false;
  showOverlay('Level ' + game.level, 'Press Start to play Level ' + game.level);
}

function showOverlay(title, text) {
  overlay.style.display = 'flex';
  overlayTitle.textContent = title;
  overlayText.textContent = text;
}

startBtn.addEventListener('click', () => {
  startGame();
});
restartBtn.addEventListener('click', () => {
  initGame();
  startGame();
});
pauseBtn.addEventListener('click', () => {
  game.paused = !game.paused;
  pauseBtn.textContent = game.paused ? 'Resume' : 'Pause';
  if (!game.paused && game.running) gameLoop();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') game.keys.left = true;
  if (e.key === 'ArrowRight') game.keys.right = true;
  if (e.key === ' '){ 
    game.running = !game.running;
    if (game.running) gameLoop();
  }
});
document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') game.keys.left = false;
  if (e.key === 'ArrowRight') game.keys.right = false;
});

leftBtn.addEventListener('touchstart', (e)=>{ e.preventDefault(); game.touchMove = -1; });
rightBtn.addEventListener('touchstart', (e)=>{ e.preventDefault(); game.touchMove = 1; });
leftBtn.addEventListener('touchend', ()=>{ game.touchMove = 0; });
rightBtn.addEventListener('touchend', ()=>{ game.touchMove = 0; });

let dragging = false;
canvas.addEventListener('pointerdown', (e) => {
  dragging = true;
  movePaddleToPointer(e);
});
canvas.addEventListener('pointermove', (e) => {
  if (dragging) movePaddleToPointer(e);
});
canvas.addEventListener('pointerup', () => dragging = false);
canvas.addEventListener('pointerleave', () => dragging = false);

function movePaddleToPointer(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left);
  game.paddle.x = x - game.paddle.width / 2;
  if (game.paddle.x < 0) game.paddle.x = 0;
  if (game.paddle.x + game.paddle.width > canvas.width) game.paddle.x = canvas.width - game.paddle.width;
}

game.onResize = function() {
  if (game.paddle) {
    game.paddle.y = canvas.height  - game.paddle.height - 10;
    if (game.paddle.x + game.paddle.width > canvas.width ) game.paddle.x = canvas.width  - game.paddle.width;
  }
  if (game.ball) {
    if (game.ball.x > canvas.width ) game.ball.x = canvas.width / 2;
  }
};

initGame();
showOverlay('Welcome', 'Click Start or press Space to play');

overlay.addEventListener('click', (e)=>{ 
  if(e.target === overlay) 
    return; 

});
document.addEventListener('keydown',(e)=>{ 
  if(e.key==='Enter' && overlay.style.display !== 'none')
    { startGame(); }
});