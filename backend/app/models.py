"""Modèle de données du SIRH Koanda Group.

Hiérarchie : Groupe > Filiale > Collaborateur.
Le périmètre d'accès est porté par User.filiale_id (NULL = accès groupe / DRH).
"""
import enum
from datetime import datetime, date

from sqlalchemy import (
    Column, String, Integer, Float, Date, DateTime, ForeignKey, Enum, JSON, Text,
)
from sqlalchemy.orm import relationship

from .database import Base


class Role(str, enum.Enum):
    DRH = "DRH"                 # Directeur RH Groupe — accès à toutes les filiales
    RH_FILIALE = "RH_FILIALE"  # Responsable RH — limité à sa filiale
    MANAGER = "MANAGER"
    EMPLOYE = "EMPLOYE"


class Filiale(Base):
    __tablename__ = "filiales"
    id = Column(String, primary_key=True)        # ex. "gcm"
    nom = Column(String, nullable=False)
    court = Column(String, nullable=False)
    secteur = Column(String, nullable=False)
    ville = Column(String, nullable=False)
    color = Column(String, nullable=False)
    rh_nom = Column(String, nullable=False)

    employees = relationship("Employee", back_populates="filiale", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False)
    filiale_id = Column(String, ForeignKey("filiales.id"), nullable=True)  # NULL pour le DRH


class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, autoincrement=True)
    matricule = Column(String, unique=True, index=True, nullable=False)
    prenom = Column(String, nullable=False)
    nom = Column(String, nullable=False)
    genre = Column(String, nullable=False)               # "H" / "F"
    filiale_id = Column(String, ForeignKey("filiales.id"), nullable=False, index=True)
    poste = Column(String, nullable=False)
    departement = Column(String, nullable=False)
    niveau = Column(Integer, nullable=False, default=2)
    type_contrat = Column(String, nullable=False)        # CDI / CDD / Journalier / Stage
    salaire = Column(Integer, nullable=False)            # brut mensuel en FCFA
    date_embauche = Column(Date, nullable=False)
    cdd_fin = Column(Date, nullable=True)
    statut = Column(String, nullable=False, default="Actif")
    solde_conges = Column(Float, nullable=False, default=0)
    email = Column(String, nullable=True)
    tel = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    filiale = relationship("Filiale", back_populates="employees")
    leaves = relationship("Leave", back_populates="employee", cascade="all, delete-orphan")


class Leave(Base):
    __tablename__ = "leaves"
    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    filiale_id = Column(String, ForeignKey("filiales.id"), nullable=False, index=True)
    type = Column(String, nullable=False)
    debut = Column(Date, nullable=False)
    fin = Column(Date, nullable=False)
    jours = Column(Integer, nullable=False)
    statut = Column(String, nullable=False, default="En attente")  # En attente / Approuvé / Refusé
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="leaves")


class PayrollConfig(Base):
    """Barème de paie modifiable (singleton, id=1)."""
    __tablename__ = "payroll_config"
    id = Column(Integer, primary_key=True, default=1)
    cnss_rate = Column(Float, nullable=False, default=5.5)         # cotisation salariale %
    cnss_ceiling = Column(Integer, nullable=False, default=600000)  # plafond FCFA
    cnss_patronal = Column(Float, nullable=False, default=16.0)    # charge patronale %
    # Tranches IUTS : [{"ceil": 30000|null, "rate": 0.0}, ...]
    iuts_brackets = Column(JSON, nullable=False, default=list)


class AuditLog(Base):
    """Journal d'audit : qui a fait quoi, quand, sur quelle filiale."""
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String, nullable=False)
    action = Column(String, nullable=False)
    filiale_id = Column(String, nullable=True)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
