name = transcendence

COMPOSE_CMD = docker compose 


all:
	@printf "Launch configuration ${name}...\n"
	@$(COMPOSE_CMD) up --build

down:
	@printf "Stopping configuration ${name}...\n"
	@$(COMPOSE_CMD) down

re: down all

clean: down
	@printf "Cleaning configuration ${name}...\n"
	@docker system prune -a

fclean: clean
	@printf "Total clean of all configurations docker\n"
	@docker volume rm $$(docker volume ls -q)

.PHONY: all down re clean fclean
