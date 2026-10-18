DEPLOY_DIR := deploy
COMPOSE_PROD := docker compose -f compose.yaml -f compose.prod.yaml

.PHONY: deploy deploy-down deploy-logs deploy-prod deploy-prod-down deploy-prod-logs

deploy:
	@test -f $(DEPLOY_DIR)/.env || (echo "Missing $(DEPLOY_DIR)/.env — run: cp $(DEPLOY_DIR)/.env.example $(DEPLOY_DIR)/.env" && exit 1)
	cd $(DEPLOY_DIR) && docker compose up --build -d

deploy-down:
	cd $(DEPLOY_DIR) && docker compose down

deploy-logs:
	cd $(DEPLOY_DIR) && docker compose logs -f

deploy-prod:
	@test -f $(DEPLOY_DIR)/.env || (echo "Missing $(DEPLOY_DIR)/.env — run: cp $(DEPLOY_DIR)/.env.example $(DEPLOY_DIR)/.env" && exit 1)
	cd $(DEPLOY_DIR) && $(COMPOSE_PROD) --env-file .env up --build -d

deploy-prod-down:
	cd $(DEPLOY_DIR) && $(COMPOSE_PROD) down

deploy-prod-logs:
	cd $(DEPLOY_DIR) && $(COMPOSE_PROD) logs -f
