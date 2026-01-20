import hmac
import hashlib
import time
from urllib.parse import parse_qsl

def _secret_key(bot_token: str) -> bytes:
    return hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()

def verify_init_data(init_data: str, bot_token: str, max_age_sec: int = 60 * 60 * 24) -> dict:
    pairs = parse_qsl(init_data, keep_blank_values=True)
    data = dict(pairs)

    given_hash = data.pop("hash", None)
    if not given_hash:
        raise ValueError("No hash in initData")

    auth_date = data.get("auth_date")
    if auth_date and auth_date.isdigit():
        age = int(time.time()) - int(auth_date)
        if age > max_age_sec:
            raise ValueError("initData too old")

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items(), key=lambda x: x[0]))

    secret = _secret_key(bot_token)
    calc_hash = hmac.new(secret, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(calc_hash, given_hash):
        raise ValueError("Bad initData hash")

    return data

