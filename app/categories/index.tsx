import { useState } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Star } from 'lucide-react-native';
import { categoriesDuGroupe, groupesTries, rechercherCategories } from '@/src/domaine/categories';
import type { Categorie } from '@/src/domaine/types';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { Ecran } from '@/src/ui/Ecran';
import { Ligne, Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { Recherche } from '@/src/ui/Recherche';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

export default function Categories() {
  const t = useTheme();
  const { donnees, enregistrer } = useDonnees();
  const [texte, setTexte] = useState('');
  const groupes = groupesTries(donnees.groupes);

  const ligne = (c: Categorie) => (
    <Ligne
      key={c.id}
      icone={c.icone}
      couleurIcone={c.couleur}
      titre={c.nom}
      onPress={() => router.push(`/categories/${c.id}`)}
      droite={
        <Pressable
          accessibilityLabel={c.favori ? `Retirer ${c.nom} des favoris` : `Mettre ${c.nom} en favori`}
          hitSlop={10}
          onPress={() => enregistrer('categories', { ...c, favori: !c.favori })}
        >
          <Star color={c.favori ? t.alerte : t.texte2} fill={c.favori ? t.alerte : 'transparent'} size={20} />
        </Pressable>
      }
    />
  );

  const resultats = texte.trim() ? rechercherCategories(donnees.categories, texte) : null;

  return (
    <Ecran titre="Catégories">
      <Pressable onPress={() => retour('/plus')} style={{ paddingHorizontal: 20, marginTop: 4 }}>
        <Texte couleur={t.accent}>‹ Retour</Texte>
      </Pressable>
      <Recherche valeur={texte} onChange={setTexte} />
      {resultats ? (
        <Section pied={resultats.length === 0 ? 'Aucune catégorie' : undefined}>{resultats.map(ligne)}</Section>
      ) : (
        groupes.map((g) => (
          <Section
            key={g.id}
            titre={g.nom}
            onPressTitre={() => router.push(`/groupes/${g.id}`)}
            droiteTitre={<ChevronRight color={t.texte2} size={14} />}
          >
            {[
              ...categoriesDuGroupe(donnees.categories, g.id).map(ligne),
              <Ligne key="ajouter" titre="Ajouter une catégorie" couleurTitre={t.accent}
                onPress={() => router.push(`/categories/nouveau?groupeId=${g.id}`)} />,
            ]}
          </Section>
        ))
      )}
      {!resultats && (
        <Section>
          <Ligne titre="Nouveau groupe de revenus" couleurTitre={t.accent}
            onPress={() => router.push('/groupes/nouveau?nature=revenu')} />
          <Ligne titre="Nouveau groupe de dépenses" couleurTitre={t.accent}
            onPress={() => router.push('/groupes/nouveau?nature=depense')} />
        </Section>
      )}
    </Ecran>
  );
}
