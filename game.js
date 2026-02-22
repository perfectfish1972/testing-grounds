const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const keys = {
    ArrowLeft: false, ArrowRight: false, ArrowUp: false,
    a: false, d: false, w: false, Space: false, r: false
};

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    if (e.code === 'Space') keys.Space = true;
    if (e.key.toLowerCase() === 'r') {
        if (gameState === 'win' || gameState === 'gameover') {
            resetGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
    if (e.code === 'Space') keys.Space = false;
});

const GRAVITY = 0.6;
const FRICTION = 0.8;
const MAX_SPEED = 5;
const JUMP_FORCE = -12;

let gameState = 'playing'; // 'playing', 'win', 'gameover'

class Player {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.facingRight = true;
    }

    update(platforms) {
        if (gameState !== 'playing') {
            // Slide down pole
            if (gameState === 'win') {
                this.vx = 0;
                if (this.y < 310 - this.height) { // Base of pole
                    this.vy = 2;
                    this.y += this.vy;
                } else {
                    this.vy = 0;
                }
            }
            return;
        }

        // Horizontal movement
        if (keys.ArrowLeft || keys.a) {
            this.vx -= 1;
            this.facingRight = false;
        } else if (keys.ArrowRight || keys.d) {
            this.vx += 1;
            this.facingRight = true;
        } else {
            this.vx *= FRICTION;
        }

        // Limit speed
        if (this.vx > MAX_SPEED) this.vx = MAX_SPEED;
        if (this.vx < -MAX_SPEED) this.vx = -MAX_SPEED;

        this.x += this.vx;
        this.checkCollisions(platforms, 'x');

        // Vertical movement
        this.vy += GRAVITY;
        this.y += this.vy;

        this.isGrounded = false;
        this.checkCollisions(platforms, 'y');

        // Jump
        if ((keys.ArrowUp || keys.w || keys.Space) && this.isGrounded) {
            this.vy = JUMP_FORCE;
            this.isGrounded = false;
        }
    }

    checkCollisions(platforms, axis) {
        for (let pad of platforms) {
            if (this.x < pad.x + pad.width &&
                this.x + this.width > pad.x &&
                this.y < pad.y + pad.height &&
                this.y + this.height > pad.y) {

                if (pad.type === 'flagpole') {
                    gameState = 'win';
                    this.x = pad.x - this.width / 2;
                    return;
                }

                if (axis === 'x') {
                    if (this.vx > 0) {
                        this.x = pad.x - this.width;
                    } else if (this.vx < 0) {
                        this.x = pad.x + pad.width;
                    }
                    this.vx = 0;
                } else if (axis === 'y') {
                    if (this.vy > 0) {
                        this.y = pad.y - this.height;
                        this.isGrounded = true;
                    } else if (this.vy < 0) {
                        // Hit head
                        this.y = pad.y + pad.height;
                    }
                    this.vy = 0;
                }
            }
        }
    }

    draw(ctx, cameraX) {
        const drawX = this.x - cameraX;
        const dir = this.facingRight ? 1 : -1;

        ctx.save();
        ctx.translate(drawX + this.width / 2, this.y);
        ctx.scale(dir, 1);
        ctx.translate(-this.width / 2, 0);

        // Overalls (Blue)
        ctx.fillStyle = '#1c30b8';
        ctx.fillRect(5, 20, 20, 20);

        // Shirt/Arms (Red)
        ctx.fillStyle = '#d82800';
        ctx.fillRect(0, 15, 30, 15);

        // Buttons
        ctx.fillStyle = '#f8d800';
        ctx.beginPath();
        ctx.arc(10, 25, 2, 0, Math.PI * 2);
        ctx.arc(20, 25, 2, 0, Math.PI * 2);
        ctx.fill();

        // Head/Face (Skin)
        ctx.fillStyle = '#fcd8a8';
        ctx.fillRect(5, 5, 20, 15);

        // Nose
        ctx.fillRect(20, 10, 8, 6);

        // Hat (Red)
        ctx.fillStyle = '#d82800';
        ctx.fillRect(5, 0, 20, 7);
        ctx.fillRect(10, 2, 22, 5); // brim

        // Mustache
        ctx.fillStyle = '#000';
        ctx.fillRect(20, 16, 10, 3);

        // Eye
        ctx.fillRect(18, 7, 3, 5);

        // Legs
        ctx.fillStyle = '#1c30b8';
        ctx.fillRect(5, 30, 8, 10);
        ctx.fillRect(17, 30, 8, 10);

        // Shoes
        ctx.fillStyle = '#887000';
        ctx.fillRect(3, 37, 12, 5);
        ctx.fillRect(15, 37, 12, 5);

        ctx.restore();
    }
}

