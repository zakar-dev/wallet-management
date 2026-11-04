import Svg, { Path } from 'react-native-svg';
import { Cadre, echelleY, graduations } from './cadre';

export interface Serie { nom: string; couleur: string; valeurs: number[] }

interface Props {
  etiquettes: string[];
  series: Serie[];
  selection: number;
  onSelect: (i: number) => void;
  hauteur?: number;
}

/** Barre à extrémité arrondie (4 px) côté données, ancrée à la ligne de base. */
function cheminBarre(x: number, largeur: number, yBase: number, yValeur: number): string {
  const haut = Math.min(yBase, yValeur);
  const bas = Math.max(yBase, yValeur);
  const h = bas - haut;
  if (h < 0.5) return '';
  const r = Math.min(4, h, largeur / 2);
  if (yValeur <= yBase) {
    return `M${x},${bas} L${x},${haut + r} Q${x},${haut} ${x + r},${haut} L${x + largeur - r},${haut} Q${x + largeur},${haut} ${x + largeur},${haut + r} L${x + largeur},${bas} Z`;
  }
  return `M${x},${haut} L${x + largeur},${haut} L${x + largeur},${bas - r} Q${x + largeur},${bas} ${x + largeur - r},${bas} L${x + r},${bas} Q${x},${bas} ${x},${bas - r} Z`;
}

/** Barres groupées par mois (ex. revenus et dépenses), 2 px d'écart entre barres voisines. */
export function BarresGroupees({ etiquettes, series, selection, onSelect, hauteur = 170 }: Props) {
  const toutes = series.flatMap((s) => s.valeurs);
  const lignes = graduations(Math.min(0, ...toutes), Math.max(0, ...toutes));
  const y = echelleY(hauteur, lignes);
  return (
    <Cadre hauteur={hauteur} lignes={lignes} etiquettes={etiquettes} selection={selection} onSelect={onSelect}>
      {(largeur) => {
        const groupe = largeur / etiquettes.length;
        const k = series.length;
        const barre = Math.max(3, Math.min(14, (groupe * 0.6 - 2 * (k - 1)) / k));
        const debut = (groupe - (barre * k + 2 * (k - 1))) / 2;
        return (
          <Svg width={largeur} height={hauteur}>
            {etiquettes.map((_, i) => series.map((s, j) => {
              const d = cheminBarre(i * groupe + debut + j * (barre + 2), barre, y(0), y(s.valeurs[i] ?? 0));
              return d ? <Path key={`${i}-${j}`} d={d} fill={s.couleur} /> : null;
            }))}
          </Svg>
        );
      }}
    </Cadre>
  );
}
