import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { compteParDefaut } from '@/src/domaine/comptes';
import { ajouterJours, aujourdhui } from '@/src/domaine/dates';
import { ajouterRemboursement, erreurRemboursement, resteDette } from '@/src/domaine/dettes';
import { nouvelId } from '@/src/domaine/id';
import { formatMontant, parseMontant } from '@/src/domaine/montant';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { Champ } from '@/src/ui/Champ';
import { ChoixCompte } from '@/src/ui/ChoixCompte';
import { EnTeteFeuille } from '@/src/ui/Ecran';
import { Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { Puces } from '@/src/ui/Puces';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

export default function Remboursement() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { donnees, enregistrer } = useDonnees();
  const dette = donnees.dettes.find((d) => d.id === id);
  const today = aujourdhui();
  const [texte, setTexte] = useState(dette ? formatMontant(resteDette(dette)) : '');
  const [date, setDate] = useState(today);
  const [compteId, setCompteId] = useState<string | undefined>(compteParDefaut(donnees.comptes)?.id);
  const fermer = () => retour(dette ? `/dettes/${dette.id}` : '/dettes');

  if (!dette) {
    return (
      <View style={{ flex: 1, backgroundColor: t.fond }}>
        <EnTeteFeuille titre="Remboursement" onGauche={fermer} />
        <Section pied="Cette dette n'existe plus.">{null}</Section>
      </View>
    );
  }

  const montant = parseMontant(texte);
  const erreur = erreurRemboursement(dette, montant, date);

  async function valider() {
    if (erreur || montant === null || !dette) return;
    const r = ajouterRemboursement(dette, { id: nouvelId(), date, montant, compteId, operationId: nouvelId() });
    if (r.operation) await enregistrer('operations', r.operation);
    await enregistrer('dettes', r.dette);
    fermer();
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.fond }}>
      <EnTeteFeuille titre={`Remboursement · ${dette.personne}`} onGauche={fermer} droite="OK" droiteActive={!erreur} onDroite={valider} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <Section pied={`Reste ${formatMontant(resteDette(dette))} MAD`}>
          <Champ etiquette="Montant" placeholder="0,00" value={texte} onChangeText={setTexte} keyboardType="decimal-pad" autoFocus chiffres />
          <Champ etiquette="Date" placeholder="AAAA-MM-JJ" value={date} onChangeText={setDate} chiffres />
        </Section>
        <Puces
          options={[{ valeur: today, libelle: "Aujourd'hui" }, { valeur: ajouterJours(today, -1), libelle: 'Hier' }]}
          valeur={date}
          onChange={(d) => d && setDate(d)}
        />
        <ChoixCompte
          comptes={donnees.comptes}
          valeur={compteId}
          onChange={setCompteId}
          titre={dette.sens === 'on_me_doit' ? "L'argent arrive sur" : "L'argent sort de"}
          pied="« Aucun » : le remboursement ne fait bouger aucun compte."
        />
        {texte !== '' && erreur ? (
          <Texte variante="petit" couleur={t.erreur} style={{ marginHorizontal: 32, marginTop: 12 }}>{erreur}</Texte>
        ) : null}
      </ScrollView>
    </View>
  );
}
