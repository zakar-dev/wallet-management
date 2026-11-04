import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  fluxParMois, indicateursMois, patrimoineParMois, repartitionCategories,
} from '@/src/domaine/analyse';
import { aujourdhui, libelleMois, libelleMoisCourt, moisDe } from '@/src/domaine/dates';
import { formatMontant } from '@/src/domaine/montant';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { Ecran } from '@/src/ui/Ecran';
import { BarresGroupees } from '@/src/ui/graphiques/BarresGroupees';
import { Legende } from '@/src/ui/graphiques/cadre';
import { Courbe } from '@/src/ui/graphiques/Courbe';
import { IconeCarree } from '@/src/ui/IconeCarree';
import { LigneOperation } from '@/src/ui/LigneOperation';
import { Ligne, Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { Segment } from '@/src/ui/Segment';
import { SelecteurMois } from '@/src/ui/SelecteurMois';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

/** Paire validée (daltonisme, contraste) sur les fonds sombre #1c1c1e et clair #ffffff. */
const COULEUR_REVENUS = '#0a84ff';
const COULEUR_DEPENSES = '#d97706';

type Onglet = 'flux' | 'patrimoine' | 'categories';
const ONGLETS: { valeur: Onglet; libelle: string }[] = [
  { valeur: 'flux', libelle: 'Flux' },
  { valeur: 'patrimoine', libelle: 'Patrimoine' },
  { valeur: 'categories', libelle: 'Catégories' },
];

export default function Analyse() {
  const t = useTheme();
  const { donnees } = useDonnees();
  const today = aujourdhui();
  const [mois, setMois] = useState(moisDe(today));
  const [onglet, setOnglet] = useState<Onglet>('flux');
  const [selFlux, setSelFlux] = useState(5);
  const [selPatri, setSelPatri] = useState(11);

  const flux = fluxParMois(donnees, mois, 6);
  const patrimoine = patrimoineParMois(donnees, mois, 12);
  const repartition = repartitionCategories(donnees, mois);
  const ind = indicateursMois(donnees, mois, today);
  const courant = mois === moisDe(today);

  const changerMois = (m: string) => { setMois(m); setSelFlux(5); setSelPatri(11); };
  const f = flux[selFlux];
  const p = patrimoine[selPatri];

  return (
    <Ecran titre="Analyse">
      <Pressable onPress={() => retour('/plus')} style={{ paddingHorizontal: 20, marginTop: 4 }}>
        <Texte couleur={t.accent}>‹ Retour</Texte>
      </Pressable>
      <SelecteurMois mois={mois} onChange={changerMois} />
      <View style={{ marginTop: 14 }}>
        <Segment options={ONGLETS} valeur={onglet} onChange={setOnglet} />
      </View>

      {onglet === 'flux' && (
        <>
          <Legende series={[{ nom: 'Revenus', couleur: COULEUR_REVENUS }, { nom: 'Dépenses', couleur: COULEUR_DEPENSES }]} />
          <Texte variante="petit" chiffres style={{ marginHorizontal: 16, marginTop: 8 }}>
            {libelleMois(f.mois)} · revenus {formatMontant(f.revenus)} · dépenses {formatMontant(f.depenses)}
          </Texte>
          <BarresGroupees
            etiquettes={flux.map((x) => libelleMoisCourt(x.mois))}
            series={[
              { nom: 'Revenus', couleur: COULEUR_REVENUS, valeurs: flux.map((x) => x.revenus) },
              { nom: 'Dépenses', couleur: COULEUR_DEPENSES, valeurs: flux.map((x) => x.depenses) },
            ]}
            selection={selFlux}
            onSelect={setSelFlux}
          />
          <Section titre="Détail">
            {[...flux].reverse().map((x) => (
              <Ligne key={x.mois} titre={libelleMois(x.mois)}
                sousTitre={`Revenus ${formatMontant(x.revenus)} · Dépenses ${formatMontant(x.depenses)}`}
                valeur={formatMontant(x.revenus - x.depenses, { signe: true })} />
            ))}
          </Section>
        </>
      )}

      {onglet === 'patrimoine' && (
        <>
          <Texte variante="petit" chiffres style={{ marginHorizontal: 16, marginTop: 14 }}>
            Patrimoine net fin {libelleMois(p.mois).toLowerCase()} : {formatMontant(p.valeur)} MAD
          </Texte>
          <Courbe
            etiquettes={patrimoine.map((x) => libelleMoisCourt(x.mois))}
            valeurs={patrimoine.map((x) => x.valeur)}
            couleur={COULEUR_REVENUS}
            selection={selPatri}
            onSelect={setSelPatri}
          />
          <Section titre="Fin de mois">
            {[...patrimoine].reverse().map((x) => (
              <Ligne key={x.mois} titre={libelleMois(x.mois)} valeur={formatMontant(x.valeur)} />
            ))}
          </Section>
        </>
      )}

      {onglet === 'categories' && (
        repartition.length === 0 ? (
          <Section pied="Aucune dépense ce mois-ci.">{null}</Section>
        ) : (
          <Section titre={`Dépenses · ${formatMontant(ind.depense)} MAD`}>
            {repartition.map((r) => (
              <View key={r.categorie.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
                <IconeCarree nom={r.categorie.icone} couleur={r.categorie.couleur} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <Texte numberOfLines={1} style={{ flexShrink: 1 }}>{r.categorie.nom}</Texte>
                    <Texte variante="montant">{formatMontant(r.montant)}</Texte>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: t.carte2, overflow: 'hidden' }}>
                      <View style={{ width: `${Math.max(2, Math.round(r.part * 100))}%`, height: '100%', borderRadius: 3, backgroundColor: COULEUR_REVENUS }} />
                    </View>
                    <Texte variante="petit" chiffres style={{ width: 40, textAlign: 'right' }}>{Math.round(r.part * 100)} %</Texte>
                  </View>
                </View>
              </View>
            ))}
          </Section>
        )
      )}

      <Section titre={`Indicateurs · ${libelleMois(mois).toLowerCase()}`}>
        <Ligne titre="Dépensé" valeur={formatMontant(ind.depense)} />
        <Ligne titre="Moyenne par jour" valeur={formatMontant(ind.moyenneParJour)} />
        {courant ? <Ligne titre="Projection fin de mois" valeur={formatMontant(ind.projection)} /> : null}
        <Ligne titre="Moyenne des 6 mois précédents" valeur={formatMontant(ind.moyenne6Mois)} />
        <Ligne titre="Autonomie" sousTitre="Disponible ÷ dépenses mensuelles moyennes"
          valeur={ind.autonomie === null ? '—' : `${ind.autonomie.toFixed(1).replace('.', ',')} mois`} />
      </Section>

      {ind.plusGrosses.length > 0 ? (
        <Section titre="Plus grosses dépenses">
          {ind.plusGrosses.map((o) => (
            <LigneOperation key={o.id} operation={o} donnees={donnees} onPress={() => router.push(`/ajout?id=${o.id}`)} />
          ))}
        </Section>
      ) : null}
    </Ecran>
  );
}
