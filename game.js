const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    a: false,
    d: false,
    w: false,
    Space: false
};

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    if (e.code === 'Space') keys.Space = true;
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
    if (e.code === 'Space') keys.Space = false;
});

const GRAVITY = 0.5;
const FRICTION = 0.8;
const MAX_SPEED = 5;
const JUMP_FORCE = -10;

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.color = '#ff0000';
    }

    update(platforms) {
        // Horizontal movement
        if (keys.ArrowLeft || keys.a) {
            this.vx -= 1;
        } else if (keys.ArrowRight || keys.d) {
            this.vx += 1;
        } else {
            this.vx *= FRICTION; // apply friction when not pressing keys
        }

        // Limit speed
        if (this.vx > MAX_SPEED) this.vx = MAX_SPEED;
        if (this.vx < -MAX_SPEED) this.vx = -MAX_SPEED;

        // Apply velocities separately for collision resolution
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
                        this.y = pad.y + pad.height;
                    }
                    this.vy = 0;
                }
            }
        }
    }

    draw(ctx, cameraX) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
        
        // Face deteils (simple)
        ctx.fillStyle = '#ffcccc'; // skin
        ctx.fillRect(this.x - cameraX + (this.vx >= 0 ? 15 : 5), this.y + 5, 10, 10);
    }
}

class Platform {
    constructor(x, y, width, height, type = 'ground') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        
        if(type === 'ground') this.color = '#c84c0c';
        else if (type === 'block') this.color = '#e45c10';
        else if (type === 'pipe') this.color = '#00a800';
    }

    draw(ctx, cameraX) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
        
        // Stroke
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - cameraX, this.y, this.width, this.height);
    }
}

// Level Design
const platforms = [
    // Ground (multiple segments to simulate pits)
    new Platform(0, 350, 1000, 50, 'ground'),
    new Platform(1100, 350, 2000, 50, 'ground'), // Gap between 1000 and 1100
    
    // Blocks
    new Platform(200, 250, 40, 40, 'block'),
    new Platform(240, 250, 40, 40, 'block'), // ? block (visual only for now)
    new Platform(280, 250, 40, 40, 'block'),
    
    // Higher blocks
    new Platform(400, 150, 160, 40, 'block'),
    
    // Pipes
    new Platform(600, 280, 60, 70, 'pipe'),
    new Platform(800, 230, 60, 120, 'pipe'),
    
    // Stairs
    new Platform(1200, 310, 40, 40, 'block'),
    new Platform(1240, 270, 40, 80, 'block'),
    new Platform(1280, 230, 40, 120, 'block'),
    new Platform(1320, 190, 40, 160, 'block'),
    
    // Down stairs
    new Platform(1440, 190, 40, 160, 'block'),
    new Platform(1480, 230, 40, 120, 'block'),
    new Platform(1520, 270, 40, 80, 'block'),
    new Platform(1560, 310, 40, 40, 'block'),
    
    // Flag pole
    new Platform(1800, 50, 10, 300, 'pipe'), // pole
    new Platform(1775, 50, 60, 20, 'block'), // ball on top
    new Platform(1750, 310, 110, 40, 'block'), // block base
];

const player = new Player(50, 200);
let cameraX = 0;

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    player.update(platforms);
    
    // Update camera to follow player but clamp to start
    cameraX = Math.max(0, player.x - canvas.width / 2 + player.width / 2);
    
    // Draw Level
    platforms.forEach(p => p.draw(ctx, cameraX));
    
    // Draw Player
    player.draw(ctx, cameraX);
    
    // Game Over / Fall off check
    if (player.y > canvas.height + 100) {
        player.x = 50;
        player.y = 200;
        player.vx = 0;
        player.vy = 0;
    }
    
    requestAnimationFrame(gameLoop);
}

gameLoop();
