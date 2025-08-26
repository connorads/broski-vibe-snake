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

        // Initialize Player 1 Snake (Green)
        this.snake1 = {
            body: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
            direction: { x: 1, y: 0 },
            nextDirection: { x: 1, y: 0 },
            color: 0x27ae60,
            score: 0
        };

        // Initialize Player 2 Snake (Red)  
        this.snake2 = {
            body: [{ x: 30, y: 15 }, { x: 29, y: 15 }, { x: 28, y: 15 }],
            direction: { x: 1, y: 0 },
            nextDirection: { x: 1, y: 0 },
            color: 0xe74c3c,
            score: 0
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
        this.add.text(16, this.GAME_HEIGHT - 80, 'Player 1 (Green): WASD  Player 2 (Red): Arrow Keys', {
            fontSize: '16px',
            fill: '#bdc3c7'
        });
        this.add.text(16, this.GAME_HEIGHT - 60, 'Eat your colored food to shrink opponent\'s territory!', {
            fontSize: '16px',
            fill: '#f39c12'
        });

        // Game loop timer
        this.gameTimer = this.time.addEvent({
            delay: 150,
            callback: this.updateGame,
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

        // Check wall collision
        if (newHead.x < 0 || newHead.x >= this.COLS || newHead.y < 0 || newHead.y >= this.ROWS) {
            return false; // Collision with wall
        }

        // Check boundary collision
        if (newHead.x === this.boundaryX) {
            return false; // Collision with boundary
        }

        // Check self collision
        for (let segment of snake.body) {
            if (newHead.x === segment.x && newHead.y === segment.y) {
                return false; // Self collision
            }
        }

        // Check collision with other snake
        const otherSnake = snake === this.snake1 ? this.snake2 : this.snake1;
        for (let segment of otherSnake.body) {
            if (newHead.x === segment.x && newHead.y === segment.y) {
                return false; // Collision with other snake
            }
        }

        // Add new head
        snake.body.unshift(newHead);

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
    }
}