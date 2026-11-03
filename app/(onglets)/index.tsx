import { View } from 'react-native';
import { router } from 'expo-router';
import { comptesActifs, disponible, patrimoineNet, soldeCompte } from '@/src/domaine/comptes';
import { formatMontant } from '@/src/domaine/montant';
import { operationsRecentes } from '@/src/domaine/operations';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { CarteCompte } from '@/src/ui/CarteCompte';
import { Ecran } from '@/src/ui/Ecran';
import { LigneOperation } from '@/src/ui/LigneOperation';
import { Ligne, Section } from '@/src/ui/Liste';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

export default function Accueil() {
  const t = useTheme();
  const { donnees } = useDonnees();
  const { comptes, operations, dettes } = donnees;
  const actifs = comptesActifs(comptes);

  return (
    <Ecran titre="Accueil" onglet>
      <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
        <Texte variante="petit">Patrimoine net</Texte>
        <Texte chiffres style={{ fontSize: 34, fontWeight: '700' }}>
          {formatMontant(patrimoineNet(comptes, operations, dettes))} MAD
        </Texte>
        <Texte variante="secondaire" chiffres>
          Disponible {formatMontant(disponible(comptes, operations))} MAD
        </Texte>
      </View>

      {actifs.length === 0 ? (
        <Section>
          <Ligne titre="Ajouter un compte" icone="wallet" couleurIcone={t.accent}
            onPress={() => router.push('/comptes/nouveau')} chevron />
        </Section>
      ) : (
        <View style={{ marginTop: 22 }}>
          {actifs.map((c, i) => (
            <CarteCompte key={c.id} compte={c} solde={soldeCompte(c, operations)} empilee={i > 0}
              onPress={() => router.push(`/comptes/${c.id}`)} />
          ))}
        </View>
      )}

      {operations.length > 0 && (
        <Section
          titre="Récent"
          onPressTitre={() => router.push('/operations')}
          droiteTitre={<Texte variante="petit" couleur={t.accent}>Tout voir</Texte>}
        >
          {operationsRecentes(operations, 5).map((o) => (
            <LigneOperation key={o.id} operation={o} donnees={donnees}
              onPress={() => router.push(`/ajout?id=${o.id}`)} />
          ))}
        </Section>
      )}
    </Ecran>
  );
}
