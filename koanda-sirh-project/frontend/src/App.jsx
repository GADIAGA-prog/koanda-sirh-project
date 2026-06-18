import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import {
  LayoutDashboard, Users, CalendarDays, Building2, BarChart3, Briefcase,
  Search, Plus, Check, X, ChevronRight, Shield, LogOut, Lock, MapPin,
  TrendingUp, TrendingDown, AlertTriangle, Wallet, Menu, ArrowUpDown,
  CircleUserRound, ChevronDown, Settings, Trash2, RefreshCw, Database, SlidersHorizontal,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Identité visuelle                                                  */
/* ------------------------------------------------------------------ */
const T = {
  ink: "#0B1F16",
  brandDeep: "#07120B",
  brand: "#0A3D2A",
  primary: "#0F6B49",
  primarySoft: "#E7F1EC",
  gold: "#C8932A",
  goldSoft: "#F7EEDA",
  bg: "#F5F6F2",
  surface: "#FFFFFF",
  line: "#E6E8E2",
  muted: "#6B7770",
  danger: "#B23A48",
  dangerSoft: "#F6E6E8",
};
const SANS = "'Inter', system-ui, -apple-system, sans-serif";
const DISPLAY = "'Space Grotesk', 'Inter', sans-serif";

/* ------------------------------------------------------------------ */
/*  Filiales                                                           */
/* ------------------------------------------------------------------ */
const FILIALES = [
  { id: "gcm",     nom: "GCM Industries", court: "GCM",  secteur: "Ciment & matériaux",             ville: "Kossodo, Ouagadougou", color: "#5B6B7A", rh: "Salif Ouédraogo",  head: 480, abs: 4.2, turn: 9 },
  { id: "faso",    nom: "Faso Energy",    court: "Faso", secteur: "Énergie solaire",                ville: "Kossodo, Ouagadougou", color: "#D9A41A", rh: "Aïcha Sawadogo",   head: 220, abs: 3.1, turn: 11 },
  { id: "amko",    nom: "AMKO Trading",   court: "AMKO", secteur: "Hydrocarbures — négoce",         ville: "Ouagadougou / Genève", color: "#1E5FA8", rh: "Idrissa Compaoré", head: 70,  abs: 2.4, turn: 7 },
  { id: "eco",     nom: "Eco-Oil",        court: "Eco",  secteur: "Distribution pétrolière",        ville: "Ouagadougou",          color: "#0E8079", rh: "Mariam Traoré",    head: 430, abs: 5.0, turn: 14 },
  { id: "ecofood", nom: "Eco Food",       court: "Food", secteur: "Agroalimentaire & distribution", ville: "Ouagadougou",          color: "#6FA02C", rh: "Safiatou Barry",   head: 260, abs: 4.6, turn: 13 },
  { id: "gcmimmo", nom: "GCM Immobilier", court: "Immo", secteur: "Immobilier & promotion",         ville: "Ouagadougou",          color: "#A6743C", rh: "Hamidou Kientega", head: 120, abs: 2.8, turn: 8 },
];
const FIL = Object.fromEntries(FILIALES.map((f) => [f.id, f]));

const USERS = [
  { id: "drh", name: "Aminata Koanda", role: "Directrice RH Groupe", scope: "ALL" },
  ...FILIALES.map((f) => ({ id: "rh-" + f.id, name: f.rh, role: "Responsable RH — " + f.nom, scope: f.id })),
];

/* ------------------------------------------------------------------ */
/*  Génération procédurale d'un effectif réaliste                      */
/* ------------------------------------------------------------------ */
const TODAY = new Date("2026-06-17");
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const PRENOMS_H = ["Boukary","Issa","Adama","Salif","Hamidou","Ousmane","Rasmané","Moussa","Abdoulaye","Idrissa","Souleymane","Seydou","Yacouba","Karim","Lassané","Drissa","Boureima","Mahamadou","Inoussa","Aboubacar","Sayouba","Zakaria","Noufou","Wendkuni"];
const PRENOMS_F = ["Aminata","Fatimata","Mariam","Awa","Salimata","Rokia","Habibou","Kadiatou","Bintou","Safiatou","Aïcha","Nafissatou","Ramata","Korotimi","Djénéba","Assétou","Balkissa","Zalissa","Henriette","Clarisse","Edwige","Cécile"];
const NOMS = ["Koanda","Ouédraogo","Sawadogo","Compaoré","Traoré","Zongo","Kaboré","Nikiéma","Sankara","Tapsoba","Sebgo","Bationo","Ilboudo","Congo","Kafando","Yaméogo","Barry","Diallo","Sanou","Coulibaly","Kientega","Nana","Zoungrana","Belem","Drabo","Ouattara","Bonkoungou","Sori"];

// [poste, departement, niveau, poids]
const POSTES = {
  gcm: [["Manœuvre","Production",1,6],["Opérateur de four","Production",2,5],["Cariste","Logistique",1,4],["Agent de maintenance","Maintenance",2,4],["Électromécanicien","Maintenance",2,3],["Contrôleur qualité","Qualité",2,3],["Chef d’équipe production","Production",3,2],["Magasinier","Logistique",2,2],["Ingénieur procédés","Technique",4,1],["Responsable HSE","HSE",4,1],["Comptable","Finance",3,1]],
  faso: [["Opérateur d’assemblage","Production",1,6],["Technicien photovoltaïque","Technique",2,5],["Technicien SAV","Technique",2,3],["Contrôleur qualité","Qualité",2,2],["Chef de ligne","Production",3,2],["Commercial solaire","Commercial",2,3],["Ingénieur R&D","Technique",4,1],["Magasinier","Logistique",1,2],["Comptable","Finance",3,1]],
  amko: [["Assistant commercial","Commercial",2,4],["Gestionnaire de contrats","Commercial",3,2],["Analyste logistique","Logistique",3,2],["Trader produits pétroliers","Commercial",4,2],["Responsable approvisionnement","Logistique",4,1],["Comptable","Finance",3,2],["Juriste","Juridique",4,1]],
  eco: [["Pompiste","Exploitation",1,7],["Gérant de station","Exploitation",3,3],["Chauffeur-livreur citerne","Logistique",2,4],["Agent de sécurité","Sécurité",1,3],["Responsable dépôt","Logistique",3,2],["Superviseur réseau","Exploitation",4,1],["Comptable","Finance",2,2]],
  ecofood: [["Agent de conditionnement","Production",1,6],["Préparateur de commandes","Logistique",1,5],["Chauffeur-livreur","Logistique",2,4],["Commercial agroalimentaire","Commercial",2,4],["Contrôleur qualité","Qualité",2,3],["Chef de dépôt","Logistique",3,2],["Responsable achats","Achats",4,1],["Comptable","Finance",3,1]],
  gcmimmo: [["Négociateur immobilier","Commercial",2,5],["Chargé de location","Commercial",2,4],["Gestionnaire de biens","Gestion",3,3],["Agent d’entretien","Maintenance",1,3],["Conducteur de travaux","Technique",4,2],["Architecte","Technique",4,1],["Juriste foncier","Juridique",4,1],["Comptable","Finance",3,1]],
};
const SAL = { 1: [75000, 150000], 2: [150000, 330000], 3: [330000, 620000], 4: [650000, 1300000], 5: [1700000, 3000000] };
const CONTRATS = { // CDI, CDD, Journalier, Stage
  gcm: [70, 18, 5, 7], faso: [60, 22, 3, 15], amko: [80, 10, 0, 10], eco: [68, 20, 5, 7],
  ecofood: [58, 28, 6, 8], gcmimmo: [74, 16, 0, 10],
};
const CT_LABEL = ["CDI", "CDD", "Journalier", "Stage"];
const DOMAINS = { gcm: "gcm.bf", faso: "fasoenergy.bf", amko: "amko-trading.com", eco: "eco-oil.bf", ecofood: "eco-food.bf", gcmimmo: "gcm-immobilier.bf" };

function buildWorkforce() {
  const rng = mulberry32(73219);
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const ri = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
  const emps = [];
  let seq = 100;

  const addNamed = (filId, name, poste, dept, niv) => {
    const [pr, ...rest] = name.split(" ");
    const nm = rest.join(" ");
    const female = PRENOMS_F.includes(pr);
    seq++;
    emps.push(mkEmp(filId, pr, nm, female, poste, dept, niv, "CDI", seq, rng, ri, slug));
  };

  FILIALES.forEach((f) => {
    addNamed(f.id, f.rh, "Responsable RH", "Ressources Humaines", 4);
    const dirF = rng() > 0.6;
    addNamed(f.id, (dirF ? pick(PRENOMS_F) : pick(PRENOMS_H)) + " " + pick(NOMS), "Directeur de filiale", "Direction", 5);

    // pool pondéré
    const pool = [];
    POSTES[f.id].forEach(([p, d, n, w]) => { for (let i = 0; i < w; i++) pool.push([p, d, n]); });
    const ctw = CONTRATS[f.id];
    const ctTotal = ctw.reduce((a, b) => a + b, 0);

    for (let i = emps.filter((e) => e.filialeId === f.id).length; i < f.head; i++) {
      const [poste, dept, niv] = pick(pool);
      const female = rng() < (["Hébergement", "Accueil", "Ressources Humaines"].includes(dept) ? 0.6 : 0.18);
      const pr = female ? pick(PRENOMS_F) : pick(PRENOMS_H);
      // type de contrat pondéré
      let r = rng() * ctTotal, ci = 0;
      for (let k = 0; k < ctw.length; k++) { r -= ctw[k]; if (r <= 0) { ci = k; break; } }
      seq++;
      emps.push(mkEmp(f.id, pr, pick(NOMS), female, poste, dept, niv, CT_LABEL[ci], seq, rng, ri, slug));
    }
  });
  return emps;
}
function mkEmp(filId, pr, nm, female, poste, dept, niv, contrat, seq, rng, ri, slug) {
  const [smin, smax] = SAL[niv];
  const salaire = Math.round(ri(smin, smax) / 5000) * 5000;
  const embauche = new Date(ri(2014, 2025), ri(0, 11), ri(1, 28));
  const f = FIL[filId];
  let cddFin = null;
  if (contrat === "CDD" || contrat === "Journalier" || contrat === "Stage") {
    cddFin = new Date(TODAY.getTime() + ri(-25, 330) * 864e5);
  }
  const sr = rng();
  const statut = sr > 0.95 ? "Suspendu" : sr > 0.9 ? "En congé" : "Actif";
  return {
    id: "E" + seq, matricule: `${f.court.toUpperCase()}-${String(embauche.getFullYear()).slice(2)}-${String(seq).padStart(4, "0")}`,
    prenom: pr, nom: nm, genre: female ? "F" : "H", filialeId: filId,
    poste, departement: dept, niveau: niv, typeContrat: contrat, salaire,
    dateEmbauche: embauche, cddFin, statut,
    soldeConges: Math.round(ri(0, 30)),
    email: `${slug(pr)}.${slug(nm)}@${DOMAINS[filId]}`,
    tel: `+226 ${ri(50, 79)} ${ri(10, 99)} ${ri(10, 99)} ${ri(10, 99)}`,
  };
}
function buildLeaves(emps) {
  const rng = mulberry32(551);
  const types = [["Congé annuel", 50], ["Maladie", 25], ["Événement familial", 10], ["Maternité", 8], ["Sans solde", 7]];
  const flat = []; types.forEach(([t, w]) => { for (let i = 0; i < w; i++) flat.push(t); });
  const out = [];
  for (let i = 0; i < 240; i++) {
    const e = emps[Math.floor(rng() * emps.length)];
    const type = flat[Math.floor(rng() * flat.length)];
    const start = new Date(TODAY.getTime() + Math.floor(rng() * 80 - 30) * 864e5);
    const dur = type === "Maternité" ? 98 : type === "Maladie" ? 1 + Math.floor(rng() * 7) : 1 + Math.floor(rng() * 14);
    const end = new Date(start.getTime() + dur * 864e5);
    const sr = rng();
    const statut = sr < 0.32 ? "En attente" : sr < 0.86 ? "Approuvé" : "Refusé";
    out.push({ id: "L" + i, empId: e.id, filialeId: e.filialeId, type, debut: start, fin: end, jours: dur, statut });
  }
  return out.sort((a, b) => (a.statut === "En attente" ? -1 : 1) - (b.statut === "En attente" ? -1 : 1));
}
function buildOffres() {
  const data = [
    ["gcm", "Ingénieur procédés", "Kossodo", "CDI", 23, "Entretiens"],
    ["gcm", "Opérateur de four (x4)", "Kossodo", "CDD", 41, "Présélection"],
    ["faso", "Technicien photovoltaïque (x6)", "Kossodo", "CDD", 58, "Ouvert"],
    ["faso", "Ingénieur R&D solaire", "Kossodo", "CDI", 12, "Entretiens"],
    ["amko", "Trader produits pétroliers", "Genève", "CDI", 9, "Offre"],
    ["eco", "Gérant de station (x3)", "Ouagadougou", "CDI", 34, "Présélection"],
    ["eco", "Chauffeur-livreur citerne (x5)", "Koudougou", "CDD", 47, "Ouvert"],
    ["ecofood", "Commercial agroalimentaire (x3)", "Ouagadougou", "CDI", 28, "Présélection"],
    ["ecofood", "Chef de dépôt", "Bobo-Dioulasso", "CDI", 15, "Entretiens"],
    ["gcmimmo", "Négociateur immobilier (x2)", "Ouagadougou", "CDI", 22, "Ouvert"],
    ["gcmimmo", "Conducteur de travaux", "Ouagadougou", "CDI", 11, "Offre"],
  ];
  return data.map((d, i) => ({ id: "O" + i, filialeId: d[0], poste: d[1], lieu: d[2], type: d[3], candidats: d[4], statut: d[5] }));
}

/* ------------------------------------------------------------------ */
/*  Paie (Burkina Faso) — barème modifiable                            */
/* ------------------------------------------------------------------ */
const DEFAULT_PAYROLL = {
  cnssRate: 5.5,       // cotisation salariale (%)
  cnssCeiling: 600000, // plafond mensuel (FCFA)
  cnssPatronal: 16,    // charge patronale (%)
  iuts: [
    { ceil: 30000, rate: 0 }, { ceil: 50000, rate: 12.1 }, { ceil: 80000, rate: 13.9 },
    { ceil: 120000, rate: 15.7 }, { ceil: 170000, rate: 18.4 }, { ceil: 250000, rate: 21.7 },
    { ceil: null, rate: 25 },
  ],
};
function cnssSalarie(brut, cfg) { return (cfg.cnssRate / 100) * Math.min(brut, cfg.cnssCeiling); }
function cnssPatronal(brut, cfg) { return (cfg.cnssPatronal / 100) * Math.min(brut, cfg.cnssCeiling); }
function iuts(base, cfg) {
  let tax = 0, prev = 0;
  for (const b of cfg.iuts) {
    const ceil = b.ceil == null ? Infinity : b.ceil;
    if (base > prev) { tax += (Math.min(base, ceil) - prev) * (b.rate / 100); prev = ceil; } else break;
  }
  return tax;
}

/* ------------------------------------------------------------------ */
/*  Helpers d'affichage                                                */
/* ------------------------------------------------------------------ */
const nf = new Intl.NumberFormat("fr-FR");
const fInt = (n) => nf.format(Math.round(n));
const fM = (n) => nf.format(Math.round(n / 1e6));
const fDate = (d) => d.toLocaleDateString("fr-FR");
const anciennete = (d) => ((TODAY - d) / (365.25 * 864e5)).toFixed(1);
const daysTo = (d) => Math.round((d - TODAY) / 864e5);

/* ------------------------------------------------------------------ */
/*  Composants UI                                                      */
/* ------------------------------------------------------------------ */
function FilialeDot({ id, size = 9 }) {
  return <span style={{ width: size, height: size, borderRadius: 99, background: FIL[id].color, display: "inline-block", flex: "none" }} />;
}
function Chip({ id }) {
  const f = FIL[id];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: f.color + "1A", color: "#374151" }}>
      <FilialeDot id={id} size={7} /> {f.nom}
    </span>
  );
}
function StatusBadge({ s }) {
  const map = {
    Actif: [T.primarySoft, T.primary], "En congé": [T.goldSoft, "#9A6B12"], Suspendu: [T.dangerSoft, T.danger],
    "En attente": [T.goldSoft, "#9A6B12"], Approuvé: [T.primarySoft, T.primary], Refusé: [T.dangerSoft, T.danger],
    Ouvert: [T.primarySoft, T.primary], Présélection: ["#EAF0F6", "#2B5C8A"], Entretiens: [T.goldSoft, "#9A6B12"], Offre: ["#EEEAF6", "#5B3FA8"], Clôturé: ["#EEE", "#666"],
  };
  const [bg, c] = map[s] || ["#EEE", "#555"];
  return <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: bg, color: c }}>{s}</span>;
}

