"""Test d'intégration : exécuter avec `python test_api.py` (serveur non requis)."""
from fastapi.testclient import TestClient
from app.main import app


def run():
    with TestClient(app) as c:  # le 'with' déclenche le lifespan (création des tables + seed)
        def login(email):
            r = c.post("/auth/login", data={"username": email, "password": "koanda2026"})
            assert r.status_code == 200, r.text
            return {"Authorization": f"Bearer {r.json()['access_token']}"}

        drh = login("drh@koanda-group.bf")
        rh_gcm = login("rh.gcm@koanda-group.bf")

        # Périmètre : RH limité à sa filiale, DRH voit tout
        assert {e["filiale_id"] for e in c.get("/employees?per_page=100", headers=rh_gcm).json()["items"]} == {"gcm"}
        assert c.get("/employees?filiale_id=faso", headers=rh_gcm).status_code == 403
        assert c.get("/employees?per_page=1", headers=drh).json()["total"] > 1000

        # Paie modifiable (DRH only)
        assert c.put("/payroll/config", headers=rh_gcm, json=c.get("/payroll/config", headers=drh).json()).status_code == 403

        # Admin réservé au DRH
        assert c.post("/admin/clear", headers=rh_gcm).status_code == 403
        print("✅ Contrôles de périmètre, paie et administration OK")


if __name__ == "__main__":
    run()
