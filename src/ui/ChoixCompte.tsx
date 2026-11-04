import { Check } from 'lucide-react-native';
import { comptesActifs } from '@/src/domaine/comptes';
import type { Compte } from '@/src/domaine/types';
import { ICONE_TYPE_COMPTE } from './icones';
import { Ligne, Section } from './Liste';
import { useTheme } from './theme';

interface Props {
  comptes: Compte[];
  valeur?: string;
  onChange: (compteId: string | undefined) => void;
  titre?: string;
  pied?: string;
}

/** Choix d'un compte actif, ou « Aucun » (aucun mouvement d'argent). */
export function ChoixCompte({ comptes, valeur, onChange, titre, pied }: Props) {
  const t = useTheme();
  const coche = (actif: boolean) => (actif ? <Check color={t.accent} size={20} /> : undefined);
  return (
    <Section titre={titre} pied={pied}>
      {[
        <Ligne key="aucun" titre="Aucun" onPress={() => onChange(undefined)} droite={coche(!valeur)} />,
        ...comptesActifs(comptes).map((c) => (
          <Ligne key={c.id} icone={ICONE_TYPE_COMPTE[c.type]} couleurIcone={c.couleur} titre={c.nom}
            onPress={() => onChange(c.id)} droite={coche(c.id === valeur)} />
        )),
      ]}
    </Section>
  );
}
