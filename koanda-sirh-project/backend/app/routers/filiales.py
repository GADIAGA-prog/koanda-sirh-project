"""Filiales : structure du groupe et statistiques consolidées (vue DRH)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Filiale, Employee, Leave, User, Role
from ..schemas import FilialeOut, FilialeStats
from ..deps import get_current_user

router = APIRouter(prefix="/filiales", tags=["Filiales"])


@router.get("", response_model=list[FilialeOut])
def list_filiales(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Liste des filiales (structure de l'organisation, visible par tous les profils RH)."""
    return db.query(Filiale).order_by(Filiale.nom).all()


@router.get("/stats", response_model=list[FilialeStats])
def filiales_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Comparatif des filiales. Le DRH voit toutes les filiales ; un RH ne voit que la sienne."""
    q = db.query(Filiale)
    if user.role != Role.DRH:
        q = q.filter(Filiale.id == user.filiale_id)

    out = []
    for f in q.all():
        effectif = db.query(func.count(Employee.id)).filter(Employee.filiale_id == f.id).scalar() or 0
        masse = db.query(func.coalesce(func.sum(Employee.salaire), 0)).filter(Employee.filiale_id == f.id).scalar() or 0
        attente = db.query(func.count(Leave.id)).filter(
            Leave.filiale_id == f.id, Leave.statut == "En attente").scalar() or 0
        out.append(FilialeStats(filiale_id=f.id, nom=f.nom, effectif=effectif,
                                masse_salariale=int(masse), conges_en_attente=attente))
    return out
