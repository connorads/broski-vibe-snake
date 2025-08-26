import { Scene } from 'phaser';

export class SnakeGame extends Scene
{
    constructor ()
    {
        super('SnakeGame');
    }

    create ()
    {
        // Game settings
        this.GRID_SIZE = 20;
        this.GAME_WIDTH = 800;
        this.GAME_HEIGHT = 600;
        this.COLS = this.GAME_WIDTH / this.GRID_SIZE;
        this.ROWS = this.GAME_HEIGHT / this.GRID_SIZE;

        // Game state
        this.gameOver = false;
        this.winner = null;

        // Boundary system
        this.boundaryX = Math.floor(this.COLS / 2); // Start at center (column 20)
        this.BOUNDARY_SHIFT_AMOUNT = 1; // Grid cells to move per food eaten
        this.MIN_BOUNDARY = 5; // Minimum boundary position (ensures minimum territory)
        this.MAX_BOUNDARY = this.COLS - 5; // Maximum boundary position

        // Power-up system
        this.powerUps = [];
        this.POWER_UP_SPAWN_INTERVAL = 8000; // Spawn every 8 seconds
        this.POWER_UP_LIFETIME = 5000; // Power-ups last 5 seconds on field
        this.POWER_UP_TYPES = {
            SPEED: { color: 0xffd700, name: 'speed', duration: 5000, symbol: '⚡' },
            SHIELD: { color: 0x3498db, name: 'shield', duration: 3000, symbol: '🛡' },
            FREEZE: { color: 0x00ffff, name: 'freeze', duration: 3000, symbol: '❄' },
            GHOST: { color: 0x9b59b6, name: 'ghost', duration: 5000, symbol: '👻' },
            SHRINK: { color: 0xff69b4, name: 'shrink', instant: true, symbol: '✨' }
        };
        this.activePowerUps = {
            player1: [],
            player2: []
        };

        // Initialize Player 1 Snake (Green)
        this.snake1 = {
            body: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
            direction: { x: 1, y: 0 },
            nextDirection: { x: 1, y: 0 },
            color: 0x27ae60,
            score: 0,
            baseSpeed: 150,
            currentSpeed: 150
        };

        // Initialize Player 2 Snake (Red)  
        this.snake2 = {
            body: [{ x: 30, y: 15 }, { x: 29, y: 15 }, { x: 28, y: 15 }],
            direction: { x: 1, y: 0 },
            nextDirection: { x: 1, y: 0 },
            color: 0xe74c3c,
            score: 0,
            baseSpeed: 150,
            currentSpeed: 150
        };

        // Food for each player
        this.food1 = { x: 0, y: 0 }; // Food for Player 1
        this.food2 = { x: 0, y: 0 }; // Food for Player 2
        this.food1Color = 0xffffff; // Will be randomized
        this.food2Color = 0xffffff; // Will be randomized
        this.spawnFood1();
        this.spawnFood2();

        // Graphics for drawing
        this.graphics = this.add.graphics();

        // Create input keys
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');

        // Score text
        this.scoreText = this.add.text(16, 16, 'Player 1: 0  Player 2: 0', {
            fontSize: '24px',
            fill: '#ffffff'
        });

        // Instructions
        this.add.text(16, this.GAME_HEIGHT - 100, 'Player 1 (Green): WASD  Player 2 (Red): Arrow Keys', {
            fontSize: '16px',
            fill: '#bdc3c7'
        });
        this.add.text(16, this.GAME_HEIGHT - 80, 'Eat your colored food to shrink opponent\'s territory!', {
            fontSize: '16px',
            fill: '#f39c12'
        });
        this.add.text(16, this.GAME_HEIGHT - 60, 'Special power-ups: ⚡Speed 🛡Shield ❄Freeze 👻Ghost ✨Shrink', {
            fontSize: '14px',
            fill: '#e74c3c'
        });

        // Power-up status display
        this.powerUpStatus1 = this.add.text(16, 50, '', {
            fontSize: '14px',
            fill: '#27ae60'
        });
        this.powerUpStatus2 = this.add.text(16, 70, '', {
            fontSize: '14px',
            fill: '#e74c3c'
        });

        // Game loop timer
        this.gameTimer = this.time.addEvent({
            delay: 150,
            callback: this.updateGame,
            callbackScope: this,
            loop: true
        });

        // Power-up spawn timer
        this.powerUpSpawnTimer = this.time.addEvent({
            delay: this.POWER_UP_SPAWN_INTERVAL,
            callback: this.spawnPowerUp,
            callbackScope: this,
            loop: true
        });
    }