class Platform {
    constructor(x, y, width, height, type = 'ground') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }

    draw(ctx, cameraX) {
        const drawX = this.x - cameraX;

        if (this.type === 'ground' || this.type === 'brick') {
            ctx.fillStyle = '#c84c0c'; // Brick red
            ctx.fillRect(drawX, this.y, this.width, this.height);

            // Draw brick pattern
            ctx.fillStyle = '#000';
            for (let i = 0; i < this.height; i += 20) {
                ctx.fillRect(drawX, this.y + i, this.width, 2);
                for (let j = 0; j < this.width; j += 40) {
                    const offset = (i / 20) % 2 === 0 ? 0 : 20;
                    if (j + offset < this.width) {
                        ctx.fillRect(drawX + j + offset, this.y + i, 2, 20);
                    }
                }
            }
        } else if (this.type === 'qblock') {
            ctx.fillStyle = '#f8d800'; // Gold
            ctx.fillRect(drawX, this.y, this.width, this.height);
            ctx.fillStyle = '#000';
            ctx.strokeRect(drawX, this.y, this.width, this.height);

            // Question mark
            ctx.fillStyle = '#c84c0c';
            ctx.font = '30px "Courier New", Courier, monospace';
            ctx.fontWeight = 'bold';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', drawX + this.width / 2, this.y + this.height / 2);

            // Corner bolts
            ctx.fillStyle = '#000';
            ctx.fillRect(drawX + 2, this.y + 2, 4, 4);
            ctx.fillRect(drawX + this.width - 6, this.y + 2, 4, 4);
            ctx.fillRect(drawX + 2, this.y + this.height - 6, 4, 4);
            ctx.fillRect(drawX + this.width - 6, this.y + this.height - 6, 4, 4);
        } else if (this.type === 'pipe') {
            ctx.fillStyle = '#00a800'; // Green
            ctx.fillRect(drawX, this.y, this.width, this.height);
            ctx.fillStyle = '#000';
            ctx.strokeRect(drawX, this.y, this.width, this.height);

            // Pipe lip
            ctx.fillStyle = '#00a800';
            ctx.fillRect(drawX - 5, this.y, this.width + 10, 20);
            ctx.strokeRect(drawX - 5, this.y, this.width + 10, 20);

            // Highlight
            ctx.fillStyle = '#5ce430';
            ctx.fillRect(drawX + 5, this.y, 10, this.height);
            ctx.fillRect(drawX - 5 + 5, this.y, 10, 20); // lip highlight
        } else if (this.type === 'flagpole') {
            // Pole base
            ctx.fillStyle = '#c84c0c';
            ctx.fillRect(drawX - 10, this.y + this.height - 20, 30, 20);
            ctx.fillStyle = '#000';
            ctx.strokeRect(drawX - 10, this.y + this.height - 20, 30, 20);

            // Pole
            ctx.fillStyle = '#f8d800'; // Golden pole
            ctx.fillRect(drawX + 2, this.y + 10, 6, this.height - 20);

            // Ball on top
            ctx.fillStyle = '#00a800';
            ctx.beginPath();
            ctx.arc(drawX + 5, this.y + 10, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Flag
            ctx.fillStyle = '#00a800';
            const flagY = gameState === 'win' ? this.y + this.height - 60 : this.y + 20;
            ctx.beginPath();
            ctx.moveTo(drawX - 40, flagY);
            ctx.lineTo(drawX + 2, flagY);
            ctx.lineTo(drawX + 2, flagY + 30);
            ctx.lineTo(drawX - 40, flagY + 30);
            ctx.lineTo(drawX - 25, flagY + 15);
            ctx.fill();
        }
    }
}

class Scenery {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'cloud', 'bush'
    }

    draw(ctx, cameraX) {
        const drawX = this.x - (cameraX * (this.type === 'cloud' ? 0.5 : 1)); // parallax for clouds

        ctx.fillStyle = this.type === 'cloud' ? '#fff' : '#00a800';

        ctx.beginPath();
        ctx.arc(drawX, this.y, 20, 0, Math.PI * 2);
        ctx.arc(drawX + 20, this.y - 10, 25, 0, Math.PI * 2);
        ctx.arc(drawX + 40, this.y, 20, 0, Math.PI * 2);
        ctx.arc(drawX + 60, this.y + 5, 15, 0, Math.PI * 2);
        ctx.arc(drawX - 15, this.y + 5, 15, 0, Math.PI * 2);

        // Fill bottom flat
        if (this.type === 'bush') {
            ctx.fillRect(drawX - 15, this.y, 75, 20); // flattens bush bottom
        } else {
            ctx.fillRect(drawX - 10, this.y + 5, 70, 15); // flattens cloud bottom
        }

        ctx.fill();

        if (this.type === 'bush') {
            // Bush detail lines
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(drawX + 20, this.y - 10, 25, Math.PI, 0);
            ctx.stroke();
        }
    }
}

let platforms = [];
let sceneries = [];
let player;
let cameraX = 0;

function initLevel() {
    platforms = [
        // Ground (multiple segments with gaps)
        new Platform(0, 350, 800, 50, 'ground'),
        new Platform(900, 350, 600, 50, 'ground'),
        new Platform(1600, 350, 1000, 50, 'ground'),

        // Bricks and ? blocks
        new Platform(250, 220, 40, 40, 'brick'),
        new Platform(290, 220, 40, 40, 'qblock'),
        new Platform(330, 220, 40, 40, 'brick'),
        new Platform(370, 220, 40, 40, 'qblock'),
        new Platform(410, 220, 40, 40, 'brick'),

        // High blocks
        new Platform(330, 100, 40, 40, 'qblock'),

        // Pipes
        new Platform(600, 280, 60, 70, 'pipe'),
        new Platform(800, 230, 60, 120, 'pipe'),
        new Platform(1100, 280, 60, 70, 'pipe'),

        // Stairs
        new Platform(1300, 310, 40, 40, 'brick'),
        new Platform(1340, 270, 40, 80, 'brick'),
        new Platform(1380, 230, 40, 120, 'brick'),
        new Platform(1420, 190, 40, 160, 'brick'),

        // Down stairs
        new Platform(1600, 190, 40, 160, 'brick'),
        new Platform(1640, 230, 40, 120, 'brick'),
        new Platform(1680, 270, 40, 80, 'brick'),
        new Platform(1720, 310, 40, 40, 'brick'),

        // End large stairs
        new Platform(1950, 310, 40, 40, 'brick'),
        new Platform(1990, 270, 40, 80, 'brick'),
        new Platform(2030, 230, 40, 120, 'brick'),
        new Platform(2070, 190, 40, 160, 'brick'),
        new Platform(2110, 150, 40, 200, 'brick'),
        new Platform(2150, 110, 40, 240, 'brick'),
        new Platform(2190, 70, 40, 280, 'brick'),

        // Flag pole base and pole
        new Platform(2350, 330, 40, 20, 'brick'),
        new Platform(2365, 50, 10, 280, 'flagpole'),

        // Castle base (visual block)
        new Platform(2450, 200, 120, 150, 'brick')
    ];

    sceneries = [
        new Scenery(100, 100, 'cloud'),
        new Scenery(300, 80, 'cloud'),
        new Scenery(500, 120, 'cloud'),
        new Scenery(900, 70, 'cloud'),
        new Scenery(1300, 90, 'cloud'),
        new Scenery(1800, 110, 'cloud'),
        new Scenery(2200, 60, 'cloud'),

        new Scenery(150, 330, 'bush'),
        new Scenery(450, 330, 'bush'),
        new Scenery(750, 330, 'bush'),
        new Scenery(1200, 330, 'bush'),
        new Scenery(1850, 330, 'bush')
    ];

    player = new Player(50, 200);
    cameraX = 0;
    gameState = 'playing';
}

function resetGame() {
    initLevel();
}

function drawUI() {
    ctx.font = '20px "Courier New", Courier, monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText('MARIO', 50, 30);
    ctx.fillText('000000', 50, 50);

    ctx.textAlign = 'center';
    ctx.fillText('WORLD', canvas.width / 2, 30);
    ctx.fillText('1-1', canvas.width / 2, 50);

    if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '40px "Courier New", Courier, monospace';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.font = '20px "Courier New", Courier, monospace';
        ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 40);
    } else if (gameState === 'win') {
        // Only draw WIN text if player has slid down
        if (player.y >= 310 - player.height) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#f8d800';
            ctx.font = '40px "Courier New", Courier, monospace';
            ctx.fillText('COURSE CLEAR!', canvas.width / 2, canvas.height / 2);
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Courier New", Courier, monospace';
            ctx.fillText('Press R to Play Again', canvas.width / 2, canvas.height / 2 + 40);
        }
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update(platforms);

    // Update camera (don't scroll backwards or past the level end)
    if (gameState === 'playing') {
        const targetCameraX = player.x - canvas.width / 2 + player.width / 2;
        if (targetCameraX > cameraX) {
            cameraX = targetCameraX;
        }
    }

    cameraX = Math.max(0, Math.min(cameraX, 2500 - canvas.width)); // clamp camera

    // Draw Scenery
    sceneries.forEach(s => s.draw(ctx, cameraX));

    // Draw Level
    platforms.forEach(p => p.draw(ctx, cameraX));

    // Draw Player
    player.draw(ctx, cameraX);

    // Game Over / Fall off check
    if (player.y > canvas.height + 50 && gameState === 'playing') {
        gameState = 'gameover';
    }

    drawUI();

    requestAnimationFrame(gameLoop);
}

// Start game
initLevel();
gameLoop();
