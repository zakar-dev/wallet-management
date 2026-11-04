import { useState } from 'react';
import { Pressable } from 'react-native';
import { CATEGORIES_PAR_DEFAUT, GROUPES_PAR_DEFAUT } from '@/src/domaine/categories';
import { aujourdhui } from '@/src/domaine/dates';
import { donneesDemo } from '@/src/domaine/demo';
import { donneesVides } from '@/src/domaine/types';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { BoutonSupprimer } from '@/src/ui/BoutonSupprimer';
import { Ecran } from '@/src/ui/Ecran';
import { Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

export default function Reglages() {
  const t = useTheme();
  const { remplacer } = useDonnees();
  const [message, setMessage] = useState<string | null>(null);
  // Remonter les boutons après une action remet leur confirmation à zéro.
  const [cle, setCle] = useState(0);

  async function chargerDemo() {
    await remplacer(donneesDemo(aujourdhui()));
    setMessage('Données de démo chargées.');
    setCle((c) => c + 1);
  }

  async function toutEffacer() {
    await remplacer({ ...donneesVides(), groupes: GROUPES_PAR_DEFAUT, categories: CATEGORIES_PAR_DEFAUT });
    setMessage('Toutes les données ont été effacées.');
    setCle((c) => c + 1);
  }

  return (
    <Ecran titre="Réglages">
      <Pressable onPress={() => retour('/plus')} style={{ paddingHorizontal: 20, marginTop: 4 }}>
        <Texte couleur={t.accent}>‹ Retour</Texte>
      </Pressable>

      <BoutonSupprimer key={`demo-${cle}`} libelle="Charger les données de démo" confirmation="Confirmer : remplacer mes données"
        onConfirmer={chargerDemo} />
      <Section pied="Un exemple sur 3 mois pour découvrir l'app. Remplace toutes vos données : exportez-les d'abord (Plus → Sauvegarde).">
        {null}
      </Section>

      <BoutonSupprimer key={`effacer-${cle}`} libelle="Tout effacer" confirmation="Confirmer : tout effacer" onConfirmer={toutEffacer} />
      <Section pied="Supprime comptes, opérations, budget, objectifs et dettes de ce téléphone. Les catégories par défaut sont remises.">
        {null}
      </Section>

      {message ? (
        <Texte variante="petit" couleur={t.succes} style={{ marginHorizontal: 32, marginTop: 12 }}>{message}</Texte>
      ) : null}
    </Ecran>
  );
}
