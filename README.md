# Exam #1: "Last Race"
## Student: s123456 LASTNAME FIRSTNAME 

## React Client Application Routes

- Route `/`: Home page. Displays game instructions. Unauthenticated users can only see this page.
- Route `/login`: Login page. Contains the form to authenticate the user.
- Route `/play`: The main Game Manager. It acts as a state machine managing four child phases: `Setup` (shows network map), `Planning` (90s timer, route building), `Execution` (animated step-by-step event log), and `Result` (win/loss summary).
- Route `/rankings`: Leaderboard page. Displays a table of all registered users and their highest scores.
- Route `/history`: User history page. Displays all past games played by the currently logged-in user.

## API Server

- POST `/api/sessions`
  - Request body: `{ "username": "blossom", "password": "password" }`
  - Response body: `{ "id": 1, "username": "blossom" }` (If successful)
- GET `/api/sessions/current`
  - Request parameters: None (uses Session Cookie)
  - Response body: `{ "id": 1, "username": "blossom" }` or `{ "isAuthenticated": false }`
- DELETE `/api/sessions/current`
  - Request parameters: None
  - Response body: `{}`
- GET `/api/network`
  - Request parameters: None
  - Response body: `{ "stations": [...], "segments": [...] }` (Contains all stations and valid connecting segments).
- GET `/api/rankings`
  - Request parameters: None
  - Response body: `[{ "username": "blossom", "best_score": 22 }, ...]`
- GET `/api/games/history`
  - Request parameters: None
  - Response body: `[{ "id": 1, "score": 15, "timestamp": "..." }, ...]`
- POST `/api/games/init`
  - Request parameters: None
  - Response body: `{ "startStation": {...}, "destStation": {...} }`. (Also securely saves the active game in `req.session`).
- POST `/api/games/submit`
  - Request body: `{ "route": [{ "stationA_id": 1, "stationB_id": 2, ... }, ...] }`
  - Response body: `{ "success": true, "finalScore": 21, "log": [...] }` (Or `success: false` if the route is invalid).

## Database Tables

- Table `users` - contains `id`, `username`, `password` (hashed), and `salt`.
- Table `lines` - contains `id`, `name`, `color`.
- Table `stations` - contains `id`, `name`.
- Table `line_stations` - contains `line_id`, `station_id`, `stop_number`. Resolves the network geometry dynamically.
- Table `events` - contains `id`, `description`, `effect`.
- Table `games` - contains `id`, `user_id`, `score`, `timestamp`.

## Main React Components

- `GameManager` (in `GameManager.jsx`): Manages the state machine (`setup`, `planning`, `execution`, `result`) and handles the API calls for initializing and submitting the game.
- `PlanningPhase` (in `PlanningPhase.jsx`): Implements the 90-second countdown timer, manages the selected vs available segments pools, and handles the logic for flipping segments directionally.
- `ExecutionPhase` (in `GamePhases.jsx`): Progressively renders the server's event log array using `setTimeout` to create a step-by-step animation of the journey.
- `NetworkMap` (in `NetworkMap.jsx`): Dynamically renders an SVG planar graph of the underground network using pre-calculated coordinates to prevent line-crossing, applying CSS drop-shadows and pastel colors.
- `Auth` (in `Auth.jsx`): Contains the `LoginForm`, `LoginButton`, and `LogoutButton` components for handling user authentication via context.

## Screenshots

![Game Phase](./img/game.jpg)
![Ranking Page](./img/ranking.jpg)

## Users Credentials

- `blossom`, `password`
- `bubbles`, `password`
- `buttercup`, `password`

## Use of AI Tools
I utilized AI tools (Gemini) during the development of this project primarily as a helper for architectural design and debugging. 
Specifically, I used AI to:
1. Frontend: Create custom css and generate the geometric mathematical coordinates (`layout`) for the SVG `NetworkMap` component to ensure lines did not overlap in the UI. Clarify debugging concepts regarding React Strict Mode behaviors and `useEffect` timer cleanups.
2. Database: Refine the SQLite DB initialization script to ensure the required constraints were met.
3. Backend: Ensure the architecture complied with the requirements and for bug fixes. 

All AI-generated logic was thoroughly reviewed, adapted, and manually verified by myself to ensure it adhered strictly to the course's requirements and best practices.
