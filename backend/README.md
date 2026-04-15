# collaborative editor backend

simple backend for variant c: version history, undo/restore, and periodic snapshots.

## rest api

| method | endpoint | action |
|---|---|---|
| get | `/` | redirects to `/auth` |
| get | `/auth` | page with auth form |
| post | `/auth` | authentication |
| get | `/register` | page with register form |
| post | `/register` | registration |
| get | `/profile` | main page |
| post | `/logout` | logout, redirects to `/auth` |
| get | `/rooms` | list all created room |
| post | `/rooms` | create room |
| delete | `/rooms/{guid}` | delete room |
| get | `/rooms/{guid}/versions` | get room history |
| delete | `/rooms/{guid}/versions/{v}` | delete room version |
| patch | `/rooms/{guid}/versions/{v}` | update room version |
| post | `/rooms/{guid}/versions/{v}` | create room version |
| get | `/rooms/{guid}/versions/{v}` | get room version |
| get | `/ws/{guid}` | websockets |

## quick start on windows

1. create `.env`:

```powershell
Copy-Item .env.example .env
```

2. start postgres and redis:

```powershell
docker compose up -d
```

3. if docker volumes were created earlier and the database state is broken, recreate them:

```powershell
docker compose down -v
docker compose up -d
```

4. create a virtual environment and install dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements\dev.txt
```

5. run migrations:

```powershell
alembic upgrade head
```

6. start the server:

```powershell
uvicorn src.main:app --reload
```

## useful urls

- docs: `http://127.0.0.1:8000/docs`
- auth page: `http://127.0.0.1:8000/auth`
- register page: `http://127.0.0.1:8000/register`
- profile: `http://127.0.0.1:8000/profile`