/* ------------------------------------------------------------------ */
/*  Application                                                        */
/* ------------------------------------------------------------------ */
export default function App() {
  const [user, setUser] = useState(null);
  const [allEmps, setAllEmps] = useState(() => buildWorkforce());
  const [leaves, setLeaves] = useState(() => buildLeaves(buildWorkforce()));
  const [offres] = useState(() => buildOffres());
  const [payroll, setPayroll] = useState(DEFAULT_PAYROLL);
  const [page, setPage] = useState("dashboard");
  const [scope, setScope] = useState("ALL"); // pour DRH
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(l);
  }, []);

  // périmètre effectif
  const filIds = useMemo(() => {
    if (!user) return [];
    if (user.scope !== "ALL") return [user.scope];
    return scope === "ALL" ? FILIALES.map((f) => f.id) : [scope];
  }, [user, scope]);

  const emps = useMemo(() => allEmps.filter((e) => filIds.includes(e.filialeId)), [allEmps, filIds]);
  const leavesScoped = useMemo(() => leaves.filter((l) => filIds.includes(l.filialeId)), [leaves, filIds]);
  const empById = useMemo(() => Object.fromEntries(allEmps.map((e) => [e.id, e])), [allEmps]);

  function handleLeave(id, decision) {
    setLeaves((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      if (decision === "Approuvé" && l.type === "Congé annuel") {
        setAllEmps((es) => es.map((e) => e.id === l.empId ? { ...e, soldeConges: Math.max(0, e.soldeConges - l.jours) } : e));
      }
      return { ...l, statut: decision };
    }));
  }
  function addEmployee(rec) { setAllEmps((es) => [rec, ...es]); }
  function clearData() { setAllEmps([]); setLeaves([]); }
  function regenData() { const w = buildWorkforce(); setAllEmps(w); setLeaves(buildLeaves(w)); }

  if (!user) return <Login onPick={(u) => { setUser(u); setScope("ALL"); setPage("dashboard"); }} />;

  const isDRH = user.scope === "ALL";
  const nav = [
    ["dashboard", "Tableau de bord", LayoutDashboard],
    ["employes", "Collaborateurs", Users],
    ["conges", "Congés & absences", CalendarDays],
    ["recrutement", "Recrutement", Briefcase],
    ["analytique", "Analytique", BarChart3],
    ...(isDRH ? [["filiales", "Filiales", Building2], ["parametres", "Paramètres", Settings]] : []),
  ];

  return (
    <div style={{ fontFamily: SANS, color: T.ink, background: T.bg, minHeight: "100vh" }} className="flex">
      {/* Sidebar */}
      <aside className={`${mobileNav ? "fixed inset-0 z-40 w-72" : "hidden"} md:flex md:static md:w-64 flex-col shrink-0`} style={{ background: T.brandDeep }}>
        <Brand />
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {nav.map(([id, label, Icon]) => {
            const active = page === id;
            return (
              <button key={id} onClick={() => { setPage(id); setMobileNav(false); }}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                style={{ background: active ? T.primary : "transparent", color: active ? "#fff" : "#A9C4B4" }}>
                <Icon size={18} /> {label}
              </button>
            );
          })}
        </nav>
        <div className="px-3 py-3" style={{ borderTop: "1px solid #163225" }}>
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, background: T.gold, color: T.brandDeep, fontWeight: 700, fontFamily: DISPLAY }}>
              {user.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user.name}</div>
              <div className="text-xs truncate" style={{ color: "#7FA08F" }}>{user.role}</div>
            </div>
          </div>
          <button onClick={() => setUser(null)} className="mt-1 w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm" style={{ color: "#A9C4B4" }}>
            <LogOut size={16} /> Se déconnecter
          </button>
        </div>
      </aside>
      {mobileNav && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileNav(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar isDRH={isDRH} user={user} scope={scope} setScope={setScope} onMenu={() => setMobileNav(true)} page={page} />
        <main className="flex-1 p-4 md:p-7 overflow-x-hidden">
          {page === "dashboard" && <Dashboard isDRH={isDRH} scope={scope} setScope={setScope} setPage={setPage} emps={emps} leaves={leavesScoped} filIds={filIds} empById={empById} onLeave={handleLeave} />}
          {page === "employes" && <Employes isDRH={isDRH} emps={emps} filIds={filIds} onAdd={addEmployee} userScope={user.scope} payroll={payroll} />}
          {page === "conges" && <Conges leaves={leavesScoped} empById={empById} onLeave={handleLeave} isDRH={isDRH} />}
          {page === "recrutement" && <Recrutement offres={offres.filter((o) => filIds.includes(o.filialeId))} isDRH={isDRH} />}
          {page === "analytique" && <Analytique isDRH={isDRH} emps={emps} filIds={filIds} />}
          {page === "filiales" && isDRH && <Filiales allEmps={allEmps} setScope={setScope} setPage={setPage} />}
          {page === "parametres" && isDRH && <Parametres payroll={payroll} setPayroll={setPayroll} counts={{ emps: allEmps.length, leaves: leaves.length }} onClear={clearData} onRegen={regenData} />}
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 h-16 shrink-0" style={{ borderBottom: "1px solid #163225" }}>
      <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: T.gold }}>
        <span style={{ fontFamily: DISPLAY, fontWeight: 700, color: T.brandDeep, fontSize: 18 }}>K</span>
      </div>
      <div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, color: "#fff", fontSize: 15, lineHeight: 1 }}>KOANDA GROUP</div>
        <div style={{ color: "#7FA08F", fontSize: 11, letterSpacing: 0.4 }}>SIRH · Capital humain</div>
      </div>
    </div>
  );
}

