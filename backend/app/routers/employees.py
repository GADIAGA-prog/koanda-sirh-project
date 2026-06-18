"""Collaborateurs : liste paginée/filtrée, création, fiche et bulletin de paie.

Toutes les routes appliquent le périmètre du demandeur via resolve_scope / assert_can_access_filiale.
"""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import Employee, Filiale, PayrollConfig, User, Role, AuditLog
from ..schemas import EmployeeOut, EmployeeList, EmployeeCreate, PayslipOut
from ..deps import get_current_user, resolve_scope, assert_can_access_filiale
from ..security import compute_payslip

router = APIRouter(prefix="/employees", tags=["Collaborateurs"])


@router.get("", response_model=EmployeeList)
def list_employees(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    filiale_id: str | None = Query(None, description="DRH uniquement : filtrer sur une filiale"),
    q: str | None = Query(None, description="Recherche nom / poste / matricule"),
    type_contrat: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    scope = resolve_scope(user, filiale_id)
    query = db.query(Employee)
    if scope is not None:
        query = query.filter(Employee.filiale_id == scope)
    if type_contrat:
        query = query.filter(Employee.type_contrat == type_contrat)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Employee.prenom.ilike(like), Employee.nom.ilike(like),
                                 Employee.poste.ilike(like), Employee.matricule.ilike(like)))
    total = query.count()
    items = query.order_by(Employee.nom).offset((page - 1) * per_page).limit(per_page).all()
    return EmployeeList(total=total, page=page, per_page=per_page, items=items)


@router.post("", response_model=EmployeeOut, status_code=201)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db),
                    user: User = Depends(get_current_user)):
    # Détermine la filiale cible et vérifie le périmètre
    target = payload.filiale_id if user.role == Role.DRH else user.filiale_id
    if not target:
        raise HTTPException(400, "filiale_id requis")
    assert_can_access_filiale(user, target)
    f = db.query(Filiale).get(target)
    if not f:
        raise HTTPException(404, "Filiale introuvable")

    seq = (db.query(Employee).count() + 1)
    emp = Employee(
        matricule=f"{f.court.upper()}-{date.today().strftime('%y')}-{seq:04d}",
        prenom=payload.prenom, nom=payload.nom, genre=payload.genre, filiale_id=target,
        poste=payload.poste, departement=payload.departement, niveau=payload.niveau,
        type_contrat=payload.type_contrat, salaire=payload.salaire,
        date_embauche=payload.date_embauche or date.today(), cdd_fin=payload.cdd_fin,
        statut="Actif", solde_conges=payload.solde_conges, email=payload.email, tel=payload.tel,
    )
    db.add(emp)
    db.add(AuditLog(user_email=user.email, action="create_employee", filiale_id=target,
                    detail=f"{payload.prenom} {payload.nom} — {payload.poste}"))
    db.commit()
    db.refresh(emp)
    return emp


@router.get("/{emp_id}", response_model=EmployeeOut)
def get_employee(emp_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    emp = db.query(Employee).get(emp_id)
    if not emp:
        raise HTTPException(404, "Collaborateur introuvable")
    assert_can_access_filiale(user, emp.filiale_id)
    return emp


@router.get("/{emp_id}/payslip", response_model=PayslipOut)
def payslip(emp_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    emp = db.query(Employee).get(emp_id)
    if not emp:
        raise HTTPException(404, "Collaborateur introuvable")
    assert_can_access_filiale(user, emp.filiale_id)
    cfg = db.query(PayrollConfig).get(1)
    return compute_payslip(emp.salaire, cfg)
