import json
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from db import init_db, upsert_user, get_user, add_coins
from tg_auth import verify_init_data

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WEB_DIR = Path(__file__).with_name("web")
INDEX_PATH = WEB_DIR / "index.html"

# отдаём /static/app.js
app.mount("/static", StaticFiles(directory=str(WEB_DIR)), name="static")

@app.on_event("startup")
def _startup():
    init_db()
    if not BOT_TOKEN:
        print("WARNING: BOT_TOKEN env is empty. Set it on Render (Environment Variables).")

@app.get("/", response_class=HTMLResponse)
def index():
    if not INDEX_PATH.exists():
        return HTMLResponse("<h1>index.html not found</h1>", status_code=500)
    return HTMLResponse(INDEX_PATH.read_text(encoding="utf-8"))

def _get_tg_user(init_data: str) -> dict:
    if not BOT_TOKEN:
        raise HTTPException(status_code=500, detail="BOT_TOKEN missing on server")

    try:
        data = verify_init_data(init_data, BOT_TOKEN)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    user_json = data.get("user")
    if not user_json:
        raise HTTPException(status_code=400, detail="No user in initData")

    try:
        return json.loads(user_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Bad user JSON")

@app.post("/api/me")
def me(payload: dict):
    init_data = payload.get("initData", "")
    user = _get_tg_user(init_data)

    tg_id = int(user["id"])
    upsert_user(tg_id, user.get("first_name"), user.get("username"))
    u = get_user(tg_id)
    return {"ok": True, "user": u}

@app.post("/api/reward")
def reward(payload: dict):
    init_data = payload.get("initData", "")
    user = _get_tg_user(init_data)

    tg_id = int(user["id"])

    # сколько начислять (ограничим, чтобы нельзя было накрутить)
    try:
        amount = int(payload.get("amount", 10))
    except Exception:
        amount = 10

    if amount < 1:
        amount = 1
    if amount > 20:
        amount = 20

    coins = add_coins(tg_id, amount)
    return {"ok": True, "added": amount, "coins": coins}

@app.get("/version")
def version():
    return {"version": "v2", "commit": "57be39d"}

