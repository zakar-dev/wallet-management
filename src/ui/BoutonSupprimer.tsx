import { useState } from 'react';
import { Section, Ligne } from './Liste';
import { useTheme } from './theme';

interface Props {
  libelle: string;
  onConfirmer: () => void;
  confirmation?: string;
}

/** Action destructive en deux appuis : pas de boîte de dialogue système. */
export function BoutonSupprimer({ libelle, onConfirmer, confirmation = 'Confirmer la suppression' }: Props) {
  const t = useTheme();
  const [armé, setArmé] = useState(false);
  return (
    <Section>
      <Ligne
        titre={armé ? confirmation : libelle}
        couleurTitre={t.erreur}
        onPress={() => (armé ? onConfirmer() : setArmé(true))}
      />
    </Section>
  );
}
