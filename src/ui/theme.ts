import { Platform, useColorScheme, type TextStyle } from 'react-native';

export interface Theme {
  fond: string; carte: string; carte2: string; texte: string; texte2: string;
  separateur: string; accent: string; succes: string; alerte: string; erreur: string;
  segmentActif: string; barre: string; sombre: boolean;
}

export const SOMBRE: Theme = {
  fond: '#000000', carte: '#1c1c1e', carte2: '#2c2c2e', texte: '#ffffff', texte2: '#8e8e93',
  separateur: '#38383a', accent: '#0a84ff', succes: '#30d158', alerte: '#ff9f0a', erreur: '#ff453a',
  segmentActif: '#636366', barre: 'rgba(22,22,24,0.82)', sombre: true,
};

export const CLAIR: Theme = {
  fond: '#f2f2f7', carte: '#ffffff', carte2: '#e5e5ea', texte: '#000000', texte2: '#6c6c70',
  separateur: '#c6c6c8', accent: '#007aff', succes: '#34c759', alerte: '#ff9500', erreur: '#ff3b30',
  segmentActif: '#ffffff', barre: 'rgba(249,249,249,0.85)', sombre: false,
};

/** Sombre par défaut ; clair seulement si le système l'est. */
export function useTheme(): Theme {
  return useColorScheme() === 'light' ? CLAIR : SOMBRE;
}

export const POLICE = Platform.select({
  web: '-apple-system, "SF Pro Text", "SF Pro Display", Inter, system-ui, sans-serif',
  default: undefined,
});

export const CHIFFRES: TextStyle = { fontVariant: ['tabular-nums'] };

/** Hauteur réservée en bas des écrans pour la barre d'onglets flottante. */
export const ESPACE_BARRE = 100;
