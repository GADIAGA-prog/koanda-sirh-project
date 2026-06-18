"""Point d'entrée de l'API — SIRH Koanda Group.

Lancement :  uvicorn app.main:app --reload
Docs interactives :  http://localhost:8000/docs
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine, SessionLocal
from .models import Employee
from .seed import seed_reference, seed_demo_data
from .routers import auth, filiales, employees, leaves, payroll, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_reference(db)  # filiales, comptes, barème (toujours)
        if db.query(Employee).count() == 0:
            seed_demo_data(db, employees_only=True)  # effectif de démo au premier démarrage
    finally:
        db.close()
    yield


app = FastAPI(
    title="SIRH Koanda Group",
    description="API de gestion des ressources humaines multi-filiales (DRH Groupe + RH de filiale).",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(filiales.router)
app.include_router(employees.router)
app.include_router(leaves.router)
app.include_router(payroll.router)
app.include_router(admin.router)


@app.get("/", tags=["Santé"])
def root():
    return {"service": "SIRH Koanda Group", "version": "1.0.0", "docs": "/docs"}
