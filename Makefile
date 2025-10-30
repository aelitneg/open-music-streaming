# Open Music Streaming - Docker Compose Management

.PHONY: build up down help 

help: ## Show available commands
	@echo "Available commands:"
	@echo "  make build - Build images for services"
	@echo "  make up   - Start all services"
	@echo "  make down - Stop all services"
	@echo "  make migrate NAME=<name> - Run Prisma migrations with a name"
	@echo "  make generate - Generate Prisma client"

build: ## Build images for services
	docker-compose pull
	docker-compose build

up: ## Start all services
	docker-compose up

down: ## Stop all services
	docker-compose down

migrate: ## Run Prisma migrations
	@test -n "$(NAME)" || (echo "Error: NAME is required. Usage: make migrate NAME=<name>" && exit 1)
	docker-compose exec server npx prisma migrate dev --name $(NAME)

generate: ## Generate Prisma client
	docker-compose exec server npx prisma generate