export type Centimes = number;

const ESPACE = ' ';
const MOINS = '−';

export function formatMontant(c: Centimes, opts: { signe?: boolean } = {}): string {
  const abs = Math.abs(c);
  const entiers = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ESPACE);
  const texte = `${entiers},${String(abs % 100).padStart(2, '0')}`;
  if (c < 0) return MOINS + texte;
  if (opts.signe && c > 0) return '+' + texte;
  return texte;
}

export function parseMontant(saisie: string): Centimes | null {
  const propre = saisie.replace(/[\s  ]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(propre)) return null;
  const [entiers, decimales = ''] = propre.split('.');
  return Number(entiers) * 100 + Number(decimales.padEnd(2, '0'));
}

/** Montant arrondi pour les axes de graphique : « 850 », « 9 k », « 9,5 k » (en MAD). */
export function formatMontantCourt(c: Centimes): string {
  const mad = Math.abs(c) / 100;
  const signe = c < 0 ? MOINS : '';
  if (mad < 1000) return signe + String(Math.round(mad));
  const k = Math.round(mad / 100) / 10;
  return `${signe}${String(k).replace('.', ',')} k`;
}
