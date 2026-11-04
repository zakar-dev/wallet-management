import { useState } from 'react';
import { ScrollView, Switch, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { compteParDefaut, comptesActifs } from '@/src/domaine/comptes';
import { ajouterJours, aujourdhui } from '@/src/domaine/dates';
import { nouvelId } from '@/src/domaine/id';
import { formatMontant, parseMontant } from '@/src/domaine/montant';
import {
  erreurOperation, horsSoldeSelonDate, versBrouillon, versOperation, type Brouillon,
} from '@/src/domaine/operations';
import { creerRecurrence, libelleRecurrence, parseJour } from '@/src/domaine/recurrences';
import type { TypeOperation } from '@/src/domaine/types';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { BoutonSupprimer } from '@/src/ui/BoutonSupprimer';
import { Champ } from '@/src/ui/Champ';
import { EnTeteFeuille } from '@/src/ui/Ecran';
import { ICONE_TYPE_COMPTE } from '@/src/ui/icones';
import { Ligne, Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { Puces } from '@/src/ui/Puces';
import { Segment } from '@/src/ui/Segment';
import { SelecteurCategorie } from '@/src/ui/SelecteurCategorie';
import { Texte } from '@/src/ui/Texte';
import { CHIFFRES, POLICE, useTheme } from '@/src/ui/theme';

const TYPES: { valeur: TypeOperation; libelle: string }[] = [
  { valeur: 'depense', libelle: 'Dépense' },
  { valeur: 'revenu', libelle: 'Revenu' },
  { valeur: 'transfert', libelle: 'Transfert' },
];

type Ouvert = 'categorie' | 'compte' | 'dest' | null;

export default function Ajout() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { donnees, enregistrer, supprimer } = useDonnees();
  const existante = donnees.operations.find((o) => o.id === id);
  const comptes = comptesActifs(donnees.comptes);

  const [b, setB] = useState<Brouillon>(() => existante ? versBrouillon(existante) : {
    type: 'depense', montant: null, compteId: compteParDefaut(donnees.comptes)?.id, date: aujourdhui(), libelle: '', horsSolde: false,
  });
  const [montantTexte, setMontantTexte] = useState(existante ? formatMontant(existante.montant) : '');
  const [ouvert, setOuvert] = useState<Ouvert>(null);
  // « Déjà incluse dans le solde » suit la date tant que l'utilisateur n'y a pas touché.
  const [horsSoldeTouche, setHorsSoldeTouche] = useState(Boolean(existante));
  const [recurrente, setRecurrente] = useState(false);
  const [jourTexte, setJourTexte] = useState('');
  const recurrence = donnees.recurrences.find((r) => r.id === existante?.recurrenceId);

  const brouillon: Brouillon = { ...b, montant: parseMontant(montantTexte) };
  const jour = parseJour(jourTexte);
  const erreur = erreurOperation(brouillon) ?? (recurrente && jour === null ? 'Jour du mois entre 1 et 31' : null);
  const maj = (p: Partial<Brouillon>) => setB((x) => ({ ...x, ...p }));
  const fermer = () => retour('/');
  const changerDate = (date: string) => setB((x) => ({
    ...x, date, horsSolde: horsSoldeTouche ? x.horsSolde : horsSoldeSelonDate(date, aujourdhui()),
  }));

  async function valider() {
    if (erreur) return;
    let op = versOperation(brouillon, existante?.id ?? nouvelId());
    if (recurrente && jour !== null) {
      const rec = creerRecurrence(op, jour, nouvelId(), aujourdhui());
      op = { ...op, recurrenceId: rec.id };
      await enregistrer('recurrences', rec);
    }
    await enregistrer('operations', op);
    fermer();
  }

  async function effacer() {
    if (!existante) return;
    await supprimer('operations', existante.id);
    fermer();
  }

  if (donnees.comptes.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: t.fond }}>
        <EnTeteFeuille titre="Nouvelle opération" onGauche={fermer} />
        <Section pied="Une opération se rattache toujours à un compte.">
          <Ligne titre="Créez d'abord un compte" couleurTitre={t.accent} chevron
            onPress={() => router.replace('/comptes/nouveau')} />
        </Section>
      </View>
    );
  }

  if (existante?.detteId) {
    const detteId = existante.detteId;
    return (
      <View style={{ flex: 1, backgroundColor: t.fond }}>
        <EnTeteFeuille titre={existante.libelle || 'Mouvement'} gauche="Retour" onGauche={fermer} />
        <Section pied="Ce mouvement appartient à une dette : modifiez ou supprimez-le depuis la dette.">
          <Ligne titre="Voir la dette" icone="hand-coins" couleurIcone="#ff375f" chevron
            onPress={() => router.replace(`/dettes/${detteId}`)} />
        </Section>
      </View>
    );
  }

  const nomCompte = (cid?: string) => donnees.comptes.find((c) => c.id === cid)?.nom ?? 'Choisir';
  const categorie = donnees.categories.find((c) => c.id === b.categorieId);
  const today = aujourdhui();

  const listeComptes = (valeur: string | undefined, choisir: (cid: string) => void) =>
    comptes.map((c) => (
      <Ligne key={c.id} icone={ICONE_TYPE_COMPTE[c.type]} couleurIcone={c.couleur} titre={c.nom}
        onPress={() => { choisir(c.id); setOuvert(null); }}
        droite={c.id === valeur ? <Check color={t.accent} size={20} /> : undefined} />
    ));

  return (
    <View style={{ flex: 1, backgroundColor: t.fond }}>
      <EnTeteFeuille
        titre={existante ? 'Modifier' : 'Nouvelle opération'}
        onGauche={fermer}
        droite="OK"
        droiteActive={!erreur}
        onDroite={valider}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <Segment options={TYPES} valeur={b.type}
          onChange={(type) => { maj({ type, categorieId: undefined }); setOuvert(null); }} />

        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 24, gap: 8 }}>
          <TextInput
            accessibilityLabel="Montant"
            value={montantTexte}
            onChangeText={setMontantTexte}
            placeholder="0,00"
            placeholderTextColor={t.texte2}
            keyboardType="decimal-pad"
            autoFocus={!existante}
            style={[{
              fontSize: 52, fontWeight: '700', color: t.texte, fontFamily: POLICE, textAlign: 'center',
              minWidth: 120, maxWidth: 280, outlineStyle: 'none',
            } as object, CHIFFRES]}
          />
          <Texte variante="titre" couleur={t.texte2}>MAD</Texte>
        </View>

        <Section>
          {b.type !== 'transfert' ? (
            <Ligne titre="Catégorie" icone={categorie?.icone ?? 'tag'} couleurIcone={categorie?.couleur}
              valeur={categorie?.nom ?? 'Choisir'} couleurValeur={categorie ? t.texte : t.accent}
              onPress={() => setOuvert(ouvert === 'categorie' ? null : 'categorie')} chevron />
          ) : null}
          <Ligne titre={b.type === 'transfert' ? 'Depuis' : 'Compte'} icone="wallet" couleurIcone="#0a84ff"
            valeur={nomCompte(b.compteId)} onPress={() => setOuvert(ouvert === 'compte' ? null : 'compte')} chevron />
          {b.type === 'transfert' ? (
            <Ligne titre="Vers" icone="arrow-left-right" couleurIcone="#8e8e93"
              valeur={nomCompte(b.compteDestId)} couleurValeur={b.compteDestId ? t.texte : t.accent}
              onPress={() => setOuvert(ouvert === 'dest' ? null : 'dest')} chevron />
          ) : null}
        </Section>

        {ouvert === 'categorie' && b.type !== 'transfert' && (
          <SelecteurCategorie nature={b.type} valeur={b.categorieId}
            onChange={(categorieId) => { maj({ categorieId }); setOuvert(null); }} />
        )}
        {ouvert === 'compte' && (
          <Section titre="Compte">{listeComptes(b.compteId, (compteId) => maj({ compteId }))}</Section>
        )}
        {ouvert === 'dest' && (
          <Section titre="Vers">{listeComptes(b.compteDestId, (compteDestId) => maj({ compteDestId }))}</Section>
        )}

        <Section>
          <Champ etiquette="Date" value={b.date} onChangeText={changerDate} placeholder="AAAA-MM-JJ" chiffres />
          <Champ etiquette="Libellé" value={b.libelle} onChangeText={(libelle) => maj({ libelle })}
            placeholder="Facultatif" />
        </Section>
        <Puces
          options={[{ valeur: today, libelle: "Aujourd'hui" }, { valeur: ajouterJours(today, -1), libelle: 'Hier' }]}
          valeur={b.date}
          onChange={(date) => date && changerDate(date)}
        />

        <Section pied={b.horsSolde ? "Opération historique : elle n'est comptée ni dans les soldes ni dans les totaux." : undefined}>
          <Ligne titre="Déjà incluse dans le solde" droite={
            <Switch value={b.horsSolde} onValueChange={(v) => { setHorsSoldeTouche(true); maj({ horsSolde: v }); }} />
          } />
        </Section>

        {recurrence ? (
          <Section>
            <Ligne titre="Récurrente" icone="repeat" couleurIcone="#bf5af2" valeur={libelleRecurrence(recurrence)}
              chevron onPress={() => router.push(`/recurrences/${recurrence.id}`)} />
          </Section>
        ) : (
          <Section pied={recurrente && jour !== null ? `Créée automatiquement ${libelleRecurrence({ jour })}.` : undefined}>
            <Ligne titre="Récurrente chaque mois" icone="repeat" couleurIcone="#bf5af2" droite={
              <Switch value={recurrente} onValueChange={(v) => {
                setRecurrente(v);
                if (v && !jourTexte) setJourTexte(String(Number(b.date.slice(8, 10)) || 1));
              }} />
            } />
            {recurrente ? (
              <Champ etiquette="Jour du mois" value={jourTexte} onChangeText={setJourTexte}
                keyboardType="number-pad" placeholder="1 à 31" chiffres />
            ) : null}
          </Section>
        )}

        {montantTexte !== '' && erreur && (
          <Texte variante="petit" couleur={t.erreur} style={{ marginHorizontal: 32, marginTop: 14 }}>{erreur}</Texte>
        )}

        {existante && <BoutonSupprimer libelle="Supprimer l'opération" onConfirmer={effacer} />}
      </ScrollView>
    </View>
  );
}
