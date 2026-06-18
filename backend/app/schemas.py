"""Schémas Pydantic (validation entrée/sortie de l'API)."""
from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr


# ---------- Auth ----------
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    filiale_id: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Filiale ----------
class FilialeOut(BaseModel):
    id: str
    nom: str
    court: str
    secteur: str
    ville: str
    color: str
    rh_nom: str

    class Config:
        from_attributes = True


class FilialeStats(BaseModel):
    filiale_id: str
    nom: str
    effectif: int
    masse_salariale: int
    conges_en_attente: int


# ---------- Employee ----------
class EmployeeBase(BaseModel):
    prenom: str
    nom: str
    genre: str = "H"
    poste: str
    departement: str
    niveau: int = 2
    type_contrat: str = "CDI"
    salaire: int
    email: Optional[str] = None
    tel: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    filiale_id: Optional[str] = None  # ignoré pour un RH de filiale (forcé à sa filiale)
    date_embauche: Optional[date] = None
    cdd_fin: Optional[date] = None
    solde_conges: float = 0


class EmployeeOut(EmployeeBase):
    id: int
    matricule: str
    filiale_id: str
    date_embauche: date
    cdd_fin: Optional[date] = None
    statut: str
    solde_conges: float
    created_at: datetime

    class Config:
        from_attributes = True


class EmployeeList(BaseModel):
    total: int
    page: int
    per_page: int
    items: List[EmployeeOut]


# ---------- Leave ----------
class LeaveOut(BaseModel):
    id: int
    employee_id: int
    filiale_id: str
    type: str
    debut: date
    fin: date
    jours: int
    statut: str
    employe_nom: Optional[str] = None

    class Config:
        from_attributes = True


class LeaveDecision(BaseModel):
    decision: str  # "Approuvé" | "Refusé"


# ---------- Payroll ----------
class IutsBracket(BaseModel):
    ceil: Optional[int] = None  # null = tranche supérieure
    rate: float


class PayrollConfigIn(BaseModel):
    cnss_rate: float
    cnss_ceiling: int
    cnss_patronal: float
    iuts_brackets: List[IutsBracket]


class PayrollConfigOut(PayrollConfigIn):
    class Config:
        from_attributes = True


class PayslipOut(BaseModel):
    brut: int
    cnss_salarie: int
    iuts: int
    net: int
    cnss_patronal: int
    cout_employeur: int
