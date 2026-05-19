PLC_REPO  := https://github.com/did-method-plc/did-method-plc
PLC_DIR   := did-method-plc
PLC_IMAGE := plc:latest

HANDLE         ?= newuser.test.com
EMAIL          ?= newuser@test.com
PASSWORD       ?= secret
ADMIN_PASSWORD ?= $(shell grep -E '^PDS_ADMIN_PASSWORD=' .env | tail -1 | cut -d= -f2-)

.PHONY: plc-build up down create-account

$(PLC_DIR)/.git:
	git clone $(PLC_REPO) $(PLC_DIR)

plc-build: $(PLC_DIR)/.git
	docker build -t $(PLC_IMAGE) -f $(PLC_DIR)/packages/server/Dockerfile $(PLC_DIR)

up: plc-build
	docker compose up

down:
	docker compose down

create-account:
	@INVITE=$$(docker compose exec -T pds goat pds admin create-invites | tr -d '\r\n') && \
	curl -s --show-error -X POST http://localhost:3000/xrpc/com.atproto.server.createAccount \
		-H "Content-Type: application/json" \
		-d "{\"email\":\"$(EMAIL)\",\"handle\":\"$(HANDLE)\",\"password\":\"$(PASSWORD)\",\"inviteCode\":\"$$INVITE\"}" \
		| jq .
