import { View } from 'react-native';
import type { EtatEnveloppe } from '@/src/domaine/budget';
import { useTheme, type Theme } from './theme';

export function couleurEtat(etat: EtatEnveloppe, t: Theme): string {
  if (etat === 'depasse') return t.erreur;
  if (etat === 'alerte') return t.alerte;
  if (etat === 'ok') return t.succes;
  return t.texte2;
}

/** Barre de progression horizontale ; `ratio` entre 0 et 1. */
export function Jauge({ ratio, etat }: { ratio: number; etat: EtatEnveloppe }) {
  const t = useTheme();
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: t.carte2, overflow: 'hidden', marginTop: 6 }}>
      <View style={{ width: `${Math.round(ratio * 100)}%`, height: '100%', borderRadius: 3, backgroundColor: couleurEtat(etat, t) }} />
    </View>
  );
}
