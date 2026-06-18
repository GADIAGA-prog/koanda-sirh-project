/* ------------------------------------------------------------------ */
/*  Client API — SIRH Koanda Group                                     */
/*                                                                      */
/*  Base URL lue depuis VITE_API_URL. `apiMode` vaut true si une URL    */
/*  d'API est configurée ; sinon l'application fonctionne sur ses       */
/*  données de démonstration en mémoire (fallback, voir App.jsx).       */
/* ------------------------------------------------------------------ */
const API_URL = import.meta.env.VITE_API_URL;

/** true quand un back-end est configuré ; sinon l'app reste en mémoire. */
export const apiMode = Boolean(API_URL);

const TOKEN_KEY = "token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/* ------------------------------------------------------------------ */
/*  apiCall : requête générique avec en-tête Authorization automatique  */
/* ------------------------------------------------------------------ */
export async function apiCall(path, options = {}) {
  const { method = "GET", body, form, params, auth = true } = options;
  if (!API_URL) throw new Error("VITE_API_URL n'est pas défini");

  let url = `${API_URL}${path}`;
  if (params) {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") usp.set(k, v);
    });
    const qs = usp.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = {};
  if (auth) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let payload;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    payload = new URLSearchParams(form).toString();
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(url, { method, headers, body: payload });

  if (!res.ok) {
    if (res.status === 401) logout();
    let detail;
    try {
      detail = (await res.json()).detail;
    } catch {
      detail = res.statusText;
    }
    if (Array.isArray(detail)) detail = detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
    throw new Error(detail || `Erreur ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  Adaptateurs : snake_case (API) <-> camelCase (UI)                   */
/* ------------------------------------------------------------------ */
function mapUser(u) {
  const isDRH = u.role === "DRH";
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    roleCode: u.role,
    filialeId: u.filiale_id,
    role: isDRH ? "Directrice RH Groupe" : "Responsable RH de filiale",
    scope: isDRH ? "ALL" : u.filiale_id,
  };
}

function mapFiliale(f) {
  return {
    id: f.id, nom: f.nom, court: f.court, secteur: f.secteur,
    ville: f.ville, color: f.color, rh: f.rh_nom,
  };
}

function mapStats(s) {
  return {
    filialeId: s.filiale_id, nom: s.nom, effectif: s.effectif,
    masseSalariale: s.masse_salariale, congesEnAttente: s.conges_en_attente,
  };
}

function mapEmployee(e) {
  return {
    id: e.id,
    matricule: e.matricule,
    prenom: e.prenom,
    nom: e.nom,
    genre: e.genre,
    filialeId: e.filiale_id,
    poste: e.poste,
    departement: e.departement,
    niveau: e.niveau,
    typeContrat: e.type_contrat,
    salaire: e.salaire,
    dateEmbauche: e.date_embauche ? new Date(e.date_embauche) : null,
    cddFin: e.cdd_fin ? new Date(e.cdd_fin) : null,
    statut: e.statut,
    soldeConges: e.solde_conges,
    email: e.email || "",
    tel: e.tel || "",
  };
}

function unmapEmployee(d) {
  return {
    prenom: d.prenom,
    nom: d.nom,
    genre: d.genre,
    poste: d.poste,
    departement: d.departement,
    niveau: d.niveau,
    type_contrat: d.typeContrat,
    salaire: d.salaire,
    email: d.email || null,
    tel: d.tel || null,
    filiale_id: d.filialeId || null,
    date_embauche: d.dateEmbauche || null,
    cdd_fin: d.cddFin || null,
    solde_conges: d.soldeConges ?? 0,
  };
}

function mapLeave(l) {
  return {
    id: l.id,
    empId: l.employee_id,
    filialeId: l.filiale_id,
    type: l.type,
    debut: new Date(l.debut),
    fin: new Date(l.fin),
    jours: l.jours,
    statut: l.statut,
    employeNom: l.employe_nom || null,
  };
}

function mapPayroll(c) {
  return {
    cnssRate: c.cnss_rate,
    cnssCeiling: c.cnss_ceiling,
    cnssPatronal: c.cnss_patronal,
    iuts: (c.iuts_brackets || []).map((b) => ({ ceil: b.ceil ?? null, rate: b.rate })),
  };
}
function unmapPayroll(p) {
  return {
    cnss_rate: Number(p.cnssRate),
    cnss_ceiling: Number(p.cnssCeiling),
    cnss_patronal: Number(p.cnssPatronal),
    iuts_brackets: (p.iuts || []).map((b) => ({
      ceil: b.ceil === "" || b.ceil == null ? null : Number(b.ceil),
      rate: Number(b.rate),
    })),
  };
}

function mapPayslip(s) {
  return {
    brut: s.brut,
    cnssSalarie: s.cnss_salarie,
    iuts: s.iuts,
    net: s.net,
    cnssPatronal: s.cnss_patronal,
    coutEmployeur: s.cout_employeur,
  };
}

/* ------------------------------------------------------------------ */
/*  Authentification                                                    */
/* ------------------------------------------------------------------ */
/** Login JWT (OAuth2 password flow). Stocke le token et renvoie l'utilisateur. */
export async function login(email, password) {
  const data = await apiCall("/auth/login", {
    method: "POST",
    auth: false,
    form: { username: email, password },
  });
  setToken(data.access_token);
  return getMe();
}

/** Efface le token (déconnexion). */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

/** Profil de l'utilisateur courant. */
export async function getMe() {
  return mapUser(await apiCall("/auth/me"));
}

/* ------------------------------------------------------------------ */
/*  Filiales                                                            */
/* ------------------------------------------------------------------ */
export async function getFiliales() {
  return (await apiCall("/filiales")).map(mapFiliale);
}

export async function getFilialesStats() {
  return (await apiCall("/filiales/stats")).map(mapStats);
}

/* ------------------------------------------------------------------ */
/*  Collaborateurs                                                      */
/* ------------------------------------------------------------------ */
/** Liste paginée. Renvoie { items, total, page, perPage }. */
export async function getEmployees(params = {}) {
  const data = await apiCall("/employees", {
    params: {
      filiale_id: params.filialeId,
      q: params.q,
      type_contrat: params.typeContrat,
      page: params.page,
      per_page: params.perPage,
    },
  });
  return {
    items: data.items.map(mapEmployee),
    total: data.total,
    page: data.page,
    perPage: data.per_page,
  };
}

export async function createEmployee(data) {
  return mapEmployee(await apiCall("/employees", { method: "POST", body: unmapEmployee(data) }));
}

export async function getPayslip(empId) {
  return mapPayslip(await apiCall(`/employees/${empId}/payslip`));
}

/* ------------------------------------------------------------------ */
/*  Congés                                                              */
/* ------------------------------------------------------------------ */
export async function getLeaves(params = {}) {
  const data = await apiCall("/leaves", {
    params: { filiale_id: params.filialeId, statut: params.statut },
  });
  return data.map(mapLeave);
}

export async function decideLeave(id, decision) {
  return mapLeave(await apiCall(`/leaves/${id}`, { method: "PATCH", body: { decision } }));
}

/* ------------------------------------------------------------------ */
/*  Barème de paie                                                      */
/* ------------------------------------------------------------------ */
export async function getPayrollConfig() {
  return mapPayroll(await apiCall("/payroll/config"));
}

export async function updatePayrollConfig(data) {
  return mapPayroll(await apiCall("/payroll/config", { method: "PUT", body: unmapPayroll(data) }));
}

export async function resetPayrollConfig() {
  return mapPayroll(await apiCall("/payroll/config/reset", { method: "POST" }));
}

export async function previewPayslip(brut) {
  return mapPayslip(await apiCall("/payroll/preview", { params: { brut } }));
}

/* ------------------------------------------------------------------ */
/*  Administration                                                      */
/* ------------------------------------------------------------------ */
export async function clearDatabase() {
  return apiCall("/admin/clear", { method: "POST" });
}

export async function seedDemo() {
  return apiCall("/admin/seed-demo", { method: "POST" });
}

export async function getAuditLog() {
  return apiCall("/admin/audit");
}
