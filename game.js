class ZenTetris {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPiece');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.CELL_SIZE = 20;
        
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.currentPiece = null;
        this.nextPiece = null;
        this.dropTime = 0;
        this.dropInterval = 1000; // Always calm 1 second interval
        this.gameRunning = false;
        this.isPaused = false;
        
        this.musicIndex = 0;
        this.musicPlaying = false;
        this.volume = 0.3;
        
        this.zenMessages = [
            "Find peace in every block 🧘",
            "Let go of perfection ✨",
            "Each piece has its place 🌸",
            "Breathe with the rhythm 🌊",
            "There's no rush in zen 🕯️",
            "Every moment is perfect 🦋",
            "Flow like water 💧",
            "Balance comes naturally 🌿"
        ];
        
        // Soft, pastel colors for a calming experience
        this.colors = [
            '#000000', // empty
            '#FFB6C1', // light pink
            '#E6E6FA', // lavender  
            '#F0E68C', // light yellow
            '#98FB98', // pale green
            '#87CEEB', // sky blue
            '#DDA0DD', // plum
            '#F5DEB3', // wheat
        ];
        
        this.pieces = [
            { shape: [[1,1,1,1]], color: 1 }, // I
            { shape: [[1,1],[1,1]], color: 2 }, // O
            { shape: [[0,1,0],[1,1,1]], color: 3 }, // T
            { shape: [[0,1,1],[1,1,0]], color: 4 }, // S
            { shape: [[1,1,0],[0,1,1]], color: 5 }, // Z
            { shape: [[1,0,0],[1,1,1]], color: 6 }, // J
            { shape: [[0,0,1],[1,1,1]], color: 7 }, // L
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupMusicControls();
        this.spawnNewPiece();
        this.gameLoop();
        this.updateZenMessage();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case ' ':
                    this.hardDrop();
                    break;
            }
        });

        // Setup restart button event listener
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    setupMusicControls() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const nextTrackBtn = document.getElementById('nextTrackBtn');
        const volumeBtn = document.getElementById('volumeBtn');
        
        playPauseBtn.addEventListener('click', () => this.toggleMusic());
        nextTrackBtn.addEventListener('click', () => this.nextTrack());
        volumeBtn.addEventListener('click', () => this.toggleVolume());
    }
    
    spawnNewPiece() {
        if (!this.nextPiece) {
            this.nextPiece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
        }
        
        this.currentPiece = {
            ...this.nextPiece,
            x: Math.floor(this.BOARD_WIDTH / 2) - 1,
            y: 0,
            shape: this.nextPiece.shape.map(row => [...row])
        };
        
        this.nextPiece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
        this.drawNextPiece();
        
        if (this.checkCollision()) {
            this.gameOver();
        }
        
        this.gameRunning = true;
    }
    
    checkCollision(piece = this.currentPiece, dx = 0, dy = 0) {
        const newX = piece.x + dx;
        const newY = piece.y + dy;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = newX + x;
                    const boardY = newY + y;
                    
                    if (boardX < 0 || boardX >= this.BOARD_WIDTH || 
                        boardY >= this.BOARD_HEIGHT ||
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    movePiece(dx, dy) {
        if (!this.checkCollision(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
        } else if (dy > 0) {
            this.lockPiece();
        }
    }
    
    rotatePiece() {
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        
        const rotatedPiece = { ...this.currentPiece, shape: rotated };
        
        if (!this.checkCollision(rotatedPiece)) {
            this.currentPiece.shape = rotated;
        }
    }
    
    hardDrop() {
        while (!this.checkCollision(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
        }
        this.lockPiece();
    }
    
    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnNewPiece();
        this.updateZenMessage();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // Check the same line again
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.updateLevel();
            this.updateDisplay();
        }
    }
    
    updateLevel() {
        // Zen mode: levels create visual variety, not speed pressure
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel !== this.level) {
            this.level = newLevel;
            // Add subtle visual effects instead of speed changes
            this.addLevelEffect();
        }
    }
    
    addLevelEffect() {
        // Gentle color shifts and particle effects for level progression
        document.body.style.filter = `hue-rotate(${this.level * 15}deg)`;
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    updateZenMessage() {
        const zenMsg = document.querySelector('.zen-message');
        zenMsg.textContent = this.zenMessages[Math.floor(Math.random() * this.zenMessages.length)];
    }
    
    draw() {
        // Clear canvas with soft gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.1)');
        gradient.addColorStop(1, 'rgba(118, 75, 162, 0.1)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawCell(x, y, this.colors[this.board[y][x]]);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawCell(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            this.colors[this.currentPiece.color]
                        );
                    }
                }
            }
        }
        
        // Draw ghost piece for zen guidance
        this.drawGhost();
    }
    
    drawCell(x, y, color) {
        const pixelX = x * this.CELL_SIZE;
        const pixelY = y * this.CELL_SIZE;
        
        // Soft, rounded blocks
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.CELL_SIZE - 2, this.CELL_SIZE - 2);
        
        // Gentle highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.CELL_SIZE - 2, 3);
    }
    
    drawGhost() {
        if (!this.currentPiece) return;
        
        let ghostY = this.currentPiece.y;
        while (!this.checkCollision(this.currentPiece, 0, ghostY - this.currentPiece.y + 1)) {
            ghostY++;
        }
        
        this.ctx.globalAlpha = 0.3;
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    this.drawCell(
                        this.currentPiece.x + x,
                        ghostY + y,
                        this.colors[this.currentPiece.color]
                    );
                }
            }
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const offsetX = Math.floor((3 - this.nextPiece.shape[0].length) / 2);
            const offsetY = Math.floor((3 - this.nextPiece.shape.length) / 2);
            
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        const pixelX = (offsetX + x) * 15;
                        const pixelY = (offsetY + y) * 15;
                        
                        this.nextCtx.fillStyle = this.colors[this.nextPiece.color];
                        this.nextCtx.fillRect(pixelX, pixelY, 14, 14);
                    }
                }
            }
        }
    }
    
    gameLoop(timestamp = 0) {
        if (this.gameRunning && !this.isPaused) {
            if (timestamp - this.dropTime >= this.dropInterval) {
                this.movePiece(0, 1);
                this.dropTime = timestamp;
            }
            
            this.draw();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').style.display = 'block';
    }

    restartGame() {
        document.getElementById('gameOverScreen').style.display = 'none';
        document.body.style.filter = '';
        
        // Reset game state
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.currentPiece = null;
        this.nextPiece = null;
        this.dropTime = 0;
        this.gameRunning = false;
        
        // Update display and restart
        this.updateDisplay();
        this.spawnNewPiece();
        this.updateZenMessage();
    }
    
    // Music Controls
    toggleMusic() {
        const btn = document.getElementById('playPauseBtn');
        if (this.musicPlaying) {
            btn.textContent = '🎵 Play';
            this.musicPlaying = false;
        } else {
            btn.textContent = '⏸ Pause';
            this.musicPlaying = true;
        }
    }
    
    nextTrack() {
        this.musicIndex = (this.musicIndex + 1) % 5;
        this.updateZenMessage();
    }
    
    toggleVolume() {
        const btn = document.getElementById('volumeBtn');
        this.volume = this.volume > 0 ? 0 : 0.3;
        btn.textContent = this.volume > 0 ? '🔊' : '🔇';
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new ZenTetris();
});