*This project has been created as part of the 42 curriculum by [beboccas], [bschmid], [cbopp], [sforster]*

# Chess Platform

## Description

An online chess platform featuring real-time multiplayer gameplay, AI opponents powered by Stockfish, tournament system, player statistics with Elo ratings, spectator mode, and comprehensive user interaction features.

## Quick Start

See [QUICKSTART.md](QUICKSTART.md) for a 5-minute setup guide.

## Team Information

### Team Members
1. **[Charlie Bopp]** ([cbopp]) - [Product Owner, Developer]
2. **[Bastian Schmid]** ([bschmid]) - [Project Manager, Developer]
3. **[Sylvie Forster]** ([sforster]) - [Technical Lead, Developer]
4. **[Bertrand Boccassino]** ([beboccas]) - [Developer]

## Technical Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL 15 + Prisma ORM
- **WebSocket**: Socket.io
- **Chess Engine**: Stockfish
- **Containerization**: Docker + Docker Compose
- **HTTPS**: Nginx reverse proxy

## Project Structure
```
chess-platform/
├── docker-compose.yml
├── frontend/          # React application
├── backend/           # NestJS API
├── database/          # PostgreSQL initialization
└── nginx/             # HTTPS reverse proxy
```

## Modules (18 Points)

### Web (5 points)
- ✅ Major: Frontend + Backend frameworks (2pts)
- ✅ Major: Real-time WebSocket features (2pts)
- ✅ Minor: ORM (Prisma) (1pt)

### User Management (3 points)
- Major: Standard user management (2pts)
- Minor: Game statistics (1pt)

### Gaming (7 points)
- Major: Web-based chess game (2pts)
- Major: Remote players (2pts)
- Major: AI opponent (Stockfish) (2pts)
- Minor: Tournament system (1pt)

### User Interaction (2 points)
- Major: Chat, profiles, friends (2pts)

### Spectator Mode (1 point)
- Minor: Watch live games (1pt)

**Total: 18 Points** (4 points bonus)

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
```

**What this does:**
- Provides basic project overview
- Template that you'll fill in with your team details
- Lists your module choices (18 points)

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
