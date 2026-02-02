# Gemini Project Context: Ghicește

## Project Overview

"Ghicește" is a Romanian Wordle clone built to run as a Discord Activity. It is a full-stack web application architected as a monorepo using pnpm workspaces.

*   **Frontend**: A responsive React single-page application built with TypeScript and Vite. It handles the game's UI, including the grid, keyboard, and user interactions.
*   **Backend**: A serverless Cloudflare Worker built with the Hono framework. It manages game logic, word validation, and the leaderboard API.
*   **Database**: Cloudflare KV is used for persisting leaderboard scores.
*   **Key Features**:
    *   5-letter Romanian word guessing game.
    *   Session-based gameplay unique to each Discord Activity instance.
    *   A leaderboard to track top scores.
    *   An end-game modal showing results and offering replay options.

## Building and Running

### 1. Installation

Install all dependencies from the root of the project.
```bash
pnpm install
```

### 2. Running for Local Development

Run the frontend and backend development servers in parallel.

```bash
# Terminal 1: Start the backend worker
pnpm --filter server dev

# Terminal 2: Start the frontend React app
pnpm --filter client dev
```
*   The frontend is typically available at `http://localhost:5173` (or the next available port).
*   The backend worker runs on a separate port, and its API is proxied.

### 3. Building for Production

To build the frontend for deployment:
```bash
pnpm --filter client build
```
This will generate a `dist` directory in `packages/client`.

### 4. Deployment

The project is designed for Cloudflare Pages and Workers.

*   **Backend (Worker)**:
    ```bash
    cd packages/server
    pnpm wrangler deploy
    ```
*   **Frontend (Pages)**:
    ```bash
    cd packages/client
    pnpm build
    npx wrangler pages deploy dist --project-name=ghiceste
    ```

## Development Conventions

*   **Monorepo Structure**: The project is organized in a `packages` directory containing `client` and `server` workspaces, managed by pnpm.
*   **State Management**: The client uses React Hooks (`useState`, `useCallback`, `useEffect`) for state management. The core game logic is encapsulated in the `useGame` custom hook.
*   **Styling**: The frontend uses plain CSS modules and global stylesheets (`index.css`). It utilizes CSS variables for theming and colors (e.g., `var(--color-correct)`).
*   **Routing**: Client-side navigation is handled by `react-router-dom`.
*   **API**: The client interacts with the backend via a RESTful API defined in the server's Hono routes. The API endpoints include `/api/validate`, `/api/reveal/:instanceId`, and `/api/leaderboard/:instanceId`.
*   **Code Style**: The code is written in TypeScript, follows standard React and Hono patterns, and is formatted consistently.