function Topbar({ isDRH, user, scope, setScope, onMenu, page }) {
  const [open, setOpen] = useState(false);
  const titles = { dashboard: "Tableau de bord", employes: "Collaborateurs", conges: "Congés & absences", recrutement: "Recrutement", analytique: "Analytique RH", filiales: "Filiales du groupe" };
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 px-4 md:px-7 h-16 shrink-0" style={{ background: T.surface, borderBottom: `1px solid ${T.line}` }}>
      <button className="md:hidden" onClick={onMenu} aria-label="Ouvrir le menu"><Menu size={22} /></button>
      <h1 style={{ fontFamily: DISPLAY }} className="text-lg font-semibold hidden sm:block">{titles[page]}</h1>
      <div className="flex-1" />
      {isDRH ? (
        <div className="relative">
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium" style={{ background: T.primarySoft, color: T.primary }}>
            <Shield size={15} />
            {scope === "ALL" ? "Tout le groupe" : FIL[scope].nom}
            <ChevronDown size={15} />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl py-1.5 z-30" style={{ background: "#fff", border: `1px solid ${T.line}`, boxShadow: "0 12px 30px rgba(0,0,0,.12)" }}>
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: T.muted }}>Périmètre d'accès</div>
              <button onClick={() => { setScope("ALL"); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                <Shield size={14} color={T.primary} /> Tout le groupe
              </button>
              {FILIALES.map((f) => (
                <button key={f.id} onClick={() => { setScope(f.id); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                  <FilialeDot id={f.id} /> {f.nom}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#F1F0EC", color: "#4A554F" }}>
          <Lock size={14} /> Périmètre : {FIL[user.scope].nom}
        </div>
      )}
    </header>
  );
}

/* ----------------------------- Login ----------------------------- */
function Login({ onPick }) {
  const drh = USERS[0];
  return (
    <div style={{ fontFamily: SANS, background: T.brandDeep, minHeight: "100vh" }} className="flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-3 mb-7">
          <div className="flex items-center justify-center rounded-lg" style={{ width: 44, height: 44, background: T.gold }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, color: T.brandDeep, fontSize: 22 }}>K</span>
          </div>
          <div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, color: "#fff", fontSize: 22, lineHeight: 1.1 }}>Koanda Group · SIRH</div>
            <div style={{ color: "#7FA08F", fontSize: 13 }}>Plateforme de gestion du capital humain — Burkina Faso</div>
          </div>
        </div>

        <div className="rounded-2xl p-2" style={{ background: "#0E2A1D", border: "1px solid #163225" }}>
          <button onClick={() => onPick(drh)} className="w-full text-left rounded-xl p-4 mb-2 flex items-center gap-4 transition-transform hover:scale-[1.01]" style={{ background: "linear-gradient(90deg,#0F6B49,#0A3D2A)" }}>
            <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: 46, height: 46, background: T.gold, color: T.brandDeep, fontWeight: 700, fontFamily: DISPLAY }}>AK</div>
            <div className="flex-1">
              <div className="text-white font-semibold flex items-center gap-2">{drh.name} <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: T.gold, color: T.brandDeep }}>Accès groupe</span></div>
              <div className="text-sm" style={{ color: "#CDE0D6" }}>{drh.role} — accès à toutes les filiales, vue consolidée</div>
            </div>
            <ChevronRight color="#fff" />
          </button>

          <div className="px-3 py-1.5 text-xs uppercase tracking-wide" style={{ color: "#7FA08F" }}>Responsables RH de filiale — accès limité à leur périmètre</div>
          <div className="grid sm:grid-cols-2 gap-2 p-1">
            {USERS.slice(1).map((u) => {
              const f = FIL[u.scope];
              return (
                <button key={u.id} onClick={() => onPick(u)} className="text-left rounded-xl p-3 flex items-center gap-3 transition-colors hover:bg-white/5" style={{ background: "#0B2117", border: "1px solid #163225" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: f.color, flex: "none" }} />
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium truncate">{u.name}</div>
                    <div className="text-xs truncate" style={{ color: "#7FA08F" }}>{f.nom} · {f.secteur}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: "#5E7A6B" }}>Démonstration — choisissez un profil pour explorer le contrôle d'accès par périmètre.</p>
      </div>
    </div>
  );
}

