import { useState } from 'react';
import { Section, Ligne } from './Liste';
import { useTheme } from './theme';

/** Suppression en deux appuis : pas de boîte de dialogue système. */
export function BoutonSupprimer({ libelle, onConfirmer }: { libelle: string; onConfirmer: () => void }) {
  const t = useTheme();
  const [armé, setArmé] = useState(false);
  return (
    <Section>
      <Ligne
        titre={armé ? 'Confirmer la suppression' : libelle}
        couleurTitre={t.erreur}
        onPress={() => (armé ? onConfirmer() : setArmé(true))}
      />
    </Section>
  );
}
