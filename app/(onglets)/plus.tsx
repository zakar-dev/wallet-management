import { router } from 'expo-router';
import { Ecran } from '@/src/ui/Ecran';
import { Ligne, Section } from '@/src/ui/Liste';

const BIENTOT: [string, string, string][] = [
  ['Habitudes', 'coffee', '#ac8e68'],
  ['Prévisions', 'zap', '#ffd60a'],
];

export default function Plus() {
  return (
    <Ecran titre="Plus" onglet>
      <Section>
        <Ligne titre="Analyse" icone="chart-column" couleurIcone="#0a84ff" onPress={() => router.push('/analyse')} chevron />
      </Section>
      <Section>
        <Ligne titre="Comptes" icone="wallet" couleurIcone="#0a84ff" onPress={() => router.push('/comptes')} chevron />
        <Ligne titre="Catégories" icone="tag" couleurIcone="#ff9f0a" onPress={() => router.push('/categories')} chevron />
        <Ligne titre="Récurrents" icone="repeat" couleurIcone="#bf5af2" onPress={() => router.push('/recurrences')} chevron />
        <Ligne titre="Objectifs" icone="piggy-bank" couleurIcone="#30d158" onPress={() => router.push('/objectifs')} chevron />
        <Ligne titre="Dettes & créances" icone="hand-coins" couleurIcone="#ff375f" onPress={() => router.push('/dettes')} chevron />
      </Section>
      <Section>
        <Ligne titre="Sauvegarde" icone="shield" couleurIcone="#5e5ce6" onPress={() => router.push('/sauvegarde')} chevron />
        <Ligne titre="Réglages" icone="ellipsis" couleurIcone="#8e8e93" onPress={() => router.push('/reglages')} chevron />
      </Section>
      <Section>
        {BIENTOT.map(([titre, icone, couleur]) => (
          <Ligne key={titre} titre={titre} icone={icone} couleurIcone={couleur} sousTitre="Bientôt" desactivee />
        ))}
      </Section>
    </Ecran>
  );
}
