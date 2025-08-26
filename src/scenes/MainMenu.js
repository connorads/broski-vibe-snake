import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const textStyle = { fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff', stroke: '#000000', strokeThickness: 4 };
        const titleStyle = { fontFamily: 'Arial Black', fontSize: 48, color: '#2ecc71', stroke: '#000000', strokeThickness: 6 };

        this.add.image(400, 300, 'background');

        // Title
        this.add.text(400, 150, 'MULTIPLAYER SNAKE', titleStyle).setOrigin(0.5);

        const instructions = [
            'Player 1: Use WASD keys',
            'Player 2: Use Arrow keys',
            '',
            'Eat food to grow your snake!',
            'Avoid walls and other snake!',
            '',
            'Click to Start!'
        ]

        this.add.text(400, 350, instructions, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ecf0f1',
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('SnakeGame');
        });
    }
}
