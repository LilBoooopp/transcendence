*This project has been created as part of the 42 curriculum by beboccas, bschmid, cbopp, sforster*

# 42 Chess

## Description

An online chess platform built as the final project of the 42 Common Core. The platform offers real-time multiplayer chess matches, AI opponents powered by Stockfish at variable difficulty levels, player statistics with Elo ratings and a spectator mode.

**Key features:**
- Real-time multiplayer chess with WebSocket-based game synchronization
- Variable time controls (e.g., 3+2, 5+0, 10+%) with additive increment
- AI opponent powered by Stockfish (UCI protocol, multiple difficulty levels)
- Per-time-control matchmaking queues
- Spectator mode for live games
- Player statistics and Elo rating system
- Custom chess engine (TypeScript, no external chess libraries)

## Instructions

### Prerequisitets

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

- **bschimd (Project Manager, Developer)** - Facilitated team coordination, tracked progress, and organized sprints. [PLACEHOLDER: list technical contributions]

- **sforster (Technical Lead, Developer)** - Defined the technical architecture and made key technology decisinos. Ensured code quality and reviewed critical changes. [PLACEHOLDER: list technical contributions]

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

## Project Structure
```
chess-platform/
├── docker-compose.yml
├── frontend/          # React application
├── backend/           # NestJS API
├── database/          # PostgreSQL initialization
└── nginx/             # HTTPS reverse proxy
```

## Modules (12 Points)

### Web (9 points)
- ✅ Major: Frontend + Backend frameworks (2pts)
- ✅ Major: Real-time WebSocket features (2pts)
- ✅ Minor: ORM (Prisma) (1pt)
- ✅ Minor: Custom-made design, reusable components (1pt)
- Major: Public API (2pts)
- Minor: Notification system (1pt)

### User Management (3 points)
- Major: Standard user management (2pts)
- Minor: Game statistics (1pt)

### Gaming (8 points)
- ✅ Major: Web-based chess game (2pts)
- ✅ Major: Remote players (2pts)
- ✅ Major: AI opponent (Stockfish) (2pts)
- ✅ Minor: Watch live games (1pt)
- Minor: Tournament system (1pt)

### User Interaction (2 points)
- Major: Chat, profiles, friends (2pts)

**Total: 13 Points** (theoretical total: 22)

## Installation

See [QUICKSTART.md](QUICKSTART.md)

## Resources

- [React Documentation](https://react.dev/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [chess.js](https://github.com/jhlywa/chess.js)
- [Stockfish](https://stockfishchess.org/)

## License

Educational project for 42 School.

---

## Summary - Complete File Structure

```
chess-platform/
├── docker-compose.yml          
├── .env.example                 
├── .gitignore                  
│
├── backend/
│   ├── Dockerfile               
│   ├── package.json             
│   ├── tsconfig.json           
│   ├── nest-cli.json          
│   └── prisma/
│       └── schema.prisma     
│
├── frontend/
│   ├── Dockerfile              
│   ├── package.json           
│   ├── tsconfig.json         
│   └── tailwind.config.js   
│
├── database/
│   └── init.sql            
│
└── nginx/
    ├── Dockerfile              
    ├── nginx.conf             
    └── ssl/                  
```
