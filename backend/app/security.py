"""Sécurité : hachage des mots de passe, JWT, et calcul de paie."""
from datetime import datetime, timedelta

import bcrypt
import jwt

from .config import settings


# ---------- Mots de passe ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


# ---------- JWT ----------
def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


# ---------- Paie (barème modifiable) ----------
def compute_payslip(brut: int, cfg) -> dict:
    """Calcule le bulletin à partir d'un barème (objet PayrollConfig ou dict)."""
    cnss_rate = getattr(cfg, "cnss_rate", None) or cfg["cnss_rate"]
    cnss_ceiling = getattr(cfg, "cnss_ceiling", None) or cfg["cnss_ceiling"]
    cnss_patronal_rate = getattr(cfg, "cnss_patronal", None) or cfg["cnss_patronal"]
    brackets = getattr(cfg, "iuts_brackets", None)
    if brackets is None:
        brackets = cfg["iuts_brackets"]

    base_cnss = min(brut, cnss_ceiling)
    cnss_salarie = round(cnss_rate / 100 * base_cnss)
    cnss_patronal = round(cnss_patronal_rate / 100 * base_cnss)

    # IUTS progressif sur (brut - cnss salarié)
    base = brut - cnss_salarie
    tax, prev = 0.0, 0
    for b in brackets:
        ceil = b.get("ceil") if isinstance(b, dict) else b.ceil
        rate = b.get("rate") if isinstance(b, dict) else b.rate
        ceil = float("inf") if ceil is None else ceil
        if base > prev:
            tax += (min(base, ceil) - prev) * (rate / 100)
            prev = ceil
        else:
            break
    iuts = round(tax)
    net = brut - cnss_salarie - iuts
    return {
        "brut": brut,
        "cnss_salarie": cnss_salarie,
        "iuts": iuts,
        "net": net,
        "cnss_patronal": cnss_patronal,
        "cout_employeur": brut + cnss_patronal,
    }


DEFAULT_IUTS_BRACKETS = [
    {"ceil": 30000, "rate": 0.0},
    {"ceil": 50000, "rate": 12.1},
    {"ceil": 80000, "rate": 13.9},
    {"ceil": 120000, "rate": 15.7},
    {"ceil": 170000, "rate": 18.4},
    {"ceil": 250000, "rate": 21.7},
    {"ceil": None, "rate": 25.0},
]