    getRandomFoodColor()
    {
        // Define a pool of vibrant colors that aren't snake colors
        const colorPool = [
            0xf1c40f, // Yellow
            0x9b59b6, // Purple
            0x3498db, // Blue
            0xe67e22, // Orange
            0x1abc9c, // Turquoise
            0xe91e63, // Pink
            0x8bc34a, // Light Green (different from snake green)
            0xff5722, // Deep Orange
            0x607d8b, // Blue Gray
            0xffc107, // Amber
            0x795548, // Brown
            0x009688, // Teal
        ];
        
        // Filter out colors that are too similar to snake colors
        const snake1Color = this.snake1.color;
        const snake2Color = this.snake2.color;
        
        const availableColors = colorPool.filter(color => 
            color !== snake1Color && color !== snake2Color
        );
        
        // Return a random color from the available pool
        return availableColors[Math.floor(Math.random() * availableColors.length)];
    }

    spawnPowerUp()
    {
        if (this.gameOver) return;
        
        // Random power-up type
        const powerUpTypes = Object.keys(this.POWER_UP_TYPES);
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        const powerUpData = this.POWER_UP_TYPES[randomType];
        
        // Find valid position
        let validPosition = false;
        let x, y;
        
        while (!validPosition) {
            x = Phaser.Math.Between(1, this.COLS - 2);
            y = Phaser.Math.Between(1, this.ROWS - 2);
            
            // Don't spawn on boundary
            if (x === this.boundaryX) continue;
            
            validPosition = true;
            
            // Check snakes
            for (let segment of this.snake1.body) {
                if (segment.x === x && segment.y === y) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                for (let segment of this.snake2.body) {
                    if (segment.x === x && segment.y === y) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            // Check foods
            if (validPosition) {
                if ((this.food1.x === x && this.food1.y === y) || 
                    (this.food2.x === x && this.food2.y === y)) {
                    validPosition = false;
                }
            }
            
            // Check other power-ups
            if (validPosition) {
                for (let powerUp of this.powerUps) {
                    if (powerUp.x === x && powerUp.y === y) {
                        validPosition = false;
                        break;
                    }
                }
            }
        }
        
        // Create power-up
        const powerUp = {
            x: x,
            y: y,
            type: randomType,
            color: powerUpData.color,
            spawnTime: this.time.now
        };
        
        this.powerUps.push(powerUp);
    }

    updatePowerUps()
    {
        // Remove expired power-ups
        const currentTime = this.time.now;
        this.powerUps = this.powerUps.filter(powerUp => {
            return (currentTime - powerUp.spawnTime) < this.POWER_UP_LIFETIME;
        });
        
        // Update active power-up effects
        this.updateActivePowerUps();
    }

    updateActivePowerUps()
    {
        const currentTime = this.time.now;
        
        // Update player 1 power-ups
        this.activePowerUps.player1 = this.activePowerUps.player1.filter(powerUp => {
            return (currentTime - powerUp.startTime) < powerUp.duration;
        });
        
        // Update player 2 power-ups
        this.activePowerUps.player2 = this.activePowerUps.player2.filter(powerUp => {
            return (currentTime - powerUp.startTime) < powerUp.duration;
        });
        
        // Update snake speeds
        this.updateSnakeSpeed(this.snake1, this.activePowerUps.player1);
        this.updateSnakeSpeed(this.snake2, this.activePowerUps.player2);
        
        // Update power-up status display
        this.updatePowerUpDisplay();
    }

    updateSnakeSpeed(snake, activePowerUps)
    {
        let speedMultiplier = 1;
        let hasFreezeEffect = false;
        
        // Check for speed effects on this snake
        for (let powerUp of activePowerUps) {
            if (powerUp.type === 'SPEED') {
                speedMultiplier = 0.6; // Faster (lower delay)
            }
        }
        
        // Check if this snake is frozen by opponent
        const otherPlayerPowerUps = snake === this.snake1 ? this.activePowerUps.player2 : this.activePowerUps.player1;
        for (let powerUp of otherPlayerPowerUps) {
            if (powerUp.type === 'FREEZE') {
                speedMultiplier = 1.8; // Slower (higher delay)
                hasFreezeEffect = true;
            }
        }
        
        snake.currentSpeed = Math.floor(snake.baseSpeed * speedMultiplier);
        
        // Update game timer if speeds changed
        if (this.gameTimer) {
            this.gameTimer.remove();
            this.gameTimer = this.time.addEvent({
                delay: Math.min(this.snake1.currentSpeed, this.snake2.currentSpeed),
                callback: this.updateGame,
                callbackScope: this,
                loop: true
            });
        }
    }

    updatePowerUpDisplay()
    {
        // Player 1 status
        let status1 = 'P1: ';
        for (let powerUp of this.activePowerUps.player1) {
            const remainingTime = Math.ceil((powerUp.duration - (this.time.now - powerUp.startTime)) / 1000);
            const symbol = this.POWER_UP_TYPES[powerUp.type].symbol;
            status1 += `${symbol}${remainingTime}s `;
        }
        this.powerUpStatus1.setText(status1);
        
        // Player 2 status
        let status2 = 'P2: ';
        for (let powerUp of this.activePowerUps.player2) {
            const remainingTime = Math.ceil((powerUp.duration - (this.time.now - powerUp.startTime)) / 1000);
            const symbol = this.POWER_UP_TYPES[powerUp.type].symbol;
            status2 += `${symbol}${remainingTime}s `;
        }
        this.powerUpStatus2.setText(status2);
    }

    applyPowerUp(snake, powerUpType)
    {
        const player = snake === this.snake1 ? 'player1' : 'player2';
        const powerUpData = this.POWER_UP_TYPES[powerUpType];
        
        if (powerUpData.instant) {
            // Handle instant effects
            if (powerUpType === 'SHRINK') {
                if (snake.body.length > 3) {
                    snake.body.splice(-2, 2); // Remove 2 segments from tail
                }
            }
        } else {
            // Handle duration effects
            this.activePowerUps[player].push({
                type: powerUpType,
                startTime: this.time.now,
                duration: powerUpData.duration
            });
        }
    }

    hasActivePowerUp(snake, powerUpType)
    {
        const player = snake === this.snake1 ? 'player1' : 'player2';
        return this.activePowerUps[player].some(powerUp => powerUp.type === powerUpType);
    }

    spawnFood1()
    {
        let validPosition = false;
        while (!validPosition) {
            // Spawn in Player 1's territory (left of boundary)
            this.food1.x = Phaser.Math.Between(0, this.boundaryX - 1);
            this.food1.y = Phaser.Math.Between(0, this.ROWS - 1);
            
            // Make sure food doesn't spawn on snakes or other food
            validPosition = true;
            
            for (let segment of this.snake1.body) {
                if (segment.x === this.food1.x && segment.y === this.food1.y) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                for (let segment of this.snake2.body) {
                    if (segment.x === this.food1.x && segment.y === this.food1.y) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            if (validPosition) {
                if (this.food1.x === this.food2.x && this.food1.y === this.food2.y) {
                    validPosition = false;
                }
            }
        }
        
        // Assign a random color to the food
        this.food1Color = this.getRandomFoodColor();
    }

    spawnFood2()
    {
        let validPosition = false;
        while (!validPosition) {
            // Spawn in Player 2's territory (right of boundary)
            this.food2.x = Phaser.Math.Between(this.boundaryX + 1, this.COLS - 1);
            this.food2.y = Phaser.Math.Between(0, this.ROWS - 1);
            
            // Make sure food doesn't spawn on snakes or other food
            validPosition = true;
            
            for (let segment of this.snake1.body) {
                if (segment.x === this.food2.x && segment.y === this.food2.y) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                for (let segment of this.snake2.body) {
                    if (segment.x === this.food2.x && segment.y === this.food2.y) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            if (validPosition) {
                if (this.food2.x === this.food1.x && this.food2.y === this.food1.y) {
                    validPosition = false;
                }
            }
        }
        
        // Assign a random color to the food
        this.food2Color = this.getRandomFoodColor();
    }

    moveBoundary(direction)
    {
        const oldBoundaryX = this.boundaryX;
        
        if (direction === 'left') {
            // Player 1 scored, move boundary right (giving Player 1 more space)
            this.boundaryX = Math.min(this.MAX_BOUNDARY, this.boundaryX + this.BOUNDARY_SHIFT_AMOUNT);
        } else if (direction === 'right') {
            // Player 2 scored, move boundary left (giving Player 2 more space)
            this.boundaryX = Math.max(this.MIN_BOUNDARY, this.boundaryX - this.BOUNDARY_SHIFT_AMOUNT);
        }

        // If boundary moved, check if foods need to be respawned
        if (this.boundaryX !== oldBoundaryX) {
            // Check if food1 is now outside Player 1's territory
            if (this.food1.x >= this.boundaryX) {
                this.spawnFood1();
            }
            
            // Check if food2 is now outside Player 2's territory
            if (this.food2.x <= this.boundaryX) {
                this.spawnFood2();
            }
        }
    }

    handleInput()
    {
        // Player 1 controls (WASD)
        if (this.wasd.W.isDown && this.snake1.direction.y !== 1) {
            this.snake1.nextDirection = { x: 0, y: -1 };
        } else if (this.wasd.S.isDown && this.snake1.direction.y !== -1) {
            this.snake1.nextDirection = { x: 0, y: 1 };
        } else if (this.wasd.A.isDown && this.snake1.direction.x !== 1) {
            this.snake1.nextDirection = { x: -1, y: 0 };
        } else if (this.wasd.D.isDown && this.snake1.direction.x !== -1) {
            this.snake1.nextDirection = { x: 1, y: 0 };
        }

        // Player 2 controls (Arrow Keys)
        if (this.cursors.up.isDown && this.snake2.direction.y !== 1) {
            this.snake2.nextDirection = { x: 0, y: -1 };
        } else if (this.cursors.down.isDown && this.snake2.direction.y !== -1) {
            this.snake2.nextDirection = { x: 0, y: 1 };
        } else if (this.cursors.left.isDown && this.snake2.direction.x !== 1) {
            this.snake2.nextDirection = { x: -1, y: 0 };
        } else if (this.cursors.right.isDown && this.snake2.direction.x !== -1) {
            this.snake2.nextDirection = { x: 1, y: 0 };
        }
    }

    moveSnake(snake)
    {
        // Update direction
        snake.direction = { ...snake.nextDirection };
        
        // Calculate new head position
        const head = snake.body[0];
        const newHead = {
            x: head.x + snake.direction.x,
            y: head.y + snake.direction.y
        };

        // Check if snake has ghost power-up (can pass through walls/boundary)
        const hasGhost = this.hasActivePowerUp(snake, 'GHOST');
        
        // Check wall collision (unless ghost)
        if (!hasGhost && (newHead.x < 0 || newHead.x >= this.COLS || newHead.y < 0 || newHead.y >= this.ROWS)) {
            return false; // Collision with wall
        }

        // Wrap around if ghost and hitting walls
        if (hasGhost) {
            if (newHead.x < 0) newHead.x = this.COLS - 1;
            if (newHead.x >= this.COLS) newHead.x = 0;
            if (newHead.y < 0) newHead.y = this.ROWS - 1;
            if (newHead.y >= this.ROWS) newHead.y = 0;
        }

        // Check boundary collision (unless ghost)
        if (!hasGhost && newHead.x === this.boundaryX) {
            return false; // Collision with boundary
        }

        // Check self collision (unless has shield)
        const hasShield = this.hasActivePowerUp(snake, 'SHIELD');
        if (!hasShield) {
            for (let segment of snake.body) {
                if (newHead.x === segment.x && newHead.y === segment.y) {
                    return false; // Self collision
                }
            }
        }

        // Check collision with other snake (unless has shield)
        const otherSnake = snake === this.snake1 ? this.snake2 : this.snake1;
        if (!hasShield) {
            for (let segment of otherSnake.body) {
                if (newHead.x === segment.x && newHead.y === segment.y) {
                    return false; // Collision with other snake
                }
            }
        }

        // Add new head
        snake.body.unshift(newHead);

        // Check power-up collision
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (newHead.x === powerUp.x && newHead.y === powerUp.y) {
                this.applyPowerUp(snake, powerUp.type);
                this.powerUps.splice(i, 1); // Remove consumed power-up
                break;
            }
        }

        // Check food collision (each snake can only eat their own food)
        let foodEaten = false;
        if (snake === this.snake1 && newHead.x === this.food1.x && newHead.y === this.food1.y) {
            // Player 1 ate their food
            snake.score++;
            this.moveBoundary('left'); // Move boundary right, giving Player 1 more space
            this.spawnFood1();
            foodEaten = true;
        } else if (snake === this.snake2 && newHead.x === this.food2.x && newHead.y === this.food2.y) {
            // Player 2 ate their food
            snake.score++;
            this.moveBoundary('right'); // Move boundary left, giving Player 2 more space
            this.spawnFood2();
            foodEaten = true;
        }

        if (!foodEaten) {
            // Remove tail if no food eaten
            snake.body.pop();
        }

        return true; // No collision
    }

    checkGameOver()
    {
        if (this.gameOver) return;

        const snake1Alive = this.moveSnake(this.snake1);
        const snake2Alive = this.moveSnake(this.snake2);

        if (!snake1Alive && !snake2Alive) {
            // Both snakes died
            if (this.snake1.score > this.snake2.score) {
                this.winner = 'Player 1';
            } else if (this.snake2.score > this.snake1.score) {
                this.winner = 'Player 2';
            } else {
                this.winner = 'Tie';
            }
            this.endGame();
        } else if (!snake1Alive) {
            // Only snake 1 died
            this.winner = 'Player 2';
            this.endGame();
        } else if (!snake2Alive) {
            // Only snake 2 died
            this.winner = 'Player 1';
            this.endGame();
        }
    }

    endGame()
    {
        this.gameOver = true;
        this.gameTimer.remove();
        this.powerUpSpawnTimer.remove();
        
        // Store final scores
        this.registry.set('player1Score', this.snake1.score);
        this.registry.set('player2Score', this.snake2.score);
        this.registry.set('winner', this.winner);
        
        // Transition to game over scene
        this.time.delayedCall(1000, () => {
            this.scene.start('GameOver');
        });
    }

    update()
    {
        if (this.gameOver) return;
        
        this.handleInput();
    }

    updateGame()
    {
        if (this.gameOver) return;

        this.updatePowerUps(); // Update power-up system
        this.checkGameOver();
        this.updateScore();
        this.render();
    }

    updateScore()
    {
        this.scoreText.setText(`Player 1: ${this.snake1.score}  Player 2: ${this.snake2.score}`);
    }

    render()
    {
        this.graphics.clear();

        // Draw Player 1 Snake (Green)
        this.graphics.fillStyle(this.snake1.color);
        for (let segment of this.snake1.body) {
            this.graphics.fillRect(
                segment.x * this.GRID_SIZE,
                segment.y * this.GRID_SIZE,
                this.GRID_SIZE - 2,
                this.GRID_SIZE - 2
            );
        }

        // Draw Player 2 Snake (Red)
        this.graphics.fillStyle(this.snake2.color);
        for (let segment of this.snake2.body) {
            this.graphics.fillRect(
                segment.x * this.GRID_SIZE,
                segment.y * this.GRID_SIZE,
                this.GRID_SIZE - 2,
                this.GRID_SIZE - 2
            );
        }

        // Draw Boundary Wall (Full Column)
        // Fill the entire boundary column
        this.graphics.fillStyle(0x95a5a6); // Light gray wall
        this.graphics.fillRect(
            this.boundaryX * this.GRID_SIZE,
            0,
            this.GRID_SIZE,
            this.GAME_HEIGHT
        );
        
        // Draw left border (bright white)
        this.graphics.lineStyle(2, 0xffffff);
        this.graphics.beginPath();
        this.graphics.moveTo(this.boundaryX * this.GRID_SIZE, 0);
        this.graphics.lineTo(this.boundaryX * this.GRID_SIZE, this.GAME_HEIGHT);
        this.graphics.strokePath();
        
        // Draw right border (bright white)
        this.graphics.beginPath();
        this.graphics.moveTo((this.boundaryX + 1) * this.GRID_SIZE, 0);
        this.graphics.lineTo((this.boundaryX + 1) * this.GRID_SIZE, this.GAME_HEIGHT);
        this.graphics.strokePath();

        // Draw Food1 (Random color for Player 1)
        this.graphics.fillStyle(this.food1Color);
        this.graphics.fillRect(
            this.food1.x * this.GRID_SIZE,
            this.food1.y * this.GRID_SIZE,
            this.GRID_SIZE - 2,
            this.GRID_SIZE - 2
        );

        // Draw Food2 (Random color for Player 2)
        this.graphics.fillStyle(this.food2Color);
        this.graphics.fillRect(
            this.food2.x * this.GRID_SIZE,
            this.food2.y * this.GRID_SIZE,
            this.GRID_SIZE - 2,
            this.GRID_SIZE - 2
        );

        // Draw Power-ups with flashing effect
        const currentTime = this.time.now;
        for (let powerUp of this.powerUps) {
            const timeLeft = this.POWER_UP_LIFETIME - (currentTime - powerUp.spawnTime);
            
            // Flash faster as expiration approaches
            let shouldDraw = true;
            if (timeLeft < 2000) { // Start flashing in last 2 seconds
                const flashSpeed = timeLeft < 1000 ? 200 : 400; // Flash faster in last second
                shouldDraw = Math.floor(currentTime / flashSpeed) % 2 === 0;
            }
            
            if (shouldDraw) {
                this.graphics.fillStyle(powerUp.color);
                this.graphics.fillRect(
                    powerUp.x * this.GRID_SIZE + 2,
                    powerUp.y * this.GRID_SIZE + 2,
                    this.GRID_SIZE - 4,
                    this.GRID_SIZE - 4
                );
                
                // Draw border for power-ups
                this.graphics.lineStyle(2, 0xffffff);
                this.graphics.strokeRect(
                    powerUp.x * this.GRID_SIZE + 2,
                    powerUp.y * this.GRID_SIZE + 2,
                    this.GRID_SIZE - 4,
                    this.GRID_SIZE - 4
                );
            }
        }

        // Visual effects for snakes with active power-ups
        this.renderSnakeEffects();
    }

    renderSnakeEffects()
    {
        
        // Player 1 effects
        for (let powerUp of this.activePowerUps.player1) {
            if (powerUp.type === 'SHIELD') {
                // Draw shield effect around snake
                this.graphics.lineStyle(3, 0x3498db, 0.7);
                for (let segment of this.snake1.body) {
                    this.graphics.strokeCircle(
                        segment.x * this.GRID_SIZE + this.GRID_SIZE/2,
                        segment.y * this.GRID_SIZE + this.GRID_SIZE/2,
                        this.GRID_SIZE/2 + 2
                    );
                }
            }
            if (powerUp.type === 'SPEED') {
                // Draw speed trails
                this.graphics.lineStyle(2, 0xffd700, 0.5);
                for (let i = 1; i < this.snake1.body.length; i++) {
                    const segment = this.snake1.body[i];
                    this.graphics.strokeRect(
                        segment.x * this.GRID_SIZE - 1,
                        segment.y * this.GRID_SIZE - 1,
                        this.GRID_SIZE,
                        this.GRID_SIZE
                    );
                }
            }
        }
        
        // Player 2 effects
        for (let powerUp of this.activePowerUps.player2) {
            if (powerUp.type === 'SHIELD') {
                // Draw shield effect around snake
                this.graphics.lineStyle(3, 0x3498db, 0.7);
                for (let segment of this.snake2.body) {
                    this.graphics.strokeCircle(
                        segment.x * this.GRID_SIZE + this.GRID_SIZE/2,
                        segment.y * this.GRID_SIZE + this.GRID_SIZE/2,
                        this.GRID_SIZE/2 + 2
                    );
                }
            }
            if (powerUp.type === 'SPEED') {
                // Draw speed trails
                this.graphics.lineStyle(2, 0xffd700, 0.5);
                for (let i = 1; i < this.snake2.body.length; i++) {
                    const segment = this.snake2.body[i];
                    this.graphics.strokeRect(
                        segment.x * this.GRID_SIZE - 1,
                        segment.y * this.GRID_SIZE - 1,
                        this.GRID_SIZE,
                        this.GRID_SIZE
                    );
                }
            }
        }
    }
}