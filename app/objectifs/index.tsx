import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { aujourdhui } from '@/src/domaine/dates';
import { formatMontant } from '@/src/domaine/montant';
import { epargneLibre, epargneTotale, progression, trierObjectifs } from '@/src/domaine/objectifs';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { Ecran } from '@/src/ui/Ecran';
import { IconeCarree } from '@/src/ui/IconeCarree';
import { Jauge } from '@/src/ui/Jauge';
import { Ligne, Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { COULEUR_OBJECTIF, detailObjectif } from '@/src/ui/objectif';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

export default function Objectifs() {
  const t = useTheme();
  const { donnees } = useDonnees();
  const today = aujourdhui();
  const libre = epargneLibre(donnees.comptes, donnees.operations, donnees.objectifs);
  const total = epargneTotale(donnees.comptes, donnees.operations);
  const objectifs = trierObjectifs(donnees.objectifs);

  return (
    <Ecran
      titre="Objectifs"
      droite={
        <Pressable accessibilityLabel="Nouvel objectif" hitSlop={10} onPress={() => router.push('/objectifs/nouveau')}>
          <Plus color={t.accent} size={26} />
        </Pressable>
      }
    >
      <Pressable onPress={() => retour('/plus')} style={{ paddingHorizontal: 20, marginTop: 4 }}>
        <Texte couleur={t.accent}>‹ Retour</Texte>
      </Pressable>

      <View style={{ marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 14, backgroundColor: t.carte, alignItems: 'center' }}>
        <Texte variante="petit">Épargne libre</Texte>
        <Texte chiffres couleur={libre < 0 ? t.erreur : t.succes} style={{ fontSize: 30, fontWeight: '700' }}>
          {formatMontant(libre)} MAD
        </Texte>
        <Texte variante="petit" chiffres style={{ textAlign: 'center', marginTop: 4 }}>
          {libre < 0
            ? 'Vos objectifs réservent plus que votre épargne : retirez de l’argent d’un objectif.'
            : `Sur ${formatMontant(total)} MAD en comptes épargne`}
        </Texte>
      </View>

      {objectifs.length === 0 ? (
        <Section>
          <Ligne titre="Créer un premier objectif" couleurTitre={t.accent} onPress={() => router.push('/objectifs/nouveau')} />
        </Section>
      ) : (
        <Section>
          {objectifs.map((o) => (
            <Pressable
              key={o.id}
              accessibilityLabel={`Objectif ${o.nom}`}
              onPress={() => router.push(`/objectifs/${o.id}`)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10,
                backgroundColor: pressed ? t.carte2 : 'transparent',
              })}
            >
              <IconeCarree nom={o.icone} couleur={COULEUR_OBJECTIF} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Texte numberOfLines={1} style={{ flexShrink: 1 }}>{o.nom}</Texte>
                  <Texte variante="petit" chiffres>{formatMontant(o.reserve)} / {formatMontant(o.cible)}</Texte>
                </View>
                <Jauge ratio={progression(o)} etat="ok" />
                <Texte variante="petit" chiffres style={{ marginTop: 4 }}>{detailObjectif(o, today)}</Texte>
              </View>
            </Pressable>
          ))}
        </Section>
      )}
    </Ecran>
  );
}
