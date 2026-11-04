import { formatMontant } from '@/src/domaine/montant';
import { montantSigne } from '@/src/domaine/operations';
import type { Donnees, Operation } from '@/src/domaine/types';
import { Ligne } from './Liste';
import { useTheme } from './theme';

interface Props {
  operation: Operation;
  donnees: Pick<Donnees, 'comptes' | 'categories'>;
  onPress?: () => void;
}

export function LigneOperation({ operation: o, donnees, onPress }: Props) {
  const t = useTheme();
  const nomCompte = (id?: string) => donnees.comptes.find((c) => c.id === id)?.nom ?? '?';
  const details = (parties: (string | undefined)[]) =>
    [...parties, o.horsSolde ? 'Hors solde' : undefined].filter(Boolean).join(' · ');

  if (o.type === 'transfert') {
    return (
      <Ligne
        icone="arrow-left-right"
        couleurIcone="#8e8e93"
        titre={o.libelle || 'Transfert'}
        sousTitre={details([`${nomCompte(o.compteId)} → ${nomCompte(o.compteDestId)}`])}
        valeur={formatMontant(o.montant)}
        couleurValeur={t.texte2}
        onPress={onPress}
      />
    );
  }

  const categorie = donnees.categories.find((c) => c.id === o.categorieId);
  const couleur = o.horsSolde ? t.texte2 : o.type === 'revenu' ? t.succes : t.texte;
  return (
    <Ligne
      icone={categorie?.icone ?? 'ellipsis'}
      couleurIcone={categorie?.couleur ?? '#8e8e93'}
      titre={o.libelle || categorie?.nom || 'Sans catégorie'}
      sousTitre={details([o.libelle ? categorie?.nom : undefined, nomCompte(o.compteId)])}
      valeur={formatMontant(montantSigne(o), { signe: true })}
      couleurValeur={couleur}
      onPress={onPress}
    />
  );
}
