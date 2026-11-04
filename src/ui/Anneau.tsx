import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from './theme';

interface Props {
  /** Part consommée, entre 0 et 1. */
  ratio: number;
  couleur: string;
  taille?: number;
  epaisseur?: number;
  children?: ReactNode;
}

/** Anneau de progression (SVG), contenu centré. */
export function Anneau({ ratio, couleur, taille = 120, epaisseur = 12, children }: Props) {
  const t = useTheme();
  const r = (taille - epaisseur) / 2;
  const perimetre = 2 * Math.PI * r;
  return (
    <View style={{ width: taille, height: taille, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={taille} height={taille} style={{ position: 'absolute' }}>
        <Circle cx={taille / 2} cy={taille / 2} r={r} stroke={t.carte2} strokeWidth={epaisseur} fill="none" />
        <Circle
          cx={taille / 2} cy={taille / 2} r={r} stroke={couleur} strokeWidth={epaisseur} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${perimetre} ${perimetre}`}
          strokeDashoffset={perimetre * (1 - Math.max(0, Math.min(1, ratio)))}
          transform={`rotate(-90 ${taille / 2} ${taille / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
