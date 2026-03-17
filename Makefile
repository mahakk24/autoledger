.PHONY: up down seed test

up:
	docker compose -f docker/docker-compose.yml up --build -d

down:
	docker compose -f docker/docker-compose.yml down

seed:
	cd backend && python ../scripts/seed.py

test:
	cd backend && pytest tests/ -v

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev
