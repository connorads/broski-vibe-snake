# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multiplayer snake game built with Phaser 3 and Vite. Two players control separate snakes using different keyboard controls (WASD vs Arrow keys) in a competitive territory-based snake game with a dynamic boundary system.

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
- **Dual player state**: Each snake has `body`, `direction`, `nextDirection`, `color`, `score`, `baseSpeed`, `currentSpeed`
- **Collision detection**: Walls, self-collision, inter-player collision, dynamic boundary collision (with power-up exceptions)
- **Territory-based food system**: Each player has color-coded food that spawns in their territory
- **Dynamic boundary system**: Vertical wall that moves based on scoring, shrinking loser's territory
- **Power-up system**: Special foods with temporary effects that spawn every 8 seconds
- **Score tracking**: Via Phaser's registry system for cross-scene data

### Player Controls Implementation

- **Player 1**: WASD keys (green snake, starts at grid 5,5) - eats green food
- **Player 2**: Arrow keys (red snake, starts at grid 30,15) - eats red food  
- **Input handling**: Uses `keyboard.addKeys()` and `createCursorKeys()` with direction validation to prevent immediate reversals

### Key Technical Details

- **Rendering**: Uses Phaser Graphics API for real-time drawing (no sprites)
- **Movement**: Grid-based with `body` array manipulation (unshift new head, pop tail)
- **Game loop**: Timer-based updates rather than frame-based for consistent speed
- **Food spawning**: Two separate foods spawn in respective territories, validates against snakes' positions
- **Boundary system**: Moves 1 grid cell per food eaten, with minimum territory limits (5-35 columns)
- **Win conditions**: First death, mutual death (score comparison), or collision scenarios (walls, boundary, snakes)

## Asset Structure

- `public/assets/` - Contains background image and logo
- Original coin clicker assets remain but are unused
- Game uses procedural graphics (rectangles) for snakes, foods, and boundary wall

## Configuration

- **Game dimensions**: 800x600 (40x30 grid cells)
- **Physics**: Arcade physics with zero gravity
- **Background color**: `#2c3e50` (dark blue-gray)
- **Phaser scale mode**: FIT with center alignment

## Dynamic Boundary Feature

The game includes a competitive territory system:

- **Boundary wall**: Gray column with white borders that moves based on scoring
- **Territory control**: Eating food shrinks opponent's play area by 1 grid cell
- **Color-coded food**: Green food for Player 1, red food for Player 2
- **Territory spawning**: Foods spawn only in respective player territories
- **Minimum space**: Ensures 5 columns minimum territory to keep game winnable
- **Visual clarity**: Full-width boundary wall eliminates collision confusion

## Power-Up System

The game features a dynamic power-up system that adds strategic depth and excitement:

### Power-Up Types

- **⚡ Speed Boost** (Gold `0xffd700`): Increases snake movement speed (0.6x delay) for 5 seconds
- **🛡️ Shield** (Blue `0x3498db`): Grants immunity to all collisions (walls, snakes, boundary) for 3 seconds
- **❄️ Freeze** (Cyan `0x00ffff`): Slows down opponent's movement (1.8x delay) for 3 seconds
- **👻 Ghost** (Purple `0x9b59b6`): Allows passing through walls and boundaries with wraparound for 5 seconds
- **✨ Shrink** (Pink `0xff69b4`): Instantly removes 2 tail segments (minimum 3 segments maintained)

### Power-Up Mechanics

- **Spawn System**: Power-ups spawn every 8 seconds at random valid locations
- **Lifetime**: Each power-up lasts 5 seconds on the field before disappearing
- **Visual Feedback**: Power-ups flash faster as expiration approaches (2-second warning)
- **Status Display**: Real-time countdown timers show active effects for each player
- **Collision Priority**: Power-ups are consumed on contact, taking precedence over other interactions

### Visual Effects

- **Power-up Appearance**: Smaller squares with white borders and distinctive colors
- **Snake Effects**: 
  - Shield: Blue circular auras around snake segments
  - Speed: Golden trail effects on body segments
- **UI Elements**: Status text displays active power-ups with symbols and remaining time

### Implementation Details

- **Dynamic Speed**: Game timer adjusts based on fastest snake's current speed
- **Effect Stacking**: Multiple power-ups can be active simultaneously
- **Territory Agnostic**: Power-ups spawn in both territories, encouraging cross-territory movement
- **Balanced Design**: Durations and effects balanced for competitive gameplay
