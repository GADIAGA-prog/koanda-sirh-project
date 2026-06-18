"""Congés & absences : liste filtrée par périmètre et workflow de validation."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Leave, Employee, User, AuditLog
from ..schemas import LeaveOut, LeaveDecision
from ..deps import get_current_user, resolve_scope, assert_can_access_filiale

router = APIRouter(prefix="/leaves", tags=["Congés"])


@router.get("", response_model=list[LeaveOut])
def list_leaves(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    filiale_id: str | None = Query(None),
    statut: str | None = Query(None, description="En attente / Approuvé / Refusé"),
):
    scope = resolve_scope(user, filiale_id)
    query = db.query(Leave)
    if scope is not None:
        query = query.filter(Leave.filiale_id == scope)
    if statut:
        query = query.filter(Leave.statut == statut)
    rows = query.order_by(Leave.debut).limit(500).all()
    out = []
    for l in rows:
        emp = l.employee
        out.append(LeaveOut(id=l.id, employee_id=l.employee_id, filiale_id=l.filiale_id,
                            type=l.type, debut=l.debut, fin=l.fin, jours=l.jours, statut=l.statut,
                            employe_nom=f"{emp.prenom} {emp.nom}" if emp else None))
    return out


@router.patch("/{leave_id}", response_model=LeaveOut)
def decide_leave(leave_id: int, decision: LeaveDecision, db: Session = Depends(get_db),
                 user: User = Depends(get_current_user)):
    if decision.decision not in ("Approuvé", "Refusé"):
        raise HTTPException(400, "Décision invalide")
    l = db.query(Leave).get(leave_id)
    if not l:
        raise HTTPException(404, "Demande introuvable")
    assert_can_access_filiale(user, l.filiale_id)
    if l.statut != "En attente":
        raise HTTPException(409, "Cette demande a déjà été traitée")

    l.statut = decision.decision
    # Décrémente le solde de congés si congé annuel approuvé
    if decision.decision == "Approuvé" and l.type == "Congé annuel":
        emp = l.employee
        emp.solde_conges = max(0, emp.solde_conges - l.jours)
    db.add(AuditLog(user_email=user.email, action="decide_leave", filiale_id=l.filiale_id,
                    detail=f"Demande #{l.id} -> {decision.decision}"))
    db.commit()
    db.refresh(l)
    emp = l.employee
    return LeaveOut(id=l.id, employee_id=l.employee_id, filiale_id=l.filiale_id, type=l.type,
                    debut=l.debut, fin=l.fin, jours=l.jours, statut=l.statut,
                    employe_nom=f"{emp.prenom} {emp.nom}" if emp else None)
