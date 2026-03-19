name = transcendence

#ssl certificates
SSL_DIR = nginx/ssl
KEY = $(SSL_DIR)/key.pem
CERT = $(SSL_DIR)/cert.pem

# .env file generation
ENV_FILE = .env

COMPOSE_CMD = docker compose 

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
	@printf "Generated new JWT_SECRET in .env\n"

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

 PHONY: all down re clean fclean
