.PHONY: setup run dev test clean help

# Default target
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Create venv, install deps, copy .env
	@source setup.sh

run: ## Start the server (production mode)
	@source .venv/bin/activate && python main.py

dev: ## Start the server with auto-reload
	@source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload

test-health: ## Test /health endpoint
	@curl -s http://localhost:8000/health | python3 -m json.tool

test-auth: ## Test /api/auth/login endpoint
	@curl -s -X POST http://localhost:8000/api/auth/login \
		-H "Content-Type: application/json" \
		-d '{"username":"admin","password":"cardioai"}' | python3 -m json.tool

test-predict: ## Test /api/predict endpoint
	@curl -s -X POST http://localhost:8000/api/predict \
		-H "Content-Type: application/json" \
		-d '{"patient_name":"João","idade":55,"frequencia_cardiaca":85,"spo2":96.5,"pressao_sistolica":140,"pressao_diastolica":90,"glicemia":110.0,"carga_sistema":45.0,"disponibilidade_recursos":70.0,"historico_cardiopatia":1}' | python3 -m json.tool

test-sensors: ## Test /api/sensors (ingest + latest)
	@curl -s -X POST http://localhost:8000/api/sensors \
		-H "Content-Type: application/json" \
		-d '{"temperature":36.8,"heart_rate":75,"device_id":"esp32-01"}' | python3 -m json.tool
	@echo "--- Latest readings ---"
	@curl -s http://localhost:8000/api/sensors/latest | python3 -m json.tool

test-symptoms: ## Test /api/symptoms endpoints
	@curl -s http://localhost:8000/api/symptoms/knowledge | python3 -m json.tool

test-all: test-health test-auth test-predict test-sensors test-symptoms ## Run all endpoint tests

clean: ## Remove venv and caches
	rm -rf .venv __pycache__ src/__pycache__ src/**/__pycache__
