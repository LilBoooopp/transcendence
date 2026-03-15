*This project has been created as part of the 42 curriculum by beboccas, bschmid, cbopp, sforster*

# 42 Chess

## Description

An online chess platform built as the final project of the 42 Common Core. The platform offers real-time multiplayer chess matches, AI opponents powered by Stockfish at variable difficulty levels, player statistics with Elo ratings and a spectator mode.

**Key features:**
- Real-time multiplayer chess with WebSocket-based game synchronization
- Variable time controls (e.g., 3+2, 5+0, 10+0) with additive increment
- AI opponent powered by Stockfish (UCI protocol, multiple difficulty levels)
- Per-time-control matchmaking queues
- Spectator mode for live games
- Player statistics and Elo rating system
- Custom chess engine (TypeScript, no external chess libraries)

## Instructions

### Prerequisites

- Docker and Docker Compose (v2+)
- Git (with submode support)
- A `.env` file configured from `.env.example`

### Setup

1. Clone the repository with submodes:
    ```bash
    git clone --recurse-submodules
    cd transcendence
    ```

2. Copy and configure the environment file:
    ```bash
    cp .env.example .env
    # Edit .env with your values (DB credentials, JWT secret, etc.)
    ```

3. Build and start all services:
    ```bash
    make
    ```

4. The application will be available at `https://localhost` (Nginx reverse proxy with HTTPS).

### Environment Variables

See `.env.example` for a full list of required variables, including:
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` - database credentials
- `JWT_SECRET` - secret key for authentication tokens
- `[PLACEHOLDER: list any other required .env variables]`

### Development

To run individual services in development mode:
```bash
# Frontend only
cd frontend && npm install && npm start

# Backend only
cd backend && npm install && npm run start
```

## Team Information

| Login | Name | Role(s) |
|-------|------|---------|
| cbopp | Charlie Bopp | Product Owner, Developer |
| bschmid | Bastian Schmid | Project Manager, Developer |
| sforster | Sylvie Forster | Technical Lead, Developer |
| beboccas | Bertrand Boccassino | Developer |

### Responsibilities

- **cbpop (Product Owner, Developer)** - Defined product vision and feature priorities. Maintained the product backlog. Implemented WebSocket infrastructure (Socket.IO gateway, real-time game synchronization, matchmaking queues, spectator mode).

- **bschmid (Project Manager, Developer)** - Facilitated team coordination, tracked progress, and organized sprints. [PLACEHOLDER: list technical contributions]

- **sforster (Technical Lead, Developer)** - Defined the technical architecture and made key technology decisions. Ensured code quality and reviewed critical changes. [PLACEHOLDER: list technical contributions]

- **beboccas (Developer)** - [PLACEHOLDER: list technical contributions]

## Project Management

### Work Organization

[PLACEHOLDER: describe how you divided the work - e.g., "We split the project into frontend, backend, and chess engine tracks, Each sprint lasted one week and was planned during a weekly meeting."]

### Tools Used

- **Version control:** GitHub with branch rulesets (PR-before-merge, no force push, restricted deletions)
- **Task tracking:** GitHub Issues and Projects.
- **Communication:** a Discord server with categorized channels and a webhook linked to 

### Meetings

[PLACEHOLDER]

## Technical Stack

### Frontend
- **React + TypeScript** - component-based UI with strong typing
- **Tailwind CSS** - utility-first styling for rapid, consistent design
- **Socket.IO client** - real-time bidirectional communication with the backend
- **React Router** - client-side routing (`/game/:gameId`, `/play`, `/bot-launch`, etc.)

### Backend
- **NestJS + TypeScript** - structured, modular server framework well-suited to WebSocket gateways and REST APIs
- **Socket.IO (server)** - manages game rooms, matchmaking queues, and live event broadcasting
- **Stockfish** - AI chess engine integrated as a persistent sub process vio the UCI protocol; chosen as a subprocess (not a library) so the team retains full understanding of the chess logic

### Database
- **PostgreSQL 15** - chosen for its reliability, relational integrity, and strong support for complex queries (Elo calculations)
- **Prisma ORM** - type-safe query builder that integrates directly with TypeScript; eliminates raw SQL boilerplate while keeping the schema version-controlled

### Chess Engine
- **Custom TypeScript engine** - implemented from scratch (no external chess libraries) as a git submodule shared between the frontend and backend. Includes move generation, legal move validation, check/checkmate/stalemate detection, and a minimax AI with alpha-beta pruning and MVV-LVA move ordering.

### Infrastructure
- **Docker + Docker Compose** - each service (frontend, backend, database, nginx) runs in its own container for reproducibility
- **Nginx** -reverse proxy handling HTTPS termination and routing between rontend and backend

## Database Schema

[PLACEHOLDER: insert a diagram maybe?]

### Tables

**users**
| Field | Type | Description|
|-------|------|------------|
| id | UUID | Primary key |
| login | VARCHAR | 42 login, unique |
| display_name | VARCHAR | Public display name |
| elo | INT | Current Elo rating |
| created_at | TIMESTAMP | Account creation data |

**games**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| white_id | UUID | FK -> users.id |
| black_id | UUID | FK -> users.id |
| time_control | VARCHAR | e.g. "5+3" |
| result | ENUM | white_win / black_win / draw |
| pgn | TEXT | Full game PGN |
| created_at | TIMESTAMP | Game start time |

...

## Features List

| Feature | Description | Implemented by |
|---------|-------------|----------------|
| Real-time multiplayer | Two players matched via queue play chess live with WebSocket sync | cbopp |
| Variable time contorls | Supports time+increment format (e.g., 3+2); parsed and enforced server-side | cbopp |
| Matchmaking queues | Per-time-control queues; players are apried automatically | cbopp |
| AI opponent (Stockfish) | Bot games against Stockfish at configurable depth; UCI subprocess per game | cbopp |
| Spectator mode | Any authenticated user can watch a live game is read-only mode | cbopp |
| Elo ratings | Rating updates after each rated game using standard Elo formula | cbopp |
| User profiles | View your own stats, game history, and rating | bschmid |
| User authentication | Registration, login, JWT-based sessions | beboccas, sforster |
| Custom chess engine | Full move generation and validation without external libraries | cbopp |
| [PLACEHOLDER] |

## Modules

**Total: 13 points** (7 major x 2pts + 3 minor * 1pt - see breakdown below)

### Web (9 points)

| Module | Type | Points | Implementation | Memeber(s) |
|--------|------|--------|----------------|------------|
| Frontend + Backend frameworks (React/NestJS) | Major | 2 | React/TypeScript SPA served via Vite; NestJS REST WS gateway | everyone |
| Real-time WebSocket features | Major | 2 | Socket.IO gateway with rooms, matchmaking, psectator events | cbopp |
| ORM (Prisma) | Minor | 1 | Prisma schema + migrations; type-safe DB access throughout backend | everyone |
| Custom-made design, reusable components | Minor | 1 | Shared component library (GamePage, MatchmakingWaiting, etc.) with Tailwind | bschmid |

*Not yet implemented:*
- Major: Public API (2pt)
- Minor: Notification system (1pt)

### User Management (3 points)

| Module | Type | Points | Implementation | Member(s) |
|--------|------|--------|----------------|-----------|
| Standard user management | Major | 2 | [PLACEHOLDER] | everyone |
| Game statistics | Minor | 1 | | [PLACEHOLDER] | bschmid, sforster |

### Gaming (8 points)

| Module | Type | Points | Implementation | Member(s) |
|--------|------|--------|----------------|-----------|
| Web-based chess game | Major | 2 | Custom TS engine (flat 64-array board, fullrules) | cbopp |
| Remote players | Major | 2 | Socket.IO rooms with role assignment (white/black/spectator) and reconnect handling | cbopp |
| AI opponent (stockfish) | Major | 2 | Stockfish binary as persisten UCI subprocess per bot game | cbopp |
| Watch live games | Minor | 1 | Spectators join game rooms in read-only mode | cbopp |

*Not yet implemented:*
- Minor: Tournament system (1pt) 

## Individual Contributions

### cbopp (Charlie Bopp)
- Designed and implemented the entire WebSocket layer: Socket.IO gateway, game rooms, matchmaking system, reconnect logic
- Built the time control system with additive increment and per-time-control queue routing
- Integrated Stockfish as a UCI subprocess with persisten process management per bot game
- Refactored frontend game logic into reusable hooks (`useGameSetup`, `useChessGame`) and shared components
- **Challenges:** Stale closures in Socket.IO callbacks required refs for all mutable game state; socket timing required defensive checks for already-connected sockets; bot reconnect logic needed explicit branches since bot games set `gameStarted: true` immediately

### bschmid (Bastian Schmid)
[PLACEHOLDER]

### sforster (Sylvie Forster)
- Design and implement the entire API routes. 
- backend for user authentication
- Prototype html page for login and users (for api call)
- Git template

### beboccas (Bertrand Boccassino)
[PLACEHOLDER]

## Resources

- [React Documentation](https://react.dev/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [chess.js](https://github.com/jhlywa/chess.js)
- [Stockfish](https://stockfishchess.org/)
- [Stockfish UCI Protocol](https://www.schredderchess.com/chess-features/uci-universal-chess-interface.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Elo Rating System](https://en.wikipedia.org/wiki/Elo_rating_system)

### Tutorials

- [NestJS Controllers](https://docs.nestjs.com/controllers)
- [NestJS Concepts](https://youtu.be/IdsBwplQAMw?si=oAu46pcgzciqx4dj)
- [NestJS Authentication](https://youtu.be/i-howKMrtCM?si=pm7ZRD6mTZmuodSb)
- [NestJS Architecture](https://youtu.be/vIP0iH3q3oc?si=4kuGUW-mNGS-Nkzj)
- [Node Package Manager](https://www.w3schools.com/whatis/whatis_npm.asp)
- [TypeScript](https://www.w3schools.com/typescript)
- [JavaScript](https://www.w3schools.com/js/js_intro.asp)
- [NodeJS Concepts](https://www.youtube.com/watch?v=q-xS25lsN3I)
- [REST API](https://www.geeksforgeeks.org/node-js/rest-api-introduction)
- [REST API](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design)
- [Prisma Concepts](https://youtu.be/rLRIB6AF2Dg?si=Mq9R75zedI5CHr4q)
- [Prisma Relationships](https://youtu.be/fpBYj55-zd8?si=kyxVMuKvGfTI3tyr)
- [JWT Concepts](https://www.youtube.com/watch?v=7Q17ubqLfaM)


### AI Usage

AI tools were used during the development of this project for the following purposes:

- Understand the project stack and architecture
- Explore the codebase and component interactions
- Assist with debugging
- Help implement some TypeScript functions

All generated suggestions were reviewed, tested, and adapted before being integrated into the project

[PLACEHOLDER]

## Project Structure
```
chess-platform/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── src/
│   │   └── chess/          # Chess engine submodule
│   └── prisma/
│       └── schema.prisma
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
├── database/
│   └── init.sql
└── nginx/
    ├── Dockerfile
    ├── nginx.conf
    └── ssl/
```

## License

Educational project for 42 School.

