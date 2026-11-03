import { Children, isValidElement, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { IconeCarree } from './IconeCarree';
import { Texte } from './Texte';
import { useTheme } from './theme';

interface SectionProps {
  titre?: string;
  droiteTitre?: ReactNode;
  onPressTitre?: () => void;
  pied?: string;
  children: ReactNode;
}

/** Liste groupée iOS : fond carte, coins arrondis, séparateurs entre les lignes. */
export function Section({ titre, droiteTitre, onPressTitre, pied, children }: SectionProps) {
  const t = useTheme();
  const enfants = Children.toArray(children).filter(isValidElement);
  return (
    <View style={{ marginHorizontal: 16, marginTop: 22 }}>
      {(titre || droiteTitre) && (
        <Pressable onPress={onPressTitre} disabled={!onPressTitre}
          style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 7 }}>
          <Texte variante="petit" style={{ textTransform: 'uppercase' }}>{titre}</Texte>
          {droiteTitre}
        </Pressable>
      )}
      {enfants.length > 0 && (
        <View style={{ backgroundColor: t.carte, borderRadius: 12, overflow: 'hidden' }}>
          {enfants.map((enfant, i) => {
            const avecIcone = Boolean((enfant.props as { icone?: string }).icone);
            return (
              <View key={enfant.key ?? i}>
                {i > 0 && (
                  <View style={{ height: 0.5, backgroundColor: t.separateur, marginLeft: avecIcone ? 56 : 16 }} />
                )}
                {enfant}
              </View>
            );
          })}
        </View>
      )}
      {pied && <Texte variante="petit" style={{ paddingHorizontal: 16, marginTop: 7 }}>{pied}</Texte>}
    </View>
  );
}

interface LigneProps {
  titre: string;
  sousTitre?: string;
  icone?: string;
  couleurIcone?: string;
  valeur?: string;
  couleurValeur?: string;
  couleurTitre?: string;
  onPress?: () => void;
  chevron?: boolean;
  droite?: ReactNode;
  desactivee?: boolean;
}

export function Ligne({
  titre, sousTitre, icone, couleurIcone, valeur, couleurValeur, couleurTitre, onPress, chevron, droite, desactivee,
}: LigneProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || desactivee}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingVertical: 8,
        paddingHorizontal: 16, gap: 12, opacity: desactivee ? 0.4 : 1,
        backgroundColor: pressed ? t.carte2 : 'transparent',
      })}
    >
      {icone && <IconeCarree nom={icone} couleur={couleurIcone ?? t.texte2} />}
      <View style={{ flex: 1 }}>
        <Texte numberOfLines={1} couleur={couleurTitre}>{titre}</Texte>
        {sousTitre ? <Texte variante="petit" numberOfLines={1}>{sousTitre}</Texte> : null}
      </View>
      {valeur !== undefined && (
        <Texte variante="montant" couleur={couleurValeur ?? t.texte2}>{valeur}</Texte>
      )}
      {droite}
      {chevron && <ChevronRight color={t.texte2} size={18} />}
    </Pressable>
  );
}
