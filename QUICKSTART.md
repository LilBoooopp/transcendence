# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Clone & Setup
```bash
git clone --recurse-submodules git@github.com:LilBoooopp/transcendence.git
cd transcendence
cp .env.example .env
```

If you already cloned without that flag:
```bash
git submodule update --init --recursive
```

#### Updating the chess engin
```bash
cd frontend/src/components/chess
git pull origin main
cd ../../../..
git add frontend/src/components/chess
git commit -m "Update chess submodule"
git push
```

### 2. Edit .env (Required)
Open `.env` and change:
- `POSTGRES_PASSWORD` to a secure password
- `JWT_SECRET` to a random string (at least 32 characters)

### 3. Start Everything
```bash
make
```

### 4. Access the Application
Open: **https://localhost:8443**

⚠️ Click "Advanced" → "Proceed to localhost" when you see the SSL warning (this is expected with self-signed certificates).

## ✅ You're Ready!

Create an account and start playing chess!

## Common Commands
```bash
# Stop everything
make down

# View logs
docker logs {container_name} 

# Restart just the backend
docker-compose restart backend

# Access backend terminal
docker exec -it chess-backend sh
```

## Having Issues?

1. **Port conflicts**: Make sure ports 80, 443, 3000, 4000, 5432 aren't in use
2. **Database errors**: Run `docker-compose down -v` then start again
3. **Build errors**: Try `docker-compose build --no-cache`

See the main README.md for detailed documentation.
