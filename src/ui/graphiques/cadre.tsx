import { useState, type ReactNode } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import { formatMontantCourt } from '@/src/domaine/montant';
import { Texte } from '../Texte';
import { useTheme } from '../theme';

export const MARGE_GAUCHE = 40;
export const MARGE_HAUT = 8;
export const HAUTEUR_AXE_X = 22;

/** Graduations « rondes » couvrant [min, max] (3 à 5 lignes). */
export function graduations(min: number, max: number): number[] {
  const bas = Math.min(0, min);
  const haut = Math.max(max, bas + 100000);
  const brut = (haut - bas) / 3;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const pas = [1, 2, 2.5, 5, 10].map((m) => m * puissance).find((p) => p >= brut) ?? brut;
  const debut = Math.floor(bas / pas) * pas;
  const lignes: number[] = [];
  for (let v = debut; v <= haut + pas * 0.001; v += pas) lignes.push(Math.round(v));
  if (lignes[lignes.length - 1] < haut) lignes.push(lignes[lignes.length - 1] + pas);
  return lignes;
}

interface CadreProps {
  hauteur: number;
  lignes: number[];
  etiquettes: string[];
  selection: number;
  onSelect: (i: number) => void;
  /** Dessin SVG du graphique, en fonction de la largeur disponible pour la zone de tracé. */
  children: (largeurTrace: number) => ReactNode;
}

/**
 * Cadre commun : grille discrète avec graduations à gauche, mois en bas,
 * colonnes tactiles (cible plus large que la marque) pour sélectionner un mois.
 */
export function Cadre({ hauteur, lignes, etiquettes, selection, onSelect, children }: CadreProps) {
  const t = useTheme();
  const [largeur, setLargeur] = useState(0);
  const trace = Math.max(0, largeur - MARGE_GAUCHE);
  const n = etiquettes.length;
  const min = lignes[0];
  const max = lignes[lignes.length - 1];
  const y = (v: number) => MARGE_HAUT + (hauteur - MARGE_HAUT) * (1 - (v - min) / (max - min || 1));

  return (
    <View onLayout={(e: LayoutChangeEvent) => setLargeur(e.nativeEvent.layout.width)} style={{ marginHorizontal: 16, marginTop: 8 }}>
      <View style={{ height: hauteur }}>
        {lignes.map((v) => (
          <View key={v} style={{ position: 'absolute', left: 0, right: 0, top: y(v) - 8, flexDirection: 'row', alignItems: 'center' }}>
            <Texte variante="petit" chiffres style={{ width: MARGE_GAUCHE - 6, fontSize: 11, textAlign: 'right', marginRight: 6 }}>
              {formatMontantCourt(v)}
            </Texte>
            <View style={{ flex: 1, height: 1, backgroundColor: t.separateur, opacity: v === 0 ? 1 : 0.5 }} />
          </View>
        ))}
        <View pointerEvents="none" style={{ position: 'absolute', left: MARGE_GAUCHE, top: 0, right: 0, bottom: 0, flexDirection: 'row' }}>
          {etiquettes.map((_, i) => (
            <View key={i} style={{ flex: 1, borderRadius: 6, backgroundColor: i === selection ? t.carte2 : 'transparent', opacity: 0.6 }} />
          ))}
        </View>
        {largeur > 0 && <View pointerEvents="none" style={{ position: 'absolute', left: MARGE_GAUCHE, top: 0 }}>{children(trace)}</View>}
        <View style={{ position: 'absolute', left: MARGE_GAUCHE, top: 0, right: 0, bottom: 0, flexDirection: 'row' }}>
          {etiquettes.map((e, i) => (
            <Pressable key={i} accessibilityRole="button" accessibilityLabel={`Sélectionner ${e}`}
              onPress={() => onSelect(i)} style={{ flex: 1 }} />
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginLeft: MARGE_GAUCHE, height: HAUTEUR_AXE_X, alignItems: 'center' }}>
        {etiquettes.map((e, i) => (
          <Texte key={i} variante="petit" couleur={i === selection ? t.texte : t.texte2}
            style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: i === selection ? '600' : '400' }}>
            {n > 8 && (n - 1 - i) % 2 === 1 && i !== selection ? '' : e}
          </Texte>
        ))}
      </View>
    </View>
  );
}

/** Position verticale d'une valeur dans la zone de tracé. */
export function echelleY(hauteur: number, lignes: number[]) {
  const min = lignes[0];
  const max = lignes[lignes.length - 1];
  return (v: number) => MARGE_HAUT + (hauteur - MARGE_HAUT) * (1 - (v - min) / (max - min || 1));
}

/** Légende : pastille + nom, toujours présente dès deux séries. */
export function Legende({ series }: { series: { nom: string; couleur: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 16, marginHorizontal: 16, marginTop: 14 }}>
      {series.map((s) => (
        <View key={s.nom} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.couleur }} />
          <Texte variante="petit">{s.nom}</Texte>
        </View>
      ))}
    </View>
  );
}
