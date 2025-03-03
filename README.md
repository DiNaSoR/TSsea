# OpenSail (TSsea)

A multiplayer sailing boat simulation game that runs in the browser using HTML, CSS, JavaScript, and WebGL.

## Features

- Realistic sailing physics with wind and wave effects
- 3D graphics using Three.js (WebGL)
- Multiplayer racing with real-time synchronization
- Customizable boat controls
- Dynamic environment with changing wind conditions
- Race course with buoys and lap tracking

## Installation

### Prerequisites

- Node.js (v14 or later)
- npm (usually comes with Node.js)

### Setup

1. Clone or download this repository
2. Navigate to the project directory in your terminal
3. Install dependencies:

```bash
npm install
```

## Running the Game

### Single Player Mode

You can open the `index.html` file directly in your browser to play in single player mode.

### Multiplayer Mode

To enable multiplayer functionality, you need to run the Node.js server:

```bash
npm start
```

Then open your browser and go to `http://localhost:3000` to play. Other players can connect to your IP address on port 3000.

## Game Controls

- **Arrow Left/Right** or **A/D**: Control the rudder (steer the boat)
- **Arrow Up/Down** or **W/S**: Adjust the sail angle
- **1, 2, 3**: Switch between camera views (follow, overhead, first-person)
- **ESC**: Pause/Resume game

## Sailing Tips

- Pay attention to the wind direction (shown by the wind indicator in the top right)
- Adjust your sail angle based on the wind direction for optimal speed
- You can't sail directly into the wind (this is called "in irons")
- The fastest point of sail is typically at about 45 degrees to the wind
- Use the rudder sparingly for smoother, faster sailing

## Development

The game is structured into several key components:

- `boat.js`: Boat physics and rendering
- `environment.js`: Wind and wave simulation
- `renderer.js`: Three.js scene management
- `controls.js`: User input handling
- `game.js`: Game state management
- `client.js`: Browser initialization
- `server.js`: Multiplayer server

To run in development mode with automatic server restarts:

```bash
npm run dev
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Three.js](https://threejs.org/)
- Multiplayer functionality powered by [Socket.IO](https://socket.io/)
- Tugboat model by Unknown Author
