import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../theme';
import { Cadre, echelleY, graduations } from './cadre';

interface Props {
  etiquettes: string[];
  valeurs: number[];
  couleur: string;
  selection: number;
  onSelect: (i: number) => void;
  hauteur?: number;
}

/** Courbe d'une seule série (trait 2 px), point marqué sur le mois sélectionné. */
export function Courbe({ etiquettes, valeurs, couleur, selection, onSelect, hauteur = 170 }: Props) {
  const t = useTheme();
  const lignes = graduations(Math.min(...valeurs, 0), Math.max(...valeurs, 0));
  const y = echelleY(hauteur, lignes);
  return (
    <Cadre hauteur={hauteur} lignes={lignes} etiquettes={etiquettes} selection={selection} onSelect={onSelect}>
      {(largeur) => {
        const pas = largeur / valeurs.length;
        const x = (i: number) => i * pas + pas / 2;
        const d = valeurs.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
        const v = valeurs[selection];
        return (
          <Svg width={largeur} height={hauteur}>
            <Path d={d} stroke={couleur} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {v !== undefined && (
              <Circle cx={x(selection)} cy={y(v)} r={5} fill={couleur} stroke={t.fond} strokeWidth={2} />
            )}
          </Svg>
        );
      }}
    </Cadre>
  );
}
