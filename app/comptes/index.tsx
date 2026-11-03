import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { retour } from '@/src/ui/navigation';
import { Plus } from 'lucide-react-native';
import { comptesActifs, LIBELLES_TYPE_COMPTE, soldeCompte } from '@/src/domaine/comptes';
import { formatMontant } from '@/src/domaine/montant';
import type { Compte } from '@/src/domaine/types';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { Ecran } from '@/src/ui/Ecran';
import { ICONE_TYPE_COMPTE } from '@/src/ui/icones';
import { Ligne, Section } from '@/src/ui/Liste';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

export default function Comptes() {
  const t = useTheme();
  const { donnees } = useDonnees();
  const actifs = comptesActifs(donnees.comptes);
  const archives = donnees.comptes.filter((c) => c.archive);

  const ligne = (c: Compte) => (
    <Ligne
      key={c.id}
      icone={ICONE_TYPE_COMPTE[c.type]}
      couleurIcone={c.couleur}
      titre={c.nom}
      sousTitre={LIBELLES_TYPE_COMPTE[c.type] + (c.parDefaut ? ' · Par défaut' : '')}
      valeur={formatMontant(soldeCompte(c, donnees.operations))}
      onPress={() => router.push(`/comptes/${c.id}`)}
      chevron
    />
  );

  return (
    <Ecran
      titre="Comptes"
      droite={
        <Pressable accessibilityLabel="Nouveau compte" hitSlop={10} onPress={() => router.push('/comptes/nouveau')}>
          <Plus color={t.accent} size={26} />
        </Pressable>
      }
    >
      <Pressable onPress={() => retour('/plus')} style={{ paddingHorizontal: 20, marginTop: 4 }}>
        <Texte couleur={t.accent}>‹ Retour</Texte>
      </Pressable>
      {actifs.length === 0 && archives.length === 0 ? (
        <Section>
          <Ligne titre="Ajoutez votre premier compte" couleurTitre={t.accent} onPress={() => router.push('/comptes/nouveau')} />
        </Section>
      ) : (
        <Section titre="Actifs">{actifs.map(ligne)}</Section>
      )}
      {archives.length > 0 && <Section titre="Archivés">{archives.map(ligne)}</Section>}
    </Ecran>
  );
}