/* --------------------------- Dashboard --------------------------- */
function Dashboard({ isDRH, scope, setScope, setPage, emps, leaves, filIds, empById, onLeave }) {
  const effectif = emps.length;
  const masse = emps.reduce((s, e) => s + e.salaire, 0);
  const enAttente = leaves.filter((l) => l.statut === "En attente");
  const cddEcheance = emps.filter((e) => e.cddFin && daysTo(e.cddFin) >= 0 && daysTo(e.cddFin) <= 90);
  const femmes = effectif ? Math.round((emps.filter((e) => e.genre === "F").length / effectif) * 100) : 0;
  const ancMoy = effectif ? (emps.reduce((s, e) => s + (TODAY - e.dateEmbauche), 0) / effectif / (365.25 * 864e5)).toFixed(1) : 0;
  const wAbs = filIds.reduce((s, id) => s + FIL[id].abs * FIL[id].head, 0) / filIds.reduce((s, id) => s + FIL[id].head, 0);
  const wTurn = filIds.reduce((s, id) => s + FIL[id].turn * FIL[id].head, 0) / filIds.reduce((s, id) => s + FIL[id].head, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 style={{ fontFamily: DISPLAY }} className="text-xl font-semibold">
            {isDRH ? (scope === "ALL" ? "Vue consolidée du groupe" : FIL[scope].nom) : FIL[filIds[0]].nom}
          </h2>
          <p className="text-sm" style={{ color: T.muted }}>
            {isDRH && scope === "ALL" ? `${FILIALES.length} filiales · ${fInt(effectif)} collaborateurs` : `${FIL[filIds[0]].secteur} · ${FIL[filIds[0]].ville}`}
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: T.surface, border: `1px solid ${T.line}`, color: T.muted }}>Données au {fDate(TODAY)}</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Users} label="Effectif total" value={fInt(effectif)} sub="collaborateurs" tone="primary" />
        <Kpi icon={Wallet} label="Masse salariale" value={fM(masse) + " M"} sub="FCFA brut / mois" tone="gold" />
        <Kpi icon={CalendarDays} label="Congés à traiter" value={enAttente.length} sub="demandes en attente" tone={enAttente.length ? "gold" : "primary"} />
        <Kpi icon={AlertTriangle} label="CDD à échéance" value={cddEcheance.length} sub="< 90 jours" tone={cddEcheance.length ? "danger" : "primary"} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="Absentéisme" value={wAbs.toFixed(1) + " %"} trend="down" />
        <MiniStat label="Turnover annualisé" value={wTurn.toFixed(0) + " %"} trend="up" />
        <MiniStat label="Part des femmes" value={femmes + " %"} />
        <MiniStat label="Ancienneté moyenne" value={ancMoy + " ans"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Signature : barre consolidée */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          {isDRH && scope === "ALL" ? (
            <ConsolidatedBar emps={emps} setScope={setScope} />
          ) : (
            <DeptBreakdown emps={emps} title="Répartition par département" />
          )}
        </div>

        {/* File de validation */}
        <div className="rounded-2xl p-5 flex flex-col" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold" style={{ fontFamily: DISPLAY }}>À valider</h3>
            <button onClick={() => setPage("conges")} className="text-xs font-medium" style={{ color: T.primary }}>Tout voir</button>
          </div>
          {enAttente.length === 0 && <div className="text-sm py-8 text-center" style={{ color: T.muted }}>Aucune demande en attente. File à jour.</div>}
          <div className="space-y-2.5 overflow-y-auto" style={{ maxHeight: 320 }}>
            {enAttente.slice(0, 6).map((l) => {
              const e = empById[l.empId];
              return (
                <div key={l.id} className="rounded-xl p-3" style={{ background: T.bg }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{e.prenom} {e.nom}</div>
                      <div className="text-xs" style={{ color: T.muted }}>{l.type} · {l.jours} j · dès le {fDate(l.debut)}</div>
                    </div>
                    {isDRH && scope === "ALL" && <FilialeDot id={l.filialeId} />}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => onLeave(l.id, "Approuvé")} className="flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold" style={{ background: T.primary, color: "#fff" }}><Check size={13} /> Approuver</button>
                    <button onClick={() => onLeave(l.id, "Refusé")} className="flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold" style={{ background: "#fff", border: `1px solid ${T.line}`, color: T.danger }}><X size={13} /> Refuser</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isDRH && scope === "ALL" && <FilialeComparison emps={emps} leaves={leaves} setScope={setScope} setPage={setPage} />}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone }) {
  const tones = { primary: [T.primarySoft, T.primary], gold: [T.goldSoft, "#9A6B12"], danger: [T.dangerSoft, T.danger] };
  const [bg, c] = tones[tone] || tones.primary;
  return (
    <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: T.muted }}>{label}</span>
        <span className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: bg, color: c }}><Icon size={16} /></span>
      </div>
      <div style={{ fontFamily: DISPLAY, fontVariantNumeric: "tabular-nums" }} className="text-2xl font-bold mt-2">{value}</div>
      <div className="text-xs" style={{ color: T.muted }}>{sub}</div>
    </div>
  );
}
function MiniStat({ label, value, trend }) {
  return (
    <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      <div>
        <div className="text-xs" style={{ color: T.muted }}>{label}</div>
        <div style={{ fontFamily: DISPLAY, fontVariantNumeric: "tabular-nums" }} className="text-lg font-semibold">{value}</div>
      </div>
      {trend === "up" && <TrendingUp size={16} color={T.danger} />}
      {trend === "down" && <TrendingDown size={16} color={T.primary} />}
    </div>
  );
}

