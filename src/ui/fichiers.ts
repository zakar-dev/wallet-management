/** Partage et choix de fichiers pour la version web (PWA). */

export type IssuePartage = 'partage' | 'telecharge' | 'annule';

/**
 * Ouvre la feuille de partage du système avec le fichier (iOS / Android : Enregistrer dans Fichiers, Drive…).
 * Sans partage de fichiers, le télécharge.
 */
export async function partagerFichier(nom: string, contenu: string, type = 'application/json'): Promise<IssuePartage> {
  const fichier = new File([contenu], nom, { type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [fichier] })) {
    try {
      await nav.share({ files: [fichier], title: nom });
      return 'partage';
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'annule';
      // autre échec : repli sur le téléchargement
    }
  }
  const url = URL.createObjectURL(fichier);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'telecharge';
}

/** Ouvre le sélecteur de fichiers et renvoie le texte du fichier choisi (null si annulé). */
export function choisirFichierTexte(accept = 'application/json,.json'): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = async () => {
      const f = input.files?.[0];
      resolve(f ? await f.text() : null);
    };
    input.click();
  });
}
