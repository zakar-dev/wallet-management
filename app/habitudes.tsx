import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { aujourdhui, decalageLundi, libelleJour, moisDe } from '@/src/domaine/dates';
import {
  calendrierDepenses, joursSansDepense, serieSaisie, tendancesCategories, topCommercants,
} from '@/src/domaine/habitudes';
import { formatMontant } from '@/src/domaine/montant';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { Ecran } from '@/src/ui/Ecran';
import { Ligne, Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { SelecteurMois } from '@/src/ui/SelecteurMois';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

/** Teinte unique (magnitude) : plus la case est foncée, plus la dépense est forte. */
const BLEU = '10,132,255';
const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const pourcent = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(Math.round(x * 100))} %`;

export default function Habitudes() {
  const t = useTheme();
  const { donnees } = useDonnees();
  const today = aujourdhui();
  const [mois, setMois] = useState(moisDe(today));
  const [jourChoisi, setJourChoisi] = useState<string | null>(null);

  const calendrier = calendrierDepenses(donnees, mois, today);
  const sansDepense = joursSansDepense(donnees, mois, today);
  const ecoules = calendrier.filter((j) => !j.futur).length;
  const serie = serieSaisie(donnees.operations, today);
  const commercants = topCommercants(donnees, mois, 3, 5);
  const tendances = tendancesCategories(donnees, mois);
  const cases = [...Array(decalageLundi(mois)).fill(null), ...calendrier];
  const choisi = calendrier.find((j) => j.date === jourChoisi);

  return (
    <Ecran titre="Habitudes">
      <Pressable onPress={() => retour('/plus')} style={{ paddingHorizontal: 20, marginTop: 4 }}>
        <Texte couleur={t.accent}>‹ Retour</Texte>
      </Pressable>
      <SelecteurMois mois={mois} onChange={(m) => { setMois(m); setJourChoisi(null); }} />

      <View style={{ flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 16 }}>
        <View style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: t.carte }}>
          <Texte variante="petit">Jours sans dépense</Texte>
          <Texte chiffres style={{ fontSize: 24, fontWeight: '700' }}>
            {sansDepense}<Texte variante="secondaire" chiffres> / {ecoules}</Texte>
          </Texte>
        </View>
        <View style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: t.carte }}>
          <Texte variante="petit">Série de saisie</Texte>
          <Texte chiffres style={{ fontSize: 24, fontWeight: '700' }}>
            {serie}<Texte variante="secondaire"> {serie > 1 ? 'jours' : 'jour'}</Texte>
          </Texte>
        </View>
      </View>

      <Section titre="Calendrier des dépenses">
        <View style={{ padding: 12, width: '100%', maxWidth: 420, alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row' }}>
            {JOURS.map((j, i) => (
              <Texte key={i} variante="petit" style={{ flex: 1, textAlign: 'center', marginBottom: 6 }}>{j}</Texte>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cases.map((j, i) => (
              <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
                {j ? (
                  <Pressable
                    accessibilityLabel={`${libelleJour(j.date, today)} : ${formatMontant(j.montant)} MAD`}
                    onPress={() => setJourChoisi(j.date === jourChoisi ? null : j.date)}
                    style={{
                      flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: j.montant > 0 ? `rgba(${BLEU},${0.2 + 0.8 * j.intensite})` : t.carte2,
                      opacity: j.futur ? 0.35 : 1,
                      borderWidth: j.date === jourChoisi ? 2 : 0, borderColor: t.texte,
                    }}
                  >
                    <Texte variante="petit" chiffres couleur={j.intensite > 0.55 ? '#ffffff' : t.texte}>
                      {Number(j.date.slice(8))}
                    </Texte>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
          <Texte variante="petit" chiffres style={{ marginTop: 8 }}>
            {choisi
              ? `${libelleJour(choisi.date, today)} : ${formatMontant(choisi.montant)} MAD`
              : 'Plus la case est foncée, plus la dépense du jour est forte. Touchez un jour pour son total.'}
          </Texte>
        </View>
      </Section>

      <Section titre="Top commerçants · 3 derniers mois"
        pied={commercants.length === 0 ? 'Ajoutez un libellé à vos dépenses (ex. Marjane) pour les voir ici.' : undefined}>
        {commercants.map((c) => (
          <Ligne key={c.libelle} titre={c.libelle} sousTitre={`${c.passages} passage${c.passages > 1 ? 's' : ''}`}
            valeur={formatMontant(c.total)} />
        ))}
      </Section>

      <Section titre="Tendances par catégorie" pied="Comparées à la moyenne des 6 mois précédents.">
        {tendances.map((x) => (
          <Ligne key={x.categorie.id} icone={x.categorie.icone} couleurIcone={x.categorie.couleur} titre={x.categorie.nom}
            sousTitre={`Moyenne ${formatMontant(x.moyenne)}${x.ecart === null ? ' · nouveau' : ` · ${pourcent(x.ecart)}`}`}
            valeur={formatMontant(x.montant)} />
        ))}
      </Section>
    </Ecran>
  );
}
