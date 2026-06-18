"""Dépendances FastAPI : authentification et contrôle d'accès par périmètre.

C'est ici qu'est appliquée la règle métier centrale :
- un Responsable RH de filiale ne voit QUE les données de sa filiale ;
- le DRH (filiale_id = NULL) accède à tout, avec un filtre optionnel par filiale.
La restriction est appliquée côté requête SQL — pas seulement masquée dans l'UI.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import User, Role
from .security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Jeton invalide ou expiré")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")
    return user


def require_drh(user: User = Depends(get_current_user)) -> User:
    if user.role != Role.DRH:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Action réservée à la Direction RH Groupe")
    return user


def resolve_scope(user: User, requested_filiale: str | None) -> str | None:
    """Renvoie l'identifiant de filiale à appliquer comme filtre, ou None pour 'tout le groupe'.

    - DRH : peut demander une filiale précise (?filiale_id=) ou rien (groupe entier).
    - RH de filiale : toujours forcé à sa filiale, toute autre demande est refusée.
    """
    if user.role == Role.DRH:
        return requested_filiale  # None => tout le groupe
    # RH de filiale (et autres rôles non-DRH)
    if requested_filiale and requested_filiale != user.filiale_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Accès hors de votre périmètre de filiale")
    return user.filiale_id


def assert_can_access_filiale(user: User, filiale_id: str):
    """Garde-fou pour les accès à une ressource précise (employé, congé…)."""
    if user.role != Role.DRH and user.filiale_id != filiale_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Ressource hors de votre périmètre de filiale")
