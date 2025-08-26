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
            body: [{ x: 35, y: 25 }, { x: 36, y: 25 }, { x: 37, y: 25 }],
            direction: { x: -1, y: 0 },
            nextDirection: { x: -1, y: 0 },
            color: 0xe74c3c,
            score: 0
        };

        // Food
        this.food = { x: 0, y: 0 };
        this.spawnFood();

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
        this.add.text(16, this.GAME_HEIGHT - 60, 'Player 1: WASD  Player 2: Arrow Keys', {
            fontSize: '18px',
            fill: '#bdc3c7'
        });

        // Game loop timer
        this.gameTimer = this.time.addEvent({
            delay: 150,
            callback: this.updateGame,
            callbackScope: this,
            loop: true
        });
    }

    spawnFood()
    {
        let validPosition = false;
        while (!validPosition) {
            this.food.x = Phaser.Math.Between(0, this.COLS - 1);
            this.food.y = Phaser.Math.Between(0, this.ROWS - 1);
            
            // Make sure food doesn't spawn on snakes
            validPosition = true;
            
            for (let segment of this.snake1.body) {
                if (segment.x === this.food.x && segment.y === this.food.y) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                for (let segment of this.snake2.body) {
                    if (segment.x === this.food.x && segment.y === this.food.y) {
                        validPosition = false;
                        break;
                    }
                }
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

        // Check food collision
        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            snake.score++;
            this.spawnFood();
        } else {
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

    updateGame()
    {
        if (this.gameOver) return;

        this.handleInput();
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

        // Draw Food (Yellow)
        this.graphics.fillStyle(0xf1c40f);
        this.graphics.fillRect(
            this.food.x * this.GRID_SIZE,
            this.food.y * this.GRID_SIZE,
            this.GRID_SIZE - 2,
            this.GRID_SIZE - 2
        );
    }
}