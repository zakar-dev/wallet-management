import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { etatEnveloppe, resumeBudget } from '@/src/domaine/budget';
import { comptesActifs, disponible, patrimoineNet, soldeCompte } from '@/src/domaine/comptes';
import { aujourdhui, moisDe } from '@/src/domaine/dates';
import { formatMontant } from '@/src/domaine/montant';
import { operationsRecentes } from '@/src/domaine/operations';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { Anneau } from '@/src/ui/Anneau';
import { CarteCompte } from '@/src/ui/CarteCompte';
import { couleurEtat } from '@/src/ui/Jauge';
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
  const resume = resumeBudget(donnees, moisDe(aujourdhui()));
  const etat = etatEnveloppe({ report: 0, assigne: resume.budget, depense: resume.depense, reste: resume.reste });

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

      {resume.budget > 0 ? (
        <Pressable accessibilityLabel="Voir le budget" onPress={() => router.push('/budget')}
          style={{ marginHorizontal: 16, marginTop: 22, padding: 16, borderRadius: 14, backgroundColor: t.carte,
            flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <Anneau ratio={resume.ratio} couleur={couleurEtat(etat, t)} taille={96} epaisseur={10}>
            <Texte variante="petit" chiffres>{Math.round(resume.ratio * 100)} %</Texte>
          </Anneau>
          <View style={{ flex: 1 }}>
            <Texte variante="petit">Reste à dépenser ce mois</Texte>
            <Texte chiffres couleur={resume.reste < 0 ? t.erreur : t.texte} style={{ fontSize: 24, fontWeight: '700' }}>
              {formatMontant(resume.reste)} MAD
            </Texte>
            <Texte variante="petit" chiffres>
              Dépensé {formatMontant(resume.depense)} sur {formatMontant(resume.budget)}
            </Texte>
          </View>
        </Pressable>
      ) : actifs.length > 0 ? (
        <Section>
          <Ligne titre="Préparer le budget du mois" icone="hand-coins" couleurIcone={t.accent}
            onPress={() => router.push('/budget')} chevron />
        </Section>
      ) : null}

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
