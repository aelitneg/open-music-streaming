# Open Music Streaming - Docker Compose Management

.PHONY: build up down help 

help: ## Show available commands
	@echo "Available commands:"
	@echo "  make build - Build images for services"
	@echo "  make up   - Start all services"
	@echo "  make down - Stop all services"

build: ## Build images for services
	docker-compose pull
	docker-compose build

up: ## Start all services
	docker-compose up

down: ## Stop all services
	docker-compose down
