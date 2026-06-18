"""Administration (DRH) : vidage de la base, régénération démo, journal d'audit."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Employee, Leave, AuditLog, User
from ..deps import require_drh
from ..seed import seed_demo_data

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.post("/clear")
def clear_database(db: Session = Depends(get_db), user: User = Depends(require_drh)):
    """Vide la base : supprime tous les collaborateurs et toutes les demandes de congé.

    Les filiales, comptes utilisateurs et le barème de paie sont conservés.
    """
    n_leaves = db.query(Leave).delete()
    n_emps = db.query(Employee).delete()
    db.add(AuditLog(user_email=user.email, action="clear_database",
                    detail=f"{n_emps} collaborateurs et {n_leaves} demandes supprimés"))
    db.commit()
    return {"deleted_employees": n_emps, "deleted_leaves": n_leaves, "status": "Base vidée"}


@router.post("/seed-demo")
def seed_demo(db: Session = Depends(get_db), user: User = Depends(require_drh)):
    """Régénère un jeu de données de démonstration (après un vidage par exemple)."""
    db.query(Leave).delete()
    db.query(Employee).delete()
    db.commit()
    n_emps, n_leaves = seed_demo_data(db, employees_only=True)
    db.add(AuditLog(user_email=user.email, action="seed_demo",
                    detail=f"{n_emps} collaborateurs et {n_leaves} demandes générés"))
    db.commit()
    return {"created_employees": n_emps, "created_leaves": n_leaves, "status": "Données régénérées"}


@router.get("/audit")
def audit_log(db: Session = Depends(get_db), user: User = Depends(require_drh), limit: int = 100):
    """Journal d'audit (qui a fait quoi, quand, sur quelle filiale)."""
    rows = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [{"date": r.created_at, "utilisateur": r.user_email, "action": r.action,
             "filiale": r.filiale_id, "detail": r.detail} for r in rows]
