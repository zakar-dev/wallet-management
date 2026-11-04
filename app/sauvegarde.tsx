import { useState } from 'react';
import { Pressable } from 'react-native';
import { aujourdhui, libelleJour } from '@/src/domaine/dates';
import { creerSauvegarde, lireSauvegarde, nomFichierSauvegarde } from '@/src/domaine/sauvegarde';
import type { Donnees } from '@/src/domaine/types';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { lireDerniereSauvegarde, noterSauvegarde } from '@/src/stockage/reglages';
import { BoutonSupprimer } from '@/src/ui/BoutonSupprimer';
import { Ecran } from '@/src/ui/Ecran';
import { choisirFichierTexte, partagerFichier } from '@/src/ui/fichiers';
import { Ligne, Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

export default function Sauvegarde() {
  const t = useTheme();
  const { donnees, remplacer } = useDonnees();
  const [derniere, setDerniere] = useState(lireDerniereSauvegarde());
  const [message, setMessage] = useState<{ texte: string; erreur?: boolean } | null>(null);
  const [aImporter, setAImporter] = useState<{ date: string; donnees: Donnees } | null>(null);

  async function exporter() {
    const jour = aujourdhui();
    const contenu = JSON.stringify(creerSauvegarde(donnees, new Date().toISOString()));
    try {
      const issue = await partagerFichier(nomFichierSauvegarde(jour), contenu);
      if (issue === 'annule') return;
      noterSauvegarde(jour);
      setDerniere(jour);
      setMessage({ texte: issue === 'partage' ? 'Sauvegarde partagée.' : 'Fichier de sauvegarde téléchargé.' });
    } catch {
      setMessage({ texte: "L'export n'a pas pu se faire. Réessayez.", erreur: true });
    }
  }

  async function importer() {
    setAImporter(null);
    const texte = await choisirFichierTexte();
    if (texte === null) return;
    const r = lireSauvegarde(texte);
    if (!r.ok) setMessage({ texte: r.erreur, erreur: true });
    else { setAImporter({ date: r.date, donnees: r.donnees }); setMessage(null); }
  }

  async function confirmerImport() {
    if (!aImporter) return;
    await remplacer(aImporter.donnees);
    setAImporter(null);
    setMessage({ texte: 'Données restaurées.' });
  }

  const dateImport = aImporter?.date.slice(0, 10);

  return (
    <Ecran titre="Sauvegarde">
      <Pressable onPress={() => retour('/plus')} style={{ paddingHorizontal: 20, marginTop: 4 }}>
        <Texte couleur={t.accent}>‹ Retour</Texte>
      </Pressable>

      <Section pied="Vos données ne vivent que sur ce téléphone. Exportez-les régulièrement et gardez le fichier dans Fichiers, iCloud Drive ou Google Drive.">
        <Ligne titre="Dernière sauvegarde" valeur={derniere ? libelleJour(derniere) : 'Jamais'} />
        <Ligne titre="Exporter mes données" icone="shield" couleurIcone="#5e5ce6" onPress={exporter} chevron />
        <Ligne titre="Importer une sauvegarde" icone="arrow-left-right" couleurIcone="#8e8e93" onPress={importer} chevron />
      </Section>

      {message ? (
        <Texte variante="petit" couleur={message.erreur ? t.erreur : t.succes} style={{ marginHorizontal: 32, marginTop: 12 }}>
          {message.texte}
        </Texte>
      ) : null}

      {aImporter ? (
        <>
          <Section titre={`Sauvegarde ${dateImport && /^\d{4}-\d{2}-\d{2}$/.test(dateImport) ? `du ${libelleJour(dateImport).toLowerCase()}` : ''}`}>
            <Ligne titre="Comptes" valeur={String(aImporter.donnees.comptes.length)} />
            <Ligne titre="Opérations" valeur={String(aImporter.donnees.operations.length)} />
            <Ligne titre="Catégories" valeur={String(aImporter.donnees.categories.length)} />
            <Ligne titre="Objectifs et dettes" valeur={String(aImporter.donnees.objectifs.length + aImporter.donnees.dettes.length)} />
          </Section>
          <BoutonSupprimer libelle="Remplacer toutes mes données" confirmation="Confirmer le remplacement" onConfirmer={confirmerImport} />
          <Section pied="Vos données actuelles seront entièrement remplacées par celles du fichier.">{null}</Section>
        </>
      ) : null}
    </Ecran>
  );
}
