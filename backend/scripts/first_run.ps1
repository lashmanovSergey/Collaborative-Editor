copy .env.example .env
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements\dev.txt
docker compose down -v
docker compose up -d
alembic upgrade head
uvicorn src.main:app --reload
