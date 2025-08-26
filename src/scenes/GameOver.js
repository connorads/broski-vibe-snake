import { Scene } from 'phaser';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create ()
    {
        //  Get the scores and winner from the registry
        const player1Score = this.registry.get('player1Score') || 0;
        const player2Score = this.registry.get('player2Score') || 0;
        const winner = this.registry.get('winner') || 'Unknown';

        const titleStyle = { fontFamily: 'Arial Black', fontSize: 56, color: '#e74c3c', stroke: '#000000', strokeThickness: 6 };
        const scoreStyle = { fontFamily: 'Arial', fontSize: 32, color: '#ecf0f1', stroke: '#000000', strokeThickness: 2 };
        const winnerStyle = { fontFamily: 'Arial Black', fontSize: 40, color: '#f39c12', stroke: '#000000', strokeThickness: 4 };

        this.add.image(400, 300, 'background');

        // Game Over title
        this.add.text(400, 150, 'GAME OVER', titleStyle).setOrigin(0.5);

        // Winner announcement
        let winnerText = '';
        if (winner === 'Tie') {
            winnerText = "It's a Tie!";
        } else {
            winnerText = `${winner} Wins!`;
        }
        this.add.text(400, 220, winnerText, winnerStyle).setOrigin(0.5);

        // Final scores
        const scoreText = [
            '',
            `Player 1 (Green): ${player1Score}`,
            `Player 2 (Red): ${player2Score}`,
            '',
            'Click to Play Again'
        ];

        this.add.text(400, 350, scoreText, scoreStyle).setAlign('center').setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }
}
