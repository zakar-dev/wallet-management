import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Texte } from './Texte';
import { ESPACE_BARRE, useTheme } from './theme';

interface Props {
  titre?: string;
  droite?: ReactNode;
  children: ReactNode;
  /** Écran d'onglet : réserve la place de la barre d'onglets. */
  onglet?: boolean;
}

/** Écran à grand titre façon iOS. */
export function Ecran({ titre, droite, children, onglet }: Props) {
  const t = useTheme();
  const marges = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.fond }}
      contentContainerStyle={{ paddingTop: marges.top + 8, paddingBottom: (onglet ? ESPACE_BARRE : 32) + marges.bottom }}
      keyboardShouldPersistTaps="handled"
    >
      {(titre || droite) && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, minHeight: 41 }}>
          <Texte variante="grandTitre">{titre}</Texte>
          {droite}
        </View>
      )}
      {children}
    </ScrollView>
  );
}

interface EnTeteProps {
  titre: string;
  gauche?: string;
  onGauche?: () => void;
  droite?: string;
  onDroite?: () => void;
  droiteActive?: boolean;
}

/** En-tête de feuille modale : Annuler / Titre / OK. */
export function EnTeteFeuille({ titre, gauche = 'Annuler', onGauche, droite, onDroite, droiteActive = true }: EnTeteProps) {
  const t = useTheme();
  const marges = useSafeAreaInsets();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingTop: marges.top + 12, paddingHorizontal: 16, paddingBottom: 8,
    }}>
      <Pressable onPress={onGauche} hitSlop={10} style={{ minWidth: 70 }}>
        <Texte couleur={t.accent}>{gauche}</Texte>
      </Pressable>
      <Texte variante="titre">{titre}</Texte>
      <Pressable onPress={onDroite} disabled={!droiteActive} hitSlop={10} style={{ minWidth: 70, alignItems: 'flex-end' }}>
        {droite && (
          <Texte couleur={droiteActive ? t.accent : t.texte2} style={{ fontWeight: '600' }}>{droite}</Texte>
        )}
      </Pressable>
    </View>
  );
}
