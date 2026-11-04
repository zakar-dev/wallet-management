import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LIBELLES_TYPE_COMPTE } from '@/src/domaine/comptes';
import { aujourdhui, libelleJour } from '@/src/domaine/dates';
import { formatMontant } from '@/src/domaine/montant';
import { libelleRecurrence, reactiver } from '@/src/domaine/recurrences';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { BoutonSupprimer } from '@/src/ui/BoutonSupprimer';
import { EnTeteFeuille } from '@/src/ui/Ecran';
import { IconeCarree } from '@/src/ui/IconeCarree';
import { Ligne, Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

const TYPES = { depense: 'Dépense', revenu: 'Revenu', transfert: 'Transfert' } as const;

export default function DetailRecurrence() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { donnees, enregistrer } = useDonnees();
  const r = donnees.recurrences.find((x) => x.id === id);
  const fermer = () => retour('/recurrences');

  if (!r) {
    return (
      <View style={{ flex: 1, backgroundColor: t.fond }}>
        <EnTeteFeuille titre="Récurrence" gauche="Retour" onGauche={fermer} />
        <Section pied="Cette récurrence n'existe plus.">{null}</Section>
      </View>
    );
  }

  const m = r.modele;
  const cat = donnees.categories.find((c) => c.id === m.categorieId);
  const compte = donnees.comptes.find((c) => c.id === m.compteId);
  const dest = donnees.comptes.find((c) => c.id === m.compteDestId);

  return (
    <View style={{ flex: 1, backgroundColor: t.fond }}>
      <EnTeteFeuille titre="Récurrence" gauche="Retour" onGauche={fermer} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginTop: 12, gap: 6 }}>
          <IconeCarree nom={m.type === 'transfert' ? 'arrow-left-right' : cat?.icone ?? 'repeat'}
            couleur={m.type === 'transfert' ? '#8e8e93' : cat?.couleur ?? '#bf5af2'} taille={56} />
          <Texte variante="titre">{m.libelle || cat?.nom || 'Transfert'}</Texte>
          <Texte chiffres style={{ fontSize: 28, fontWeight: '700' }}>{formatMontant(m.montant)} MAD</Texte>
        </View>
        <Section>
          <Ligne titre="Type" valeur={TYPES[m.type]} />
          {cat ? <Ligne titre="Catégorie" valeur={cat.nom} /> : null}
          <Ligne titre={m.type === 'transfert' ? 'Depuis' : 'Compte'}
            valeur={compte ? `${compte.nom} (${LIBELLES_TYPE_COMPTE[compte.type]})` : '?'} />
          {dest ? <Ligne titre="Vers" valeur={dest.nom} /> : null}
          <Ligne titre="Fréquence" valeur={libelleRecurrence(r)} />
          <Ligne titre="Prochaine" valeur={r.active ? libelleJour(r.prochaineEcheance) : 'Arrêtée'} />
        </Section>
        {r.active ? (
          <>
            <BoutonSupprimer libelle="Arrêter la récurrence" confirmation="Confirmer l'arrêt"
              onConfirmer={async () => { await enregistrer('recurrences', { ...r, active: false }); fermer(); }} />
            <Section pied="Les opérations déjà créées sont conservées.">{null}</Section>
          </>
        ) : (
          <Section pied="Reprend à la prochaine échéance, sans rattraper les mois d'arrêt.">
            <Ligne titre="Réactiver" couleurTitre={t.accent}
              onPress={() => enregistrer('recurrences', reactiver(r, aujourdhui()))} />
          </Section>
        )}
      </ScrollView>
    </View>
  );
}
