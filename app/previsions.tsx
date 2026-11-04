import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { aujourdhui, libelleMois, libelleMoisCourt } from '@/src/domaine/dates';
import { formatMontant } from '@/src/domaine/montant';
import { previsionTresorerie } from '@/src/domaine/previsions';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { Ecran } from '@/src/ui/Ecran';
import { Courbe } from '@/src/ui/graphiques/Courbe';
import { Ligne, Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { Segment } from '@/src/ui/Segment';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

type Horizon = '3' | '6' | '12' | '24';
const HORIZONS: { valeur: Horizon; libelle: string }[] = [
  { valeur: '3', libelle: '3 mois' },
  { valeur: '6', libelle: '6 mois' },
  { valeur: '12', libelle: '1 an' },
  { valeur: '24', libelle: '2 ans' },
];

export default function Previsions() {
  const t = useTheme();
  const { donnees } = useDonnees();
  const [horizon, setHorizon] = useState<Horizon>('6');
  const n = Number(horizon);
  const [selection, setSelection] = useState(n - 1);
  const p = previsionTresorerie(donnees, aujourdhui(), n);
  const sel = p.points[Math.min(selection, n - 1)];

  return (
    <Ecran titre="Prévisions">
      <Pressable onPress={() => retour('/plus')} style={{ paddingHorizontal: 20, marginTop: 4 }}>
        <Texte couleur={t.accent}>‹ Retour</Texte>
      </Pressable>
      <View style={{ marginTop: 14 }}>
        <Segment options={HORIZONS} valeur={horizon} onChange={(h) => { setHorizon(h); setSelection(Number(h) - 1); }} />
      </View>

      <View style={{ marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 14, backgroundColor: t.carte, alignItems: 'center' }}>
        <Texte variante="petit">Trésorerie prévue fin {libelleMois(sel.mois).toLowerCase()}</Texte>
        <Texte chiffres couleur={sel.valeur < 0 ? t.erreur : t.texte} style={{ fontSize: 30, fontWeight: '700' }}>
          {formatMontant(sel.valeur)} MAD
        </Texte>
        <Texte variante="petit" chiffres>Aujourd&apos;hui : {formatMontant(p.depart)} MAD disponibles</Texte>
      </View>

      <Courbe
        etiquettes={p.points.map((x) => libelleMoisCourt(x.mois))}
        valeurs={p.points.map((x) => x.valeur)}
        couleur="#0a84ff"
        selection={Math.min(selection, n - 1)}
        onSelect={setSelection}
      />

      <Section titre="Chaque mois"
        pied="Estimation : vos récurrents actifs et la moyenne de vos autres dépenses sur 6 mois. Les transferts récurrents ne sont pas comptés.">
        <Ligne titre="Revenus récurrents" valeur={formatMontant(p.parMois.revenusRecurrents, { signe: true })} />
        <Ligne titre="Dépenses récurrentes" valeur={formatMontant(-p.parMois.depensesRecurrentes)} />
        <Ligne titre="Autres dépenses (moyenne)" valeur={formatMontant(-p.parMois.depensesVariables)} />
        <Ligne titre="Solde mensuel" valeur={formatMontant(p.parMois.solde, { signe: true })}
          couleurValeur={p.parMois.solde < 0 ? t.erreur : t.texte} />
      </Section>

      <Section titre="Mois par mois">
        {p.points.map((x) => (
          <Ligne key={x.mois} titre={libelleMois(x.mois)} valeur={formatMontant(x.valeur)}
            couleurValeur={x.valeur < 0 ? t.erreur : t.texte2} />
        ))}
      </Section>
    </Ecran>
  );
}
