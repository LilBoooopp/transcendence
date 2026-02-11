# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Clone & Setup
```bash
git clone <your-repo-url>
cd chess-platform
cp .env.example .env
```

### 2. Edit .env (Required)
Open `.env` and change:
- `POSTGRES_PASSWORD` to a secure password
- `JWT_SECRET` to a random string (at least 32 characters)

### 3. Generate SSL Certificates
```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/CN=localhost"
```

### 4. Start Everything
```bash
docker-compose up --build
```

Wait for all services to start (1-2 minutes first time).

### 5. Initialize Database
In a new terminal:
```bash
docker exec -it chess-backend npx prisma migrate dev --name init
```

### 6. Access the Application
Open: **https://localhost**

⚠️ Click "Advanced" → "Proceed to localhost" when you see the SSL warning (this is expected with self-signed certificates).

## ✅ You're Ready!

Create an account and start playing chess!

## Common Commands
```bash
# Stop everything
docker-compose down

# View logs
docker-compose logs -f

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
