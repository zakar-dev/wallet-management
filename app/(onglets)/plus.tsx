import { router } from 'expo-router';
import { Ecran } from '@/src/ui/Ecran';
import { Ligne, Section } from '@/src/ui/Liste';

const BIENTOT: [string, string, string][] = [
  ['Dettes & créances', 'hand-coins', '#ff375f'],
  ['Habitudes', 'coffee', '#ac8e68'],
  ['Prévisions', 'zap', '#ffd60a'],
  ['Sauvegarde', 'shield', '#5e5ce6'],
  ['Réglages', 'ellipsis', '#8e8e93'],
];

export default function Plus() {
  return (
    <Ecran titre="Plus" onglet>
      <Section>
        <Ligne titre="Comptes" icone="wallet" couleurIcone="#0a84ff" onPress={() => router.push('/comptes')} chevron />
        <Ligne titre="Catégories" icone="tag" couleurIcone="#ff9f0a" onPress={() => router.push('/categories')} chevron />
        <Ligne titre="Récurrents" icone="repeat" couleurIcone="#bf5af2" onPress={() => router.push('/recurrences')} chevron />
        <Ligne titre="Objectifs" icone="piggy-bank" couleurIcone="#30d158" onPress={() => router.push('/objectifs')} chevron />
      </Section>
      <Section>
        {BIENTOT.map(([titre, icone, couleur]) => (
          <Ligne key={titre} titre={titre} icone={icone} couleurIcone={couleur} sousTitre="Bientôt" desactivee />
        ))}
      </Section>
    </Ecran>
  );
}
