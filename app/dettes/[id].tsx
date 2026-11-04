import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { compteParDefaut } from '@/src/domaine/comptes';
import { ajouterJours, aujourdhui, libelleJour } from '@/src/domaine/dates';
import {
  creerDette, erreurDette, estSoldee, operationsDeDette, resteDette, retirerRemboursement,
} from '@/src/domaine/dettes';
import { nouvelId } from '@/src/domaine/id';
import { formatMontant, parseMontant } from '@/src/domaine/montant';
import type { Dette, SensDette } from '@/src/domaine/types';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { BoutonSupprimer } from '@/src/ui/BoutonSupprimer';
import { Champ } from '@/src/ui/Champ';
import { ChoixCompte } from '@/src/ui/ChoixCompte';
import { EnTeteFeuille } from '@/src/ui/Ecran';
import { Ligne, Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { Puces } from '@/src/ui/Puces';
import { Segment } from '@/src/ui/Segment';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

const SENS: { valeur: SensDette; libelle: string }[] = [
  { valeur: 'on_me_doit', libelle: 'On me doit' },
  { valeur: 'je_dois', libelle: 'Je dois' },
];

export default function EcranDette() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { donnees } = useDonnees();
  const dette = donnees.dettes.find((d) => d.id === id);
  return dette ? <DetailDette dette={dette} /> : <NouvelleDette />;
}

function NouvelleDette() {
  const t = useTheme();
  const { donnees, enregistrer } = useDonnees();
  const today = aujourdhui();
  const [personne, setPersonne] = useState('');
  const [sens, setSens] = useState<SensDette>('on_me_doit');
  const [texte, setTexte] = useState('');
  const [date, setDate] = useState(today);
  const [compteId, setCompteId] = useState<string | undefined>(compteParDefaut(donnees.comptes)?.id);

  const montant = parseMontant(texte);
  const erreur = erreurDette({ personne, montant, date });
  const fermer = () => retour('/dettes');

  async function valider() {
    if (erreur || montant === null) return;
    const r = creerDette({ id: nouvelId(), personne, sens, montant, date, compteId, operationId: nouvelId() });
    if (r.operation) await enregistrer('operations', r.operation);
    await enregistrer('dettes', r.dette);
    fermer();
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.fond }}>
      <EnTeteFeuille titre="Nouvelle dette" onGauche={fermer} droite="OK" droiteActive={!erreur} onDroite={valider} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <Segment options={SENS} valeur={sens} onChange={setSens} />
        <Section>
          <Champ placeholder="Personne" value={personne} onChangeText={setPersonne} autoFocus />
          <Champ etiquette="Montant" placeholder="0,00" value={texte} onChangeText={setTexte} keyboardType="decimal-pad" chiffres />
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
          titre={sens === 'on_me_doit' ? "L'argent sort de" : "L'argent arrive sur"}
          pied="Choisissez « Aucun » pour une dette ancienne déjà reflétée dans vos soldes."
        />
        {(personne || texte) && erreur ? (
          <Texte variante="petit" couleur={t.erreur} style={{ marginHorizontal: 32, marginTop: 12 }}>{erreur}</Texte>
        ) : null}
      </ScrollView>
    </View>
  );
}

function DetailDette({ dette }: { dette: Dette }) {
  const t = useTheme();
  const { donnees, enregistrer, supprimer } = useDonnees();
  const [arme, setArme] = useState<string | null>(null);
  const fermer = () => retour('/dettes');
  const reste = resteDette(dette);
  const mouvements = operationsDeDette(dette);

  async function supprimerRemboursement(rid: string) {
    const r = retirerRemboursement(dette, rid);
    if (r.operationId) await supprimer('operations', r.operationId);
    await enregistrer('dettes', r.dette);
    setArme(null);
  }

  async function effacer() {
    for (const oid of mouvements) await supprimer('operations', oid);
    await supprimer('dettes', dette.id);
    fermer();
  }

  const nomCompte = (oid?: string) => {
    const op = donnees.operations.find((o) => o.id === oid);
    return op ? donnees.comptes.find((c) => c.id === op.compteId)?.nom : undefined;
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.fond }}>
      <EnTeteFeuille titre={dette.personne} gauche="Retour" onGauche={fermer} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginTop: 12, gap: 4 }}>
          <Texte variante="petit">{dette.sens === 'on_me_doit' ? `${dette.personne} vous doit` : `Vous devez à ${dette.personne}`}</Texte>
          <Texte chiffres couleur={estSoldee(dette) ? t.texte2 : dette.sens === 'on_me_doit' ? t.succes : t.erreur}
            style={{ fontSize: 30, fontWeight: '700' }}>
            {estSoldee(dette) ? 'Soldée' : `${formatMontant(reste)} MAD`}
          </Texte>
          <Texte variante="petit" chiffres>
            sur {formatMontant(dette.montant)} MAD · {libelleJour(dette.date)}
            {nomCompte(dette.operationId) ? ` · ${nomCompte(dette.operationId)}` : ''}
          </Texte>
        </View>

        <Section titre="Remboursements" pied={dette.remboursements.length > 0 ? 'Touchez deux fois un remboursement pour le supprimer.' : undefined}>
          {[
            ...dette.remboursements.map((r) => (
              <Ligne
                key={r.id}
                titre={arme === r.id ? 'Confirmer la suppression' : libelleJour(r.date)}
                couleurTitre={arme === r.id ? t.erreur : undefined}
                sousTitre={nomCompte(r.operationId)}
                valeur={formatMontant(r.montant)}
                onPress={() => (arme === r.id ? supprimerRemboursement(r.id) : setArme(r.id))}
              />
            )),
            ...(estSoldee(dette) ? [] : [
              <Ligne key="ajouter" titre="Ajouter un remboursement" couleurTitre={t.accent}
                onPress={() => router.push(`/dettes/remboursement?id=${dette.id}`)} />,
            ]),
          ]}
        </Section>

        <BoutonSupprimer libelle="Supprimer la dette" onConfirmer={effacer} />
        {mouvements.length > 0 ? (
          <Section pied={`Supprime aussi ${mouvements.length === 1 ? 'le mouvement créé' : `les ${mouvements.length} mouvements créés`} sur vos comptes.`}>
            {null}
          </Section>
        ) : null}
      </ScrollView>
    </View>
  );
}
