name = transcendence

#ssl certificates
SSL_DIR = nginx/ssl
KEY = $(SSL_DIR)/key.pem
CERT = $(SSL_DIR)/cert.pem

COMPOSE_CMD = docker compose 

all:$(CERT)
	@printf "Launch configuration ${name}...\n"
	@$(COMPOSE_CMD) up --build

$(CERT):
	mkdir -p $(SSL_DIR)
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout $(KEY) \
		-out $(CERT) \
		-subj "/CN=localhost"

down:
	@printf "Stopping configuration ${name}...\n"
	@$(COMPOSE_CMD) down

re: down all

clean: down
	@printf "Cleaning configuration ${name}...\n"
	@docker system prune -a

fclean: clean
	@printf "Total clean of all configurations docker\n"
	rm -f $(KEY) $(CERT)
	rm -rf nginx/ssl
	# @docker volume rm

.PHONY: all down re clean fclean
