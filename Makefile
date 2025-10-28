# Open Music Streaming - Docker Compose Management

.PHONY: up down help

help: ## Show available commands
	@echo "Available commands:"
	@echo "  make up   - Start all services"
	@echo "  make down - Stop all services"

up: ## Start all services
	docker-compose up

down: ## Stop all services
	docker-compose down