"""Initialisation des données : filiales, comptes RH/DRH, barème de paie, effectif de démo."""
import random
from datetime import date, timedelta

from sqlalchemy.orm import Session

from .models import Filiale, User, Role, Employee, Leave, PayrollConfig
from .security import hash_password, DEFAULT_IUTS_BRACKETS
from .config import settings

TODAY = date(2026, 6, 17)

FILIALES = [
    ("gcm", "GCM Industries", "GCM", "Ciment & matériaux", "Kossodo, Ouagadougou", "#5B6B7A", "Salif Ouédraogo", 480),
    ("faso", "Faso Energy", "Faso", "Énergie solaire", "Kossodo, Ouagadougou", "#D9A41A", "Aïcha Sawadogo", 220),
    ("amko", "AMKO Trading", "AMKO", "Hydrocarbures — négoce", "Ouagadougou / Genève", "#1E5FA8", "Idrissa Compaoré", 70),
    ("eco", "Eco-Oil", "Eco", "Distribution pétrolière", "Ouagadougou", "#0E8079", "Mariam Traoré", 430),
    ("ecofood", "Eco Food", "Food", "Agroalimentaire & distribution", "Ouagadougou", "#6FA02C", "Safiatou Barry", 260),
    ("gcmimmo", "GCM Immobilier", "Immo", "Immobilier & promotion", "Ouagadougou", "#A6743C", "Hamidou Kientega", 120),
]

PRENOMS_H = ["Boukary", "Issa", "Adama", "Salif", "Hamidou", "Ousmane", "Moussa", "Abdoulaye", "Idrissa", "Seydou", "Yacouba", "Karim", "Drissa", "Boureima", "Inoussa", "Aboubacar", "Zakaria"]
PRENOMS_F = ["Aminata", "Fatimata", "Mariam", "Awa", "Salimata", "Rokia", "Kadiatou", "Bintou", "Safiatou", "Aïcha", "Ramata", "Djénéba", "Assétou", "Henriette", "Edwige", "Cécile"]
NOMS = ["Koanda", "Ouédraogo", "Sawadogo", "Compaoré", "Traoré", "Zongo", "Kaboré", "Nikiéma", "Tapsoba", "Ilboudo", "Kafando", "Yaméogo", "Barry", "Sanou", "Coulibaly", "Kientega", "Nana", "Zoungrana", "Ouattara"]

POSTES = {
    "gcm": [("Manœuvre", "Production", 1, 6), ("Opérateur de four", "Production", 2, 5), ("Agent de maintenance", "Maintenance", 2, 4), ("Contrôleur qualité", "Qualité", 2, 3), ("Chef d'équipe production", "Production", 3, 2), ("Ingénieur procédés", "Technique", 4, 1), ("Comptable", "Finance", 3, 1)],
    "faso": [("Opérateur d'assemblage", "Production", 1, 6), ("Technicien photovoltaïque", "Technique", 2, 5), ("Technicien SAV", "Technique", 2, 3), ("Commercial solaire", "Commercial", 2, 3), ("Ingénieur R&D", "Technique", 4, 1), ("Comptable", "Finance", 3, 1)],
    "amko": [("Assistant commercial", "Commercial", 2, 4), ("Gestionnaire de contrats", "Commercial", 3, 2), ("Trader produits pétroliers", "Commercial", 4, 2), ("Comptable", "Finance", 3, 2), ("Juriste", "Juridique", 4, 1)],
    "eco": [("Pompiste", "Exploitation", 1, 7), ("Gérant de station", "Exploitation", 3, 3), ("Chauffeur-livreur citerne", "Logistique", 2, 4), ("Agent de sécurité", "Sécurité", 1, 3), ("Comptable", "Finance", 2, 2)],
    "ecofood": [("Agent de conditionnement", "Production", 1, 6), ("Préparateur de commandes", "Logistique", 1, 5), ("Chauffeur-livreur", "Logistique", 2, 4), ("Commercial agroalimentaire", "Commercial", 2, 4), ("Chef de dépôt", "Logistique", 3, 2), ("Comptable", "Finance", 3, 1)],
    "gcmimmo": [("Négociateur immobilier", "Commercial", 2, 5), ("Chargé de location", "Commercial", 2, 4), ("Gestionnaire de biens", "Gestion", 3, 3), ("Conducteur de travaux", "Technique", 4, 2), ("Architecte", "Technique", 4, 1), ("Comptable", "Finance", 3, 1)],
}
SAL = {1: (75000, 150000), 2: (150000, 330000), 3: (330000, 620000), 4: (650000, 1300000), 5: (1700000, 3000000)}
CONTRATS = {"gcm": [70, 18, 5, 7], "faso": [60, 22, 3, 15], "amko": [80, 10, 0, 10], "eco": [68, 20, 5, 7], "ecofood": [58, 28, 6, 8], "gcmimmo": [74, 16, 0, 10]}
CT = ["CDI", "CDD", "Journalier", "Stage"]
LEAVE_TYPES = ["Congé annuel"] * 50 + ["Maladie"] * 25 + ["Événement familial"] * 10 + ["Maternité"] * 8 + ["Sans solde"] * 7


def seed_reference(db: Session):
    """Filiales, comptes utilisateurs et barème de paie (idempotent)."""
    if db.query(Filiale).count() == 0:
        for fid, nom, court, sect, ville, color, rh, _ in FILIALES:
            db.add(Filiale(id=fid, nom=nom, court=court, secteur=sect, ville=ville, color=color, rh_nom=rh))
        db.commit()

    if db.query(User).count() == 0:
        pwd = hash_password(settings.DEMO_PASSWORD)
        db.add(User(name="Aminata Koanda", email="drh@koanda-group.bf", hashed_password=pwd, role=Role.DRH, filiale_id=None))
        for fid, _, _, _, _, _, rh, _ in FILIALES:
            db.add(User(name=rh, email=f"rh.{fid}@koanda-group.bf", hashed_password=pwd, role=Role.RH_FILIALE, filiale_id=fid))
        db.commit()

    if db.query(PayrollConfig).count() == 0:
        db.add(PayrollConfig(id=1, cnss_rate=5.5, cnss_ceiling=600000, cnss_patronal=16.0, iuts_brackets=DEFAULT_IUTS_BRACKETS))
        db.commit()


def seed_demo_data(db: Session, employees_only: bool = False):
    """Génère un effectif réaliste + des demandes de congé. Renvoie (n_emps, n_leaves)."""
    if not employees_only:
        seed_reference(db)

    rng = random.Random(73219)
    emps = []
    seq = 100
    for fid, nom, court, _, _, _, rh, head in FILIALES:
        # RH responsable + directeur de filiale
        for full, poste, dept, niv in [(rh, "Responsable RH", "Ressources Humaines", 4),
                                        (f"{rng.choice(PRENOMS_H)} {rng.choice(NOMS)}", "Directeur de filiale", "Direction", 5)]:
            seq += 1
            emps.append(_mk(rng, fid, court, full.split()[0], " ".join(full.split()[1:]) or rng.choice(NOMS), poste, dept, niv, "CDI", seq))
        # pool pondéré
        pool = []
        for p, d, n, w in POSTES[fid]:
            pool += [(p, d, n)] * w
        ctw = CONTRATS[fid]
        existing = sum(1 for e in emps if e.filiale_id == fid)
        for _ in range(head - existing):
            poste, dept, niv = rng.choice(pool)
            female = rng.random() < (0.6 if dept in ("Ressources Humaines",) else 0.2)
            pr = rng.choice(PRENOMS_F if female else PRENOMS_H)
            contrat = rng.choices(CT, weights=ctw)[0]
            seq += 1
            emps.append(_mk(rng, fid, court, pr, rng.choice(NOMS), poste, dept, niv, contrat, seq))
    db.bulk_save_objects(emps)
    db.commit()

    # Congés
    ids = [e.id for e in db.query(Employee.id, Employee.filiale_id).all()]
    rows = db.query(Employee).all()
    leaves = []
    for _ in range(240):
        e = rng.choice(rows)
        t = rng.choice(LEAVE_TYPES)
        start = TODAY + timedelta(days=rng.randint(-30, 50))
        dur = 98 if t == "Maternité" else rng.randint(1, 14)
        sr = rng.random()
        statut = "En attente" if sr < 0.32 else ("Approuvé" if sr < 0.86 else "Refusé")
        leaves.append(Leave(employee_id=e.id, filiale_id=e.filiale_id, type=t,
                            debut=start, fin=start + timedelta(days=dur), jours=dur, statut=statut))
    db.bulk_save_objects(leaves)
    db.commit()
    return len(emps), len(leaves)


def _mk(rng, fid, court, pr, nm, poste, dept, niv, contrat, seq):
    smin, smax = SAL[niv]
    salaire = round(rng.randint(smin, smax) / 5000) * 5000
    embauche = date(rng.randint(2014, 2025), rng.randint(1, 12), rng.randint(1, 28))
    cdd = None
    if contrat != "CDI":
        cdd = TODAY + timedelta(days=rng.randint(-25, 330))
    sr = rng.random()
    statut = "Suspendu" if sr > 0.95 else ("En congé" if sr > 0.9 else "Actif")
    slug = lambda s: "".join(c for c in s.lower() if c.isalpha())
    return Employee(
        matricule=f"{court.upper()}-{str(embauche.year)[2:]}-{seq:04d}", prenom=pr, nom=nm,
        genre="F" if pr in PRENOMS_F else "H", filiale_id=fid, poste=poste, departement=dept,
        niveau=niv, type_contrat=contrat, salaire=salaire, date_embauche=embauche, cdd_fin=cdd,
        statut=statut, solde_conges=rng.randint(0, 30), email=f"{slug(pr)}.{slug(nm)}@koanda-group.bf",
        tel=f"+226 {rng.randint(50,79)} {rng.randint(10,99)} {rng.randint(10,99)} {rng.randint(10,99)}",
    )
