import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { libelleJour } from '@/src/domaine/dates';
import { estSoldee, resteDette, totauxDettes, trierDettes } from '@/src/domaine/dettes';
import { formatMontant } from '@/src/domaine/montant';
import type { Dette } from '@/src/domaine/types';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { Ecran } from '@/src/ui/Ecran';
import { Ligne, Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

export default function Dettes() {
  const t = useTheme();
  const { donnees } = useDonnees();
  const dettes = trierDettes(donnees.dettes);
  const enCours = dettes.filter((d) => !estSoldee(d));
  const soldees = dettes.filter(estSoldee);
  const totaux = totauxDettes(donnees.dettes);

  const ligne = (d: Dette) => (
    <Ligne
      key={d.id}
      icone="hand-coins"
      couleurIcone={d.sens === 'on_me_doit' ? t.succes : t.erreur}
      titre={d.personne}
      sousTitre={`${d.sens === 'on_me_doit' ? 'Me doit' : 'Je lui dois'} · ${libelleJour(d.date)}`}
      valeur={estSoldee(d) ? 'Soldée' : `${formatMontant(resteDette(d))} / ${formatMontant(d.montant)}`}
      onPress={() => router.push(`/dettes/${d.id}`)}
      chevron
    />
  );

  return (
    <Ecran
      titre="Dettes"
      droite={
        <Pressable accessibilityLabel="Nouvelle dette" hitSlop={10} onPress={() => router.push('/dettes/nouveau')}>
          <Plus color={t.accent} size={26} />
        </Pressable>
      }
    >
      <Pressable onPress={() => retour('/plus')} style={{ paddingHorizontal: 20, marginTop: 4 }}>
        <Texte couleur={t.accent}>‹ Retour</Texte>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 16 }}>
        {[
          { titre: 'On me doit', montant: totaux.onMeDoit, couleur: t.succes },
          { titre: 'Je dois', montant: totaux.jeDois, couleur: t.erreur },
        ].map((c) => (
          <View key={c.titre} style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: t.carte }}>
            <Texte variante="petit">{c.titre}</Texte>
            <Texte chiffres couleur={c.couleur} style={{ fontSize: 22, fontWeight: '700' }}>{formatMontant(c.montant)}</Texte>
          </View>
        ))}
      </View>

      {dettes.length === 0 ? (
        <Section pied="Notez ici l'argent prêté ou emprunté : il compte dans votre patrimoine net.">
          <Ligne titre="Ajouter une dette ou une créance" couleurTitre={t.accent} onPress={() => router.push('/dettes/nouveau')} />
        </Section>
      ) : null}
      {enCours.length > 0 && <Section titre="En cours">{enCours.map(ligne)}</Section>}
      {soldees.length > 0 && <Section titre="Soldées">{soldees.map(ligne)}</Section>}
    </Ecran>
  );
}
