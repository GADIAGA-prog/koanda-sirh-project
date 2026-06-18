"""Barème de paie : consultation, modification (DRH) et simulation."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import PayrollConfig, User, AuditLog
from ..schemas import PayrollConfigIn, PayrollConfigOut, PayslipOut
from ..deps import get_current_user, require_drh
from ..security import compute_payslip, DEFAULT_IUTS_BRACKETS

router = APIRouter(prefix="/payroll", tags=["Paie"])


def _get_cfg(db: Session) -> PayrollConfig:
    cfg = db.query(PayrollConfig).get(1)
    if not cfg:
        raise HTTPException(500, "Barème de paie non initialisé")
    return cfg


@router.get("/config", response_model=PayrollConfigOut)
def get_config(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _get_cfg(db)


@router.put("/config", response_model=PayrollConfigOut)
def update_config(payload: PayrollConfigIn, db: Session = Depends(get_db),
                  user: User = Depends(require_drh)):
    """Modifie librement le barème (taux CNSS, plafond, tranches IUTS). Réservé au DRH."""
    cfg = _get_cfg(db)
    cfg.cnss_rate = payload.cnss_rate
    cfg.cnss_ceiling = payload.cnss_ceiling
    cfg.cnss_patronal = payload.cnss_patronal
    cfg.iuts_brackets = [b.model_dump() for b in payload.iuts_brackets]
    db.add(AuditLog(user_email=user.email, action="update_payroll", detail="Barème de paie modifié"))
    db.commit()
    db.refresh(cfg)
    return cfg


@router.post("/config/reset", response_model=PayrollConfigOut)
def reset_config(db: Session = Depends(get_db), user: User = Depends(require_drh)):
    """Restaure le barème officiel par défaut (Burkina Faso)."""
    cfg = _get_cfg(db)
    cfg.cnss_rate = 5.5
    cfg.cnss_ceiling = 600000
    cfg.cnss_patronal = 16.0
    cfg.iuts_brackets = DEFAULT_IUTS_BRACKETS
    db.add(AuditLog(user_email=user.email, action="reset_payroll", detail="Barème réinitialisé"))
    db.commit()
    db.refresh(cfg)
    return cfg


@router.get("/preview", response_model=PayslipOut)
def preview(brut: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Simulateur : calcule un bulletin pour un brut donné avec le barème courant."""
    return compute_payslip(brut, _get_cfg(db))
