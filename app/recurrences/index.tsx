import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { libelleJour } from '@/src/domaine/dates';
import { formatMontant } from '@/src/domaine/montant';
import { libelleRecurrence, trierRecurrences } from '@/src/domaine/recurrences';
import type { Recurrence } from '@/src/domaine/types';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { Ecran } from '@/src/ui/Ecran';
import { Ligne, Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

export default function Recurrences() {
  const t = useTheme();
  const { donnees } = useDonnees();
  const recs = trierRecurrences(donnees.recurrences);
  const actives = recs.filter((r) => r.active);
  const arretees = recs.filter((r) => !r.active);

  const ligne = (r: Recurrence) => {
    const cat = donnees.categories.find((c) => c.id === r.modele.categorieId);
    const transfert = r.modele.type === 'transfert';
    return (
      <Ligne
        key={r.id}
        icone={transfert ? 'arrow-left-right' : cat?.icone ?? 'repeat'}
        couleurIcone={transfert ? '#8e8e93' : cat?.couleur ?? '#bf5af2'}
        titre={r.modele.libelle || cat?.nom || 'Transfert'}
        sousTitre={r.active
          ? `${libelleRecurrence(r)} · prochaine : ${libelleJour(r.prochaineEcheance)}`
          : `${libelleRecurrence(r)} · arrêtée`}
        valeur={formatMontant(r.modele.montant)}
        couleurValeur={r.modele.type === 'revenu' ? t.succes : t.texte2}
        onPress={() => router.push(`/recurrences/${r.id}`)}
        chevron
      />
    );
  };

  return (
    <Ecran titre="Récurrents">
      <Pressable onPress={() => retour('/plus')} style={{ paddingHorizontal: 20, marginTop: 4 }}>
        <Texte couleur={t.accent}>‹ Retour</Texte>
      </Pressable>
      {recs.length === 0 ? (
        <Section pied="Activez « Récurrente chaque mois » en ajoutant une opération : elle sera créée automatiquement chaque mois.">
          {null}
        </Section>
      ) : null}
      {actives.length > 0 && <Section titre="Actives">{actives.map(ligne)}</Section>}
      {arretees.length > 0 && <Section titre="Arrêtées">{arretees.map(ligne)}</Section>}
    </Ecran>
  );
}
