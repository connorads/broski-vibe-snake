# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multiplayer snake game built with Phaser 3 and Vite. Two players control separate snakes using different keyboard controls (WASD vs Arrow keys) in a classic Nokia-style snake game.

## Development Commands

- `npm run dev` - Start development server with hot reloading at <http://localhost:5173>
- `npm run build` - Build for production (outputs to `dist/`)  
- `npm run preview` - Preview production build locally

## Architecture

This project uses **Phaser 3's scene-based architecture**. The game flow follows this pattern:

```
Boot → Preloader → MainMenu → SnakeGame → GameOver → (loops back to MainMenu)
```

### Scene Flow and Responsibilities

- **Boot**: Initial scene that loads essential assets (preloader image)
- **Preloader**: Loads game assets and displays loading progress
- **MainMenu**: Game title screen with instructions and start trigger
- **SnakeGame**: Core gameplay scene with dual-player snake mechanics
- **GameOver**: Displays final scores, winner, and restart option

### Game State Management

The `SnakeGame` scene manages:

- **Grid-based movement system**: 20px grid with timer-driven updates (150ms intervals)
- **Dual player state**: Each snake has `body`, `direction`, `nextDirection`, `color`, `score`
- **Collision detection**: Walls, self-collision, inter-player collision
- **Food system**: Random spawn with collision avoidance
- **Score tracking**: Via Phaser's registry system for cross-scene data

### Player Controls Implementation

- **Player 1**: WASD keys (green snake, starts at grid 5,5)
- **Player 2**: Arrow keys (red snake, starts at grid 35,25)
- **Input handling**: Uses `keyboard.addKeys()` and `createCursorKeys()` with direction validation to prevent immediate reversals

### Key Technical Details

- **Rendering**: Uses Phaser Graphics API for real-time drawing (no sprites)
- **Movement**: Grid-based with `body` array manipulation (unshift new head, pop tail)
- **Game loop**: Timer-based updates rather than frame-based for consistent speed
- **Food spawning**: Validates against both snakes' body positions
- **Win conditions**: First death, mutual death (score comparison), or collision scenarios

## Asset Structure

- `public/assets/` - Contains background image and logo
- Original coin clicker assets remain but are unused
- Game uses procedural graphics (rectangles) for snakes and food

## Configuration

- **Game dimensions**: 800x600 (40x30 grid cells)
- **Physics**: Arcade physics with zero gravity
- **Background color**: `#2c3e50` (dark blue-gray)
- **Phaser scale mode**: FIT with center alignment