function ConsolidatedBar({ emps, setScope }) {
  const counts = FILIALES.map((f) => ({ f, n: emps.filter((e) => e.filialeId === f.id).length }));
  const total = counts.reduce((s, c) => s + c.n, 0);
  if (total === 0) return (
    <div>
      <h3 className="font-semibold mb-1" style={{ fontFamily: DISPLAY }}>Effectifs par filiale</h3>
      <div className="py-10 text-center text-sm" style={{ color: T.muted }}>Base vide — aucune donnée à afficher.<br />Importez vos collaborateurs ou régénérez les données de démonstration depuis Paramètres.</div>
    </div>
  );
  return (
    <div>
      <h3 className="font-semibold mb-1" style={{ fontFamily: DISPLAY }}>Effectifs par filiale</h3>
      <p className="text-xs mb-4" style={{ color: T.muted }}>Cliquez sur une filiale pour zoomer sur son périmètre.</p>
      <div className="flex w-full rounded-lg overflow-hidden" style={{ height: 44 }}>
        {counts.map(({ f, n }) => (
          <button key={f.id} onClick={() => setScope(f.id)} title={`${f.nom} — ${fInt(n)} collaborateurs`}
            className="h-full transition-opacity hover:opacity-80 flex items-center justify-center"
            style={{ width: (n / total) * 100 + "%", background: f.color, minWidth: 4 }}>
            {n / total > 0.1 && <span className="text-xs font-semibold text-white">{Math.round((n / total) * 100)}%</span>}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        {counts.map(({ f, n }) => (
          <button key={f.id} onClick={() => setScope(f.id)} className="flex items-center gap-2 text-left rounded-lg px-2 py-1.5 hover:bg-gray-50">
            <FilialeDot id={f.id} />
            <span className="min-w-0">
              <span className="block text-xs font-medium truncate">{f.nom}</span>
              <span className="block text-xs" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>{fInt(n)}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
function DeptBreakdown({ emps, title }) {
  const map = {};
  emps.forEach((e) => { map[e.departement] = (map[e.departement] || 0) + 1; });
  const data = Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      <h3 className="font-semibold mb-4" style={{ fontFamily: DISPLAY }}>{title}</h3>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-3">
            <span className="text-xs w-36 shrink-0 truncate" style={{ color: "#374151" }}>{d.name}</span>
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 10, background: T.bg }}>
              <div style={{ width: (d.value / max) * 100 + "%", height: "100%", background: T.primary }} />
            </div>
            <span className="text-xs w-10 text-right" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilialeComparison({ emps, leaves, setScope, setPage }) {
  const rows = FILIALES.map((f) => {
    const fe = emps.filter((e) => e.filialeId === f.id);
    return {
      f, effectif: fe.length, masse: fe.reduce((s, e) => s + e.salaire, 0),
      attente: leaves.filter((l) => l.filialeId === f.id && l.statut === "En attente").length,
    };
  });
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      <div className="px-5 py-4"><h3 className="font-semibold" style={{ fontFamily: DISPLAY }}>Comparatif des filiales</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: T.bg, color: T.muted }} className="text-xs uppercase tracking-wide text-left">
              <th className="px-5 py-2.5 font-medium">Filiale</th>
              <th className="px-3 py-2.5 font-medium">Resp. RH</th>
              <th className="px-3 py-2.5 font-medium text-right">Effectif</th>
              <th className="px-3 py-2.5 font-medium text-right">Masse sal. (M)</th>
              <th className="px-3 py-2.5 font-medium text-right">Absent.</th>
              <th className="px-3 py-2.5 font-medium text-right">Turnover</th>
              <th className="px-3 py-2.5 font-medium text-right">À valider</th>
              <th className="px-5 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ f, effectif, masse, attente }) => (
              <tr key={f.id} style={{ borderTop: `1px solid ${T.line}` }}>
                <td className="px-5 py-3"><div className="flex items-center gap-2"><FilialeDot id={f.id} /><div><div className="font-medium">{f.nom}</div><div className="text-xs" style={{ color: T.muted }}>{f.secteur}</div></div></div></td>
                <td className="px-3 py-3" style={{ color: "#374151" }}>{f.rh}</td>
                <td className="px-3 py-3 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{fInt(effectif)}</td>
                <td className="px-3 py-3 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{fM(masse)}</td>
                <td className="px-3 py-3 text-right">{f.abs} %</td>
                <td className="px-3 py-3 text-right">{f.turn} %</td>
                <td className="px-3 py-3 text-right">{attente > 0 ? <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: T.goldSoft, color: "#9A6B12" }}>{attente}</span> : <span style={{ color: T.muted }}>—</span>}</td>
                <td className="px-5 py-3 text-right"><button onClick={() => { setScope(f.id); setPage("dashboard"); }} className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: T.primary }}>Zoomer <ChevronRight size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* --------------------------- Collaborateurs --------------------------- */
function Employes({ isDRH, emps, filIds, onAdd, userScope, payroll }) {
  const [q, setQ] = useState("");
  const [fFil, setFFil] = useState("all");
  const [fContrat, setFContrat] = useState("all");
  const [sort, setSort] = useState({ key: "nom", dir: 1 });
  const [pg, setPg] = useState(0);
  const [sel, setSel] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const per = 12;

  const filtered = useMemo(() => {
    let r = emps;
    if (q) { const s = q.toLowerCase(); r = r.filter((e) => (e.prenom + " " + e.nom + " " + e.poste + " " + e.matricule).toLowerCase().includes(s)); }
    if (fFil !== "all") r = r.filter((e) => e.filialeId === fFil);
    if (fContrat !== "all") r = r.filter((e) => e.typeContrat === fContrat);
    r = [...r].sort((a, b) => {
      let va, vb;
      if (sort.key === "nom") { va = a.nom + a.prenom; vb = b.nom + b.prenom; }
      else if (sort.key === "salaire") { va = a.salaire; vb = b.salaire; }
      else if (sort.key === "anc") { va = a.dateEmbauche; vb = b.dateEmbauche; }
      else { va = a[sort.key]; vb = b[sort.key]; }
      return va > vb ? sort.dir : va < vb ? -sort.dir : 0;
    });
    return r;
  }, [emps, q, fFil, fContrat, sort]);

  useEffect(() => setPg(0), [q, fFil, fContrat]);
  const pages = Math.max(1, Math.ceil(filtered.length / per));
  const view = filtered.slice(pg * per, pg * per + per);
  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color={T.muted} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un nom, poste, matricule…"
            className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none" style={{ background: T.surface, border: `1px solid ${T.line}` }} />
        </div>
        {isDRH && filIds.length > 1 && (
          <select value={fFil} onChange={(e) => setFFil(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm outline-none" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
            <option value="all">Toutes les filiales</option>
            {FILIALES.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
        )}
        <select value={fContrat} onChange={(e) => setFContrat(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm outline-none" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <option value="all">Tous contrats</option>
          {CT_LABEL.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-white" style={{ background: T.primary }}>
          <Plus size={16} /> Nouveau collaborateur
        </button>
      </div>

      <div className="text-sm" style={{ color: T.muted }}>{fInt(filtered.length)} collaborateur{filtered.length > 1 ? "s" : ""}</div>

      <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: T.bg, color: T.muted }} className="text-xs uppercase tracking-wide text-left">
                <Th onClick={() => toggleSort("nom")} active={sort.key === "nom"}>Collaborateur</Th>
                <th className="px-3 py-2.5 font-medium">Poste</th>
                {isDRH && filIds.length > 1 && <th className="px-3 py-2.5 font-medium">Filiale</th>}
                <th className="px-3 py-2.5 font-medium">Contrat</th>
                <Th onClick={() => toggleSort("salaire")} active={sort.key === "salaire"} right>Salaire brut</Th>
                <Th onClick={() => toggleSort("anc")} active={sort.key === "anc"} right>Ancienneté</Th>
                <th className="px-3 py-2.5 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {view.map((e) => (
                <tr key={e.id} onClick={() => setSel(e)} className="cursor-pointer hover:bg-gray-50" style={{ borderTop: `1px solid ${T.line}` }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center rounded-full text-xs font-semibold shrink-0" style={{ width: 32, height: 32, background: FIL[e.filialeId].color + "22", color: "#374151" }}>{e.prenom[0]}{e.nom[0]}</span>
                      <div><div className="font-medium">{e.prenom} {e.nom}</div><div className="text-xs" style={{ color: T.muted }}>{e.matricule}</div></div>
                    </div>
                  </td>
                  <td className="px-3 py-3" style={{ color: "#374151" }}>{e.poste}<div className="text-xs" style={{ color: T.muted }}>{e.departement}</div></td>
                  {isDRH && filIds.length > 1 && <td className="px-3 py-3"><div className="flex items-center gap-1.5 text-xs"><FilialeDot id={e.filialeId} />{FIL[e.filialeId].court}</div></td>}
                  <td className="px-3 py-3">{e.typeContrat}</td>
                  <td className="px-3 py-3 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{fInt(e.salaire)}</td>
                  <td className="px-3 py-3 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{anciennete(e.dateEmbauche)} ans</td>
                  <td className="px-3 py-3"><StatusBadge s={e.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${T.line}` }}>
          <span className="text-xs" style={{ color: T.muted }}>Page {pg + 1} / {pages}</span>
          <div className="flex gap-2">
            <button disabled={pg === 0} onClick={() => setPg((p) => p - 1)} className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-40" style={{ border: `1px solid ${T.line}` }}>Précédent</button>
            <button disabled={pg >= pages - 1} onClick={() => setPg((p) => p + 1)} className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-40" style={{ border: `1px solid ${T.line}` }}>Suivant</button>
          </div>
        </div>
      </div>

      {sel && <EmployeeDrawer e={sel} onClose={() => setSel(null)} payroll={payroll} />}
      {showAdd && <AddEmployee onClose={() => setShowAdd(false)} onAdd={onAdd} userScope={userScope} isDRH={isDRH} />}
    </div>
  );
}
function Th({ children, onClick, active, right }) {
  return (
    <th className={`px-3 py-2.5 font-medium ${right ? "text-right" : ""}`}>
      <button onClick={onClick} className="inline-flex items-center gap-1" style={{ color: active ? T.primary : "inherit" }}>{children}<ArrowUpDown size={12} /></button>
    </th>
  );
}

function EmployeeDrawer({ e, onClose, payroll }) {
  const cnss = cnssSalarie(e.salaire, payroll);
  const tax = iuts(e.salaire - cnss, payroll);
  const net = e.salaire - cnss - tax;
  const patron = cnssPatronal(e.salaire, payroll);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(7,18,11,.45)" }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto" style={{ background: T.surface }} onClick={(ev) => ev.stopPropagation()}>
        <div className="p-5" style={{ background: FIL[e.filialeId].color }}>
          <button onClick={onClose} className="text-white/80 mb-3" aria-label="Fermer"><X size={20} /></button>
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center rounded-full text-lg font-bold" style={{ width: 56, height: 56, background: "rgba(255,255,255,.25)", color: "#fff", fontFamily: DISPLAY }}>{e.prenom[0]}{e.nom[0]}</span>
            <div>
              <div className="text-white text-lg font-semibold" style={{ fontFamily: DISPLAY }}>{e.prenom} {e.nom}</div>
              <div className="text-white/90 text-sm">{e.poste}</div>
              <div className="text-white/75 text-xs">{e.matricule} · {FIL[e.filialeId].nom}</div>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <Section title="Informations">
            <Row k="Département" v={e.departement} />
            <Row k="Type de contrat" v={e.typeContrat} />
            {e.cddFin && <Row k="Fin de contrat" v={`${fDate(e.cddFin)} (${daysTo(e.cddFin)} j)`} warn={daysTo(e.cddFin) <= 90} />}
            <Row k="Date d'embauche" v={`${fDate(e.dateEmbauche)} · ${anciennete(e.dateEmbauche)} ans`} />
            <Row k="Statut" v={e.statut} />
            <Row k="Email" v={e.email} />
            <Row k="Téléphone" v={e.tel} />
          </Section>

          <Section title="Rémunération & charges (estimation mensuelle)">
            <Row k="Salaire brut" v={fInt(e.salaire) + " FCFA"} strong />
            <Row k={`Cotisation CNSS (${payroll.cnssRate} %)`} v={"– " + fInt(cnss) + " FCFA"} />
            <Row k="IUTS (barème progressif)" v={"– " + fInt(tax) + " FCFA"} />
            <div className="my-1" style={{ borderTop: `1px dashed ${T.line}` }} />
            <Row k="Net à payer estimé" v={fInt(net) + " FCFA"} strong accent />
            <Row k={`Charge patronale CNSS (${payroll.cnssPatronal} %)`} v={fInt(patron) + " FCFA"} muted />
          </Section>

          <Section title="Congés">
            <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: T.primarySoft }}>
              <div><div className="text-xs" style={{ color: T.primary }}>Solde de congés</div><div className="text-2xl font-bold" style={{ fontFamily: DISPLAY, color: T.primary }}>{e.soldeConges} j</div></div>
              <CalendarDays size={32} color={T.primary} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
function Section({ title, children }) {
  return (<div><div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: T.muted }}>{title}</div><div className="space-y-1.5">{children}</div></div>);
}
function Row({ k, v, strong, accent, muted, warn }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span style={{ color: T.muted }}>{k}</span>
      <span style={{ fontWeight: strong ? 700 : 500, color: accent ? T.primary : warn ? T.danger : muted ? T.muted : "#1f2937", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{v}</span>
    </div>
  );
}

function AddEmployee({ onClose, onAdd, userScope, isDRH }) {
  const [form, setForm] = useState({ prenom: "", nom: "", filialeId: isDRH ? "gcm" : userScope, departement: "Production", poste: "", typeContrat: "CDI", salaire: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.prenom && form.nom && form.poste && form.salaire;
  function submit() {
    if (!valid) return;
    const f = FIL[form.filialeId];
    const seq = Math.floor(Math.random() * 9000 + 1000);
    onAdd({
      id: "E" + Date.now(), matricule: `${f.court.toUpperCase()}-26-${seq}`, prenom: form.prenom, nom: form.nom,
      genre: PRENOMS_F.includes(form.prenom) ? "F" : "H", filialeId: form.filialeId, poste: form.poste,
      departement: form.departement, niveau: 2, typeContrat: form.typeContrat, salaire: Number(form.salaire),
      dateEmbauche: TODAY, cddFin: form.typeContrat === "CDI" ? null : new Date(TODAY.getTime() + 365 * 864e5),
      statut: "Actif", soldeConges: 0, email: "", tel: "",
    });
    onClose();
  }
  const inp = { background: T.bg, border: `1px solid ${T.line}` };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(7,18,11,.45)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl" style={{ background: T.surface }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.line}` }}>
          <h3 className="font-semibold" style={{ fontFamily: DISPLAY }}>Nouveau collaborateur</h3>
          <button onClick={onClose} aria-label="Fermer"><X size={20} /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3 text-sm">
          <label className="space-y-1"><span className="text-xs" style={{ color: T.muted }}>Prénom</span><input value={form.prenom} onChange={set("prenom")} className="w-full rounded-lg px-3 py-2 outline-none" style={inp} /></label>
          <label className="space-y-1"><span className="text-xs" style={{ color: T.muted }}>Nom</span><input value={form.nom} onChange={set("nom")} className="w-full rounded-lg px-3 py-2 outline-none" style={inp} /></label>
          <label className="space-y-1 col-span-2"><span className="text-xs" style={{ color: T.muted }}>Filiale</span>
            <select value={form.filialeId} onChange={set("filialeId")} disabled={!isDRH} className="w-full rounded-lg px-3 py-2 outline-none disabled:opacity-60" style={inp}>
              {FILIALES.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
            {!isDRH && <span className="text-xs flex items-center gap-1" style={{ color: T.muted }}><Lock size={11} /> Verrouillé sur votre périmètre</span>}
          </label>
          <label className="space-y-1 col-span-2"><span className="text-xs" style={{ color: T.muted }}>Poste</span><input value={form.poste} onChange={set("poste")} className="w-full rounded-lg px-3 py-2 outline-none" style={inp} placeholder="ex. Technicien photovoltaïque" /></label>
          <label className="space-y-1"><span className="text-xs" style={{ color: T.muted }}>Contrat</span><select value={form.typeContrat} onChange={set("typeContrat")} className="w-full rounded-lg px-3 py-2 outline-none" style={inp}>{CT_LABEL.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="space-y-1"><span className="text-xs" style={{ color: T.muted }}>Salaire brut (FCFA)</span><input value={form.salaire} onChange={set("salaire")} type="number" className="w-full rounded-lg px-3 py-2 outline-none" style={inp} /></label>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4" style={{ borderTop: `1px solid ${T.line}` }}>
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm" style={{ border: `1px solid ${T.line}` }}>Annuler</button>
          <button onClick={submit} disabled={!valid} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" style={{ background: T.primary }}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Congés --------------------------- */
function Conges({ leaves, empById, onLeave, isDRH }) {
  const [tab, setTab] = useState("En attente");
  const tabs = ["En attente", "Approuvé", "Refusé"];
  const list = leaves.filter((l) => l.statut === tab);
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {tabs.map((t) => {
          const n = leaves.filter((l) => l.statut === t).length;
          const active = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} className="rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2"
              style={{ background: active ? T.primary : T.surface, color: active ? "#fff" : "#374151", border: `1px solid ${active ? T.primary : T.line}` }}>
              {t} <span className="rounded-full px-1.5 text-xs" style={{ background: active ? "rgba(255,255,255,.2)" : T.bg }}>{n}</span>
            </button>
          );
        })}
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        {list.length === 0 && <div className="py-16 text-center text-sm" style={{ color: T.muted }}>Aucune demande dans cette catégorie.</div>}
        <div className="divide-y" style={{ borderColor: T.line }}>
          {list.slice(0, 40).map((l) => {
            const e = empById[l.empId];
            return (
              <div key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ borderTop: `1px solid ${T.line}` }}>
                <span className="flex items-center justify-center rounded-full text-xs font-semibold shrink-0" style={{ width: 34, height: 34, background: FIL[l.filialeId].color + "22" }}>{e.prenom[0]}{e.nom[0]}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{e.prenom} {e.nom} <span className="text-xs font-normal" style={{ color: T.muted }}>· {e.poste}</span></div>
                  <div className="text-xs flex items-center gap-2 flex-wrap" style={{ color: T.muted }}>
                    {isDRH && <Chip id={l.filialeId} />}
                    <span>{l.type}</span><span>·</span><span>{fDate(l.debut)} → {fDate(l.fin)}</span><span>·</span><span>{l.jours} j</span>
                  </div>
                </div>
                {l.statut === "En attente" ? (
                  <div className="flex gap-2">
                    <button onClick={() => onLeave(l.id, "Approuvé")} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: T.primary }}><Check size={13} /> Approuver</button>
                    <button onClick={() => onLeave(l.id, "Refusé")} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "#fff", border: `1px solid ${T.line}`, color: T.danger }}><X size={13} /> Refuser</button>
                  </div>
                ) : <StatusBadge s={l.statut} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Recrutement --------------------------- */
function Recrutement({ offres, isDRH }) {
  const cols = ["Ouvert", "Présélection", "Entretiens", "Offre"];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Briefcase} label="Postes ouverts" value={offres.length} sub="offres actives" tone="primary" />
        <Kpi icon={Users} label="Candidatures" value={fInt(offres.reduce((s, o) => s + o.candidats, 0))} sub="en cours" tone="gold" />
        <Kpi icon={CalendarDays} label="En entretien" value={offres.filter((o) => o.statut === "Entretiens").length} sub="processus avancés" tone="primary" />
        <Kpi icon={Check} label="Offres émises" value={offres.filter((o) => o.statut === "Offre").length} sub="en attente de réponse" tone="primary" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {cols.map((c) => (
          <div key={c} className="rounded-2xl p-3" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
            <div className="flex items-center justify-between mb-2 px-1"><span className="text-sm font-semibold">{c}</span><StatusBadge s={c} /></div>
            <div className="space-y-2">
              {offres.filter((o) => o.statut === c).map((o) => (
                <div key={o.id} className="rounded-xl p-3" style={{ background: T.bg }}>
                  <div className="text-sm font-medium">{o.poste}</div>
                  <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: T.muted }}><MapPin size={11} /> {o.lieu} · {o.type}</div>
                  <div className="flex items-center justify-between mt-2">
                    {isDRH ? <Chip id={o.filialeId} /> : <span />}
                    <span className="text-xs font-semibold" style={{ color: T.primary }}>{o.candidats} candidats</span>
                  </div>
                </div>
              ))}
              {offres.filter((o) => o.statut === c).length === 0 && <div className="text-xs text-center py-4" style={{ color: T.muted }}>—</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- Analytique --------------------------- */
function Analytique({ isDRH, emps, filIds }) {
  const parContrat = useMemo(() => {
    const m = {}; emps.forEach((e) => { m[e.typeContrat] = (m[e.typeContrat] || 0) + 1; });
    return CT_LABEL.filter((c) => m[c]).map((c) => ({ name: c, value: m[c] }));
  }, [emps]);
  const parFiliale = useMemo(() => FILIALES.filter((f) => filIds.includes(f.id)).map((f) => ({ name: f.court, value: emps.filter((e) => e.filialeId === f.id).length, masse: Math.round(emps.filter((e) => e.filialeId === f.id).reduce((s, e) => s + e.salaire, 0) / 1e6), color: f.color })), [emps, filIds]);
  const evolution = useMemo(() => {
    const base = emps.length; const arr = [];
    const mois = ["Juil", "Août", "Sept", "Oct", "Nov", "Déc", "Janv", "Févr", "Mars", "Avr", "Mai", "Juin"];
    let v = base * 0.9;
    for (let i = 0; i < 12; i++) { v = i === 11 ? base : Math.round(v * (1 + (Math.sin(i) * 0.012 + 0.009))); arr.push({ mois: mois[i], effectif: v }); }
    return arr;
  }, [emps]);
  const PIE = ["#0F6B49", "#C8932A", "#1E5FA8", "#9D4D6E"];
  const showFil = isDRH && filIds.length > 1;

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title={showFil ? "Effectifs par filiale" : "Effectifs par département"}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={showFil ? parFiliale : deptData(emps)} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={T.line} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {(showFil ? parFiliale : deptData(emps)).map((d, i) => <Cell key={i} fill={d.color || T.primary} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Répartition par type de contrat">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={parContrat} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {parContrat.map((d, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-1">
            {parContrat.map((d, i) => <span key={d.name} className="flex items-center gap-1.5 text-xs"><span style={{ width: 9, height: 9, borderRadius: 2, background: PIE[i % PIE.length] }} /> {d.name} ({d.value})</span>)}
          </div>
        </Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Évolution des effectifs (12 mois)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={evolution} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={T.line} />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} domain={["dataMin - 20", "dataMax + 20"]} />
              <Tooltip />
              <Line type="monotone" dataKey="effectif" stroke={T.primary} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        {showFil ? (
          <Card title="Masse salariale par filiale (M FCFA / mois)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={parFiliale} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={T.line} />
                <XAxis type="number" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} width={42} />
                <Tooltip />
                <Bar dataKey="masse" radius={[0, 5, 5, 0]}>{parFiliale.map((d, i) => <Cell key={i} fill={d.color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        ) : (
          <Card title="Pyramide des niveaux"><DeptBreakdown emps={emps} title="" /></Card>
        )}
      </div>
    </div>
  );
}
function deptData(emps) {
  const m = {}; emps.forEach((e) => { m[e.departement] = (m[e.departement] || 0) + 1; });
  return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
}
function Card({ title, children }) {
  return (<div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.line}` }}><h3 className="font-semibold mb-3" style={{ fontFamily: DISPLAY }}>{title}</h3>{children}</div>);
}

/* --------------------------- Filiales (DRH) --------------------------- */
function Filiales({ allEmps, setScope, setPage }) {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {FILIALES.map((f) => {
        const fe = allEmps.filter((e) => e.filialeId === f.id);
        const masse = fe.reduce((s, e) => s + e.salaire, 0);
        return (
          <div key={f.id} className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
            <div className="p-4" style={{ background: f.color }}>
              <div className="text-white font-semibold text-lg" style={{ fontFamily: DISPLAY }}>{f.nom}</div>
              <div className="text-white/85 text-sm">{f.secteur}</div>
              <div className="text-white/75 text-xs flex items-center gap-1 mt-1"><MapPin size={11} /> {f.ville}</div>
            </div>
            <div className="p-4 space-y-2.5 text-sm">
              <div className="flex items-center gap-2"><CircleUserRound size={16} color={T.muted} /><span style={{ color: T.muted }}>Resp. RH</span><span className="ml-auto font-medium">{f.rh}</span></div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <Mini k="Effectif" v={fInt(fe.length)} />
                <Mini k="Masse (M)" v={fM(masse)} />
                <Mini k="Turnover" v={f.turn + "%"} />
              </div>
              <button onClick={() => { setScope(f.id); setPage("dashboard"); }} className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold" style={{ background: T.primarySoft, color: T.primary }}>
                Ouvrir le périmètre <ChevronRight size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
function Mini({ k, v }) {
  return (<div className="rounded-lg px-2 py-2 text-center" style={{ background: T.bg }}><div className="text-xs" style={{ color: T.muted }}>{k}</div><div className="font-semibold" style={{ fontFamily: DISPLAY, fontVariantNumeric: "tabular-nums" }}>{v}</div></div>);
}

/* --------------------------- Paramètres (DRH) --------------------------- */
function Parametres({ payroll, setPayroll, counts, onClear, onRegen }) {
  const [test, setTest] = useState(250000);
  const [confirmClear, setConfirmClear] = useState(false);
  const num = (v) => (v === "" ? 0 : parseFloat(v));
  const updBracket = (i, k, v) => setPayroll((p) => ({ ...p, iuts: p.iuts.map((b, j) => (j === i ? { ...b, [k]: v } : b)) }));
  const addBracket = () => setPayroll((p) => { const a = [...p.iuts]; a.splice(a.length - 1, 0, { ceil: 300000, rate: 22 }); return { ...p, iuts: a }; });
  const delBracket = (i) => setPayroll((p) => ({ ...p, iuts: p.iuts.filter((_, j) => j !== i) }));

  const cnss = cnssSalarie(test, payroll);
  const tax = iuts(test - cnss, payroll);
  const net = test - cnss - tax;
  const patron = cnssPatronal(test, payroll);
  const inp = { background: T.bg, border: `1px solid ${T.line}` };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Barème de paie */}
      <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <div className="flex items-center gap-2 mb-1"><SlidersHorizontal size={18} color={T.primary} /><h3 className="font-semibold" style={{ fontFamily: DISPLAY }}>Barème de paie</h3></div>
        <p className="text-sm mb-4" style={{ color: T.muted }}>Paramètres appliqués à tout le groupe. Les modifications recalculent instantanément les bulletins.</p>

        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          <label className="space-y-1"><span className="text-xs" style={{ color: T.muted }}>CNSS salariale (%)</span>
            <input type="number" step="0.1" value={payroll.cnssRate} onChange={(e) => setPayroll((p) => ({ ...p, cnssRate: num(e.target.value) }))} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inp} /></label>
          <label className="space-y-1"><span className="text-xs" style={{ color: T.muted }}>Plafond CNSS (FCFA)</span>
            <input type="number" step="10000" value={payroll.cnssCeiling} onChange={(e) => setPayroll((p) => ({ ...p, cnssCeiling: num(e.target.value) }))} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inp} /></label>
          <label className="space-y-1"><span className="text-xs" style={{ color: T.muted }}>Charge patronale CNSS (%)</span>
            <input type="number" step="0.1" value={payroll.cnssPatronal} onChange={(e) => setPayroll((p) => ({ ...p, cnssPatronal: num(e.target.value) }))} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inp} /></label>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Tranches IUTS (impôt progressif)</span>
          <button onClick={addBracket} className="text-xs font-semibold flex items-center gap-1" style={{ color: T.primary }}><Plus size={13} /> Ajouter une tranche</button>
        </div>
        <div className="space-y-2">
          {payroll.iuts.map((b, i) => {
            const last = i === payroll.iuts.length - 1;
            const prev = i === 0 ? 0 : (payroll.iuts[i - 1].ceil ?? 0);
            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-xs w-28 shrink-0" style={{ color: T.muted }}>{fInt(prev)} →</span>
                {last ? (
                  <span className="rounded-lg px-3 py-2 text-sm flex-1" style={{ background: T.bg, color: T.muted }}>au-delà (∞)</span>
                ) : (
                  <input type="number" step="5000" value={b.ceil ?? 0} onChange={(e) => updBracket(i, "ceil", num(e.target.value))} className="rounded-lg px-3 py-2 text-sm flex-1 outline-none" style={inp} />
                )}
                <div className="relative w-28">
                  <input type="number" step="0.1" value={b.rate} onChange={(e) => updBracket(i, "rate", num(e.target.value))} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inp} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: T.muted }}>%</span>
                </div>
                <button onClick={() => delBracket(i)} disabled={last || payroll.iuts.length <= 2} className="p-2 disabled:opacity-30" aria-label="Supprimer la tranche"><Trash2 size={15} color={T.danger} /></button>
              </div>
            );
          })}
        </div>
        <button onClick={() => setPayroll(DEFAULT_PAYROLL)} className="mt-4 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium" style={{ border: `1px solid ${T.line}` }}><RefreshCw size={14} /> Réinitialiser le barème officiel</button>

        {/* Simulateur */}
        <div className="mt-5 rounded-xl p-4" style={{ background: T.bg }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium">Simulateur —</span>
            <input type="number" step="10000" value={test} onChange={(e) => setTest(num(e.target.value))} className="rounded-lg px-3 py-1.5 text-sm w-40 outline-none" style={{ background: "#fff", border: `1px solid ${T.line}` }} />
            <span className="text-sm" style={{ color: T.muted }}>FCFA brut</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Mini k="CNSS salarié" v={fInt(cnss)} />
            <Mini k="IUTS" v={fInt(tax)} />
            <Mini k="Net estimé" v={fInt(net)} />
            <Mini k="Coût employeur" v={fInt(test + patron)} />
          </div>
        </div>
      </div>

      {/* Gestion des données */}
      <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <div className="flex items-center gap-2 mb-1"><Database size={18} color={T.primary} /><h3 className="font-semibold" style={{ fontFamily: DISPLAY }}>Gestion des données</h3></div>
        <p className="text-sm mb-4" style={{ color: T.muted }}>Données chargées en mémoire : <strong>{fInt(counts.emps)}</strong> collaborateurs · <strong>{fInt(counts.leaves)}</strong> demandes de congé.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={onRegen} className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ background: T.primary }}><RefreshCw size={15} /> Régénérer les données de démonstration</button>
          {!confirmClear ? (
            <button onClick={() => setConfirmClear(true)} className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: T.dangerSoft, color: T.danger }}><Trash2 size={15} /> Vider la base</button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: T.dangerSoft }}>
              <span className="text-sm font-medium" style={{ color: T.danger }}>Tout supprimer ?</span>
              <button onClick={() => { onClear(); setConfirmClear(false); }} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ background: T.danger }}>Confirmer</button>
              <button onClick={() => setConfirmClear(false)} className="rounded-lg px-3 py-1.5 text-sm" style={{ border: `1px solid ${T.line}`, background: "#fff" }}>Annuler</button>
            </div>
          )}
        </div>
        <p className="text-xs mt-3" style={{ color: T.muted }}>« Vider la base » efface tous les collaborateurs et demandes en mémoire. Action immédiate et réversible via la régénération.</p>
      </div>
    </div>
  );
}
