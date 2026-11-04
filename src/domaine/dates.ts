export type DateISO = string; // AAAA-MM-JJ
export type Mois = string; // AAAA-MM

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
  'septembre', 'octobre', 'novembre', 'décembre'];

const p2 = (n: number) => String(n).padStart(2, '0');
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const decouper = (date: DateISO) => date.split('-').map(Number);

export function aujourdhui(d: Date = new Date()): DateISO {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

export function ajouterJours(date: DateISO, n: number): DateISO {
  const [a, m, j] = decouper(date);
  return aujourdhui(new Date(a, m - 1, j + n));
}

export function moisDe(date: DateISO): Mois {
  return date.slice(0, 7);
}

export function ajouterMois(mois: Mois, n: number): Mois {
  const [a, m] = decouper(mois);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${p2((total % 12) + 1)}`;
}

export function joursDansMois(mois: Mois): number {
  const [a, m] = decouper(mois);
  return new Date(a, m, 0).getDate();
}

export function libelleJour(date: DateISO, ref: DateISO = aujourdhui()): string {
  if (date === ref) return "Aujourd'hui";
  if (date === ajouterJours(ref, -1)) return 'Hier';
  const [a, m, j] = decouper(date);
  const jour = JOURS[new Date(a, m - 1, j).getDay()];
  const annee = a === decouper(ref)[0] ? '' : ` ${a}`;
  return majuscule(`${jour} ${j} ${MOIS[m - 1]}${annee}`);
}

export function libelleMois(mois: Mois): string {
  const [a, m] = decouper(mois);
  return majuscule(`${MOIS[m - 1]} ${a}`);
}

export function estDateValide(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [a, m, j] = decouper(s);
  return aujourdhui(new Date(a, m - 1, j)) === s;
}

/** Le `jour` du mois, ramené au dernier jour si le mois est plus court (31 → 30 avril). */
export function dateDuMois(mois: Mois, jour: number): DateISO {
  return `${mois}-${p2(Math.min(jour, joursDansMois(mois)))}`;
}

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** « nov. » : étiquettes d'axe. */
export function libelleMoisCourt(mois: Mois): string {
  return MOIS_COURTS[Number(mois.slice(5, 7)) - 1];
}

/** Nombre de jours de `debut` à `fin` (négatif si `fin` est avant). */
export function joursEntre(debut: DateISO, fin: DateISO): number {
  const utc = (d: DateISO) => { const [a, m, j] = decouper(d); return Date.UTC(a, m - 1, j); };
  return Math.round((utc(fin) - utc(debut)) / 86400000);
}
