PLC_REPO  := https://github.com/did-method-plc/did-method-plc
PLC_DIR   := did-method-plc
PLC_IMAGE := plc:latest

HANDLE         ?= newuser.test.com
EMAIL          ?= newuser@test.com
PASSWORD       ?= secret
ADMIN_PASSWORD ?= $(shell grep -E '^PDS_ADMIN_PASSWORD=' .env | tail -1 | cut -d= -f2-)

POSTGRES_USER     := $(shell grep -E '^POSTGRES_USER=' .env | tail -1 | cut -d= -f2-)
POSTGRES_PASSWORD := $(shell grep -E '^POSTGRES_PASSWORD=' .env | tail -1 | cut -d= -f2-)
DATABASE_URL      := postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@localhost:5432/app

.PHONY: plc-build stack-up stack-down create-account backend-up frontend-up db-generate db-migrate db-studio

$(PLC_DIR)/.git:
	git clone $(PLC_REPO) $(PLC_DIR)

plc-build: $(PLC_DIR)/.git
	docker build -t $(PLC_IMAGE) -f $(PLC_DIR)/packages/server/Dockerfile $(PLC_DIR)

stack-up: plc-build
	docker compose up

stack-down:
	docker compose down

backend-up:
	DATABASE_URL=$(DATABASE_URL) pnpm --filter open-music-streaming-backend dev

frontend-up:
	pnpm --filter frontend dev

db-generate:
	DATABASE_URL=$(DATABASE_URL) pnpm --filter open-music-streaming-backend db:generate

db-migrate:
	DATABASE_URL=$(DATABASE_URL) pnpm --filter open-music-streaming-backend db:migrate

db-studio:
	DATABASE_URL=$(DATABASE_URL) pnpm --filter open-music-streaming-backend db:studio

create-account:
	@INVITE=$$(docker compose exec -T pds goat pds admin create-invites | tr -d '\r\n') && \
	curl -s --show-error -X POST http://localhost:3000/xrpc/com.atproto.server.createAccount \
		-H "Content-Type: application/json" \
		-d "{\"email\":\"$(EMAIL)\",\"handle\":\"$(HANDLE)\",\"password\":\"$(PASSWORD)\",\"inviteCode\":\"$$INVITE\"}" \
		| jq .
