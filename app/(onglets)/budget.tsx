import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { budgetDuMois, etatEnveloppe, pretAAssigner, ratioConsomme, type LigneBudget } from '@/src/domaine/budget';
import { aujourdhui, moisDe } from '@/src/domaine/dates';
import { formatMontant } from '@/src/domaine/montant';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { Ecran } from '@/src/ui/Ecran';
import { IconeCarree } from '@/src/ui/IconeCarree';
import { couleurEtat, Jauge } from '@/src/ui/Jauge';
import { Section } from '@/src/ui/Liste';
import { SelecteurMois } from '@/src/ui/SelecteurMois';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

export default function Budget() {
  const t = useTheme();
  const { donnees } = useDonnees();
  const [mois, setMois] = useState(moisDe(aujourdhui()));
  const groupes = budgetDuMois(donnees, mois);
  const pret = pretAAssigner(donnees, mois);

  const ligne = ({ categorie: c, enveloppe: e }: LigneBudget) => {
    const etat = etatEnveloppe(e);
    return (
      <Pressable
        key={c.id}
        accessibilityLabel={`Enveloppe ${c.nom}`}
        onPress={() => router.push(`/budget/${c.id}?mois=${mois}`)}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10,
          backgroundColor: pressed ? t.carte2 : 'transparent',
        })}
      >
        <IconeCarree nom={c.icone} couleur={c.couleur} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Texte numberOfLines={1} style={{ flexShrink: 1 }}>{c.nom}</Texte>
            <Texte variante="montant" couleur={etat === 'vide' ? t.texte2 : couleurEtat(etat, t)}>
              {formatMontant(e.reste)}
            </Texte>
          </View>
          <Jauge ratio={ratioConsomme(e)} etat={etat} />
          <Texte variante="petit" chiffres style={{ marginTop: 4 }}>
            Dépensé {formatMontant(e.depense)} sur {formatMontant(e.report + e.assigne)}
            {e.report > 0 ? ` (dont ${formatMontant(e.report)} reportés)` : ''}
          </Texte>
        </View>
      </Pressable>
    );
  };

  return (
    <Ecran titre="Budget" onglet>
      <SelecteurMois mois={mois} onChange={setMois} />

      <View style={{ marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 14, backgroundColor: t.carte, alignItems: 'center' }}>
        <Texte variante="petit">Prêt à assigner</Texte>
        <Texte chiffres couleur={pret < 0 ? t.erreur : t.succes} style={{ fontSize: 30, fontWeight: '700' }}>
          {formatMontant(pret)} MAD
        </Texte>
        <Texte variante="petit" style={{ textAlign: 'center', marginTop: 4 }}>
          {pret < 0
            ? 'Vous avez assigné plus que votre disponible : réduisez une enveloppe.'
            : 'Touchez une enveloppe pour lui assigner de l’argent.'}
        </Texte>
      </View>

      {groupes.map((g) => (
        <Section
          key={g.groupe.id}
          titre={g.groupe.nom}
          droiteTitre={<Texte variante="petit" chiffres>{formatMontant(g.reste)}</Texte>}
        >
          {g.lignes.map(ligne)}
        </Section>
      ))}
    </Ecran>
  );
}
