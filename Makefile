name = transcendence

# pipefail: a failing pg_dump must not leave a "successful" empty backup behind gzip
SHELL := /bin/bash
.SHELLFLAGS := -o pipefail -c

#ssl certificates
SSL_DIR = nginx/ssl
KEY = $(SSL_DIR)/key.pem
CERT = $(SSL_DIR)/cert.pem

# .env file generation
ENV_FILE = .env

COMPOSE_CMD = docker compose
PROD_CMD = docker compose -f docker-compose.prod.yml
BACKUP_DIR = backups

all: $(CERT) $(ENV_FILE)
	@printf "Launch configuration ${name}...\n"
	@git submodule update --init --recursive
	@$(COMPOSE_CMD) up --build
#	@printf "Server listening on ...https://localhost:4443 and frontend landing page https://localhost:4443/wireframe/landing\n"

$(CERT):
	mkdir -p $(SSL_DIR)
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout $(KEY) \
		-out $(CERT) \
		-subj "/CN=localhost"

$(ENV_FILE):
	@cp .env.example .env
	@JWT=$$(openssl rand -base64 48); sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$$JWT|" .env
	@DBPW=$$(openssl rand -hex 24); sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$$DBPW|" .env
	@printf "Generated new JWT_SECRET and POSTGRES_PASSWORD in .env\n"

# Production stack behind a TLS proxy (no certificate needed here): see docker-compose.prod.yml
prod: $(ENV_FILE)
	@git submodule update --init --recursive
	@$(PROD_CMD) up --build -d

prod-down:
	@$(PROD_CMD) down

prod-logs:
	@$(PROD_CMD) logs -f --tail=100

# Pull, back up, rebuild and restart the production stack.
update: backup
	git pull --ff-only
	git submodule update --init --recursive
	$(PROD_CMD) up --build -d

# Database dump + avatars, from the running stack. Restore with:
#   gunzip -c backups/db-<stamp>.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'
#   docker compose -f docker-compose.prod.yml exec -T backend tar xzf - -C /app/src < backups/uploads-<stamp>.tar.gz
backup:
	@mkdir -p $(BACKUP_DIR)
	@stamp=$$(date +%F-%H%M%S); \
	$(PROD_CMD) exec -T postgres sh -c 'pg_dump --clean --if-exists -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"' \
		| gzip > $(BACKUP_DIR)/db-$$stamp.sql.gz || { rm -f $(BACKUP_DIR)/db-$$stamp.sql.gz; exit 1; }; \
	$(PROD_CMD) exec -T backend tar czf - -C /app/src uploads \
		> $(BACKUP_DIR)/uploads-$$stamp.tar.gz || { rm -f $(BACKUP_DIR)/uploads-$$stamp.tar.gz; exit 1; }; \
	printf "Backup written to $(BACKUP_DIR)/*-$$stamp.*\n"

# Give an existing account the admin role: `make admin username=<username>`.
# Both stacks share the project name, so this reaches whichever postgres is running.
admin:
	@test -n "$(username)" || { echo "usage: make admin username=<username>"; exit 1; }
	@echo "UPDATE \"User\" SET role = 'ADMIN' WHERE username = :'name';" \
		| $(PROD_CMD) exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" -v name="$$0"' "$(username)"

# After editing backend/prisma/schema.prisma (dev stack running): `make migration desc=add_something`.
# The dev container does not mount prisma/, so the schema goes in and the new migration comes back out.
migration:
	@test -n "$(desc)" || { echo "usage: make migration desc=<what_changed>"; exit 1; }
	@$(COMPOSE_CMD) cp backend/prisma/schema.prisma backend:/app/prisma/schema.prisma
	@$(COMPOSE_CMD) exec backend npx prisma migrate dev --name "$(desc)"
	@$(COMPOSE_CMD) cp backend:/app/prisma/migrations/. backend/prisma/migrations/

down:
	@printf "Stopping configuration ${name}...\n"
	@$(COMPOSE_CMD) down

re: down all

clean: down
	@printf "Cleaning configuration ${name}...\n"
	@$(COMPOSE_CMD) down --rmi local

fclean: clean
	@printf "Total clean of all configurations docker\n"
	@$(COMPOSE_CMD) down --rmi local -v
	rm -f $(KEY) $(CERT)
	rm -rf nginx/ssl
	rm -f .env

seed:
	@docker exec -it backend npx prisma db seed

.PHONY: all down re clean fclean seed prod prod-down prod-logs update backup admin migration
