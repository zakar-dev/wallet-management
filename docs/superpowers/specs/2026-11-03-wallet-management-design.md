# Wallet Management — document de conception

Date : 2026-11-03 · Statut : validé en brainstorming

## 1. Objet

Application personnelle de **suivi de budget** : l'utilisateur saisit ses
opérations (dépenses, revenus, transferts) sur ses comptes réels (courant,
épargne, espèces). L'app ne se connecte à aucune banque et ne déplace aucun
argent.

Référence fonctionnelle : les 25 captures de `docs/captures/` (app
« Tresoria »). Le **fonctionnel** s'en inspire ; le **visuel** s'en écarte
volontairement (voir §4).

## 2. Contraintes

| Contrainte | Décision |
|---|---|
| Plateformes | iPhone et Android |
| Coût | **Zéro** : pas de compte Apple Developer, pas de store |
| Distribution | **PWA** installée depuis Safari / Chrome (« Sur l'écran d'accueil ») |
| Code | **React Native via Expo**, exporté en web (`expo export -p web`). Le même code pourra produire une app native plus tard |
| Données | **Sur l'appareil uniquement**, aucun compte, aucun serveur, hors ligne |
| Hébergement | Statique et gratuit en HTTPS : GitHub Pages |
| Devise | MAD, une seule devise en V1 |
| Langue | Français |

Limites connues de la PWA sur iOS, acceptées :
- les notifications exigent iOS 16.4+ et l'app installée sur l'écran d'accueil ;
- les données vivent dans le stockage du navigateur : supprimer l'app les
  efface. D'où la sauvegarde par export (§7).

## 3. Périmètre — tout en V1

Les neuf blocs sont livrés ensemble, mais **construits et testés dans cet
ordre**, chacun validé avant le suivant :

1. **Comptes** — courant / épargne / espèces, solde d'ouverture, archivage, compte par défaut.
2. **Catégories** — groupes Revenus fixes / variables, Dépenses fixes / variables, groupes personnalisés ; icône, couleur, favori, recherche. Jeu par défaut repris des captures (Loyer, Courses, Carburant, Café, Hammam & soins, Salaire, Bail…).
3. **Opérations** — dépense, revenu, transfert ; liste groupée par jour ; recherche ; filtres par type, compte et catégorie ; modification et suppression.
4. **Budget par enveloppes** — par mois : assigné, dépensé, report du mois précédent ; « Prêt à assigner ».
5. **Récurrents** — hebdomadaires ou mensuels ; pré-remplis à l'échéance, **confirmés** par l'utilisateur, jamais créés en silence.
6. **Objectifs d'épargne** — cible, échéance, montant par mois conseillé ; allouer / retirer / dépenser.
7. **Dettes & créances** — personne, sens, montant, remboursements partiels.
8. **Analyse** — onglets Flux (revenus vs dépenses par mois), Patrimoine (courbe), Catégories (répartition) ; indicateurs du mois : moyenne par jour, projection fin de mois, moyenne 6 mois, autonomie, plus grosses dépenses.
9. **Habitudes & prévisions** — calendrier des dépenses, jours sans dépense, top commerçants (par libellé), tendances par catégorie vs moyenne 6 mois ; trésorerie projetée sur 3 mois / 6 mois / 1 an / 2 ans à partir des récurrents et de la moyenne des variables ; série de jours de saisie.

Hors périmètre : connexion bancaire, multi-devise, synchronisation,
multi-utilisateur, mode « Personnel / Pro ».

## 4. Interface

Direction validée sur maquettes : **Apple Wallet / iOS**, **sombre par
défaut**, clair si le système est en clair.

- Police : système (SF Pro sur iOS), Inter en secours ; chiffres tabulaires pour tous les montants.
- Icônes : **Lucide**, blanches dans des carrés arrondis aux couleurs système iOS (style Réglages). Aucun emoji.
- Palette sombre : fond `#000`, cartes `#1c1c1e` / `#2c2c2e`, texte secondaire `#8e8e93`, séparateurs `#38383a`, accent `#0a84ff`, succès `#30d158`, alerte `#ff9f0a`, erreur `#ff453a`. Palette claire : équivalents iOS (`#f2f2f7`, `#fff`, `#007aff`…).
- Navigation : barre d'onglets translucide floutée — **Accueil, Opérations, (+), Budget, Plus**. Le « + » ouvre la feuille d'ajout.
- Accueil : grand titre, patrimoine net, cartes de comptes **empilées façon Wallet**, anneau « reste à dépenser », liste « Récent ».
- Ajout : feuille modale, segment Dépense / Revenu / Transfert, montant en très grand, liste groupée (catégorie, compte, date, libellé), interrupteur « Récurrente ».
- Budget : sélecteur de mois, carte « Prêt à assigner », enveloppes par groupe avec barre de progression (verte, orange si > 90 % consommé, rouge si dépassée).
- Analyse : segment Flux / Patrimoine / Catégories, graphiques en SVG.
- « Plus » donne accès à Comptes, Objectifs, Dettes, Récurrents, Habitudes, Prévisions, Sauvegarde, Réglages.

Maquettes de référence : `.superpowers/brainstorm/*/content/style-ios-v2.html`
et `ecrans-cles.html`. Les retouches visuelles se feront à l'usage.

## 5. Architecture

```
wallet-management/
├─ app/              écrans (Expo Router) — affichage uniquement
├─ src/domaine/      règles métier, TypeScript pur, sans React
├─ src/stockage/     interface Depot + implémentation IndexedDB
├─ src/ui/           composants : cartes, listes groupées, jauges, graphiques SVG
└─ tests/            Jest
```

Principes :
- **Tout calcul vit dans `src/domaine/`**, en fonctions pures. Les écrans ne calculent rien.
- **Montants en centimes entiers** (`number` entier). Formatage `94 148,00` à l'affichage seulement.
- **Les soldes se calculent, ne se stockent pas** : impossible d'avoir un solde faux.
- **Une seule interface `Depot`** pour le stockage. Implémentation IndexedDB (bibliothèque `idb`) pour la PWA ; une implémentation SQLite pourra la remplacer en natif.
- Dépendances : Expo, Expo Router, react-native-web, react-native-svg, lucide-react-native, idb. Rien d'autre sans raison.
- PWA : manifeste (nom, icônes, couleur de thème noire, affichage `standalone`) et service worker pour le hors-ligne.

## 6. Modèle de données

| Entité | Champs |
|---|---|
| Compte | id, nom, type (`courant`/`epargne`/`especes`), soldeOuverture, couleur, archive, parDefaut |
| Groupe | id, nom, nature (`revenu`/`depense`), ordre |
| Catégorie | id, nom, icone, couleur, groupeId, favori |
| Opération | id, date, montant (> 0), type (`depense`/`revenu`/`transfert`), compteId, compteDestId?, categorieId?, libelle, recurrenceId? |
| Assignation | mois (`AAAA-MM`), categorieId, montant |
| Récurrence | id, modèle d'opération, frequence (`hebdo`/`mensuelle`), prochaineEcheance, active |
| Objectif | id, nom, icone, cible, echeance?, reserve |
| Dette | id, personne, sens (`on_me_doit`/`je_dois`), montant, remboursements[] |

## 7. Règles de calcul

1. **Solde d'un compte** = soldeOuverture + revenus − dépenses − transferts sortants + transferts entrants.
2. **Disponible** = Σ soldes des comptes courants et espèces non archivés.
   **Patrimoine net** = Σ soldes de tous les comptes + créances restantes − dettes restantes.
3. **Enveloppe (mois m, catégorie c)** = report(m−1) + assigné(m) − dépensé(m).
   Le report est le reste de l'enveloppe au mois précédent, s'il est positif.
   **Prêt à assigner** = disponible − Σ restes des enveloppes du mois.
4. **Objectifs** : Σ réservés ≤ Σ soldes des comptes épargne. Une allocation qui dépasserait est refusée, avec le montant encore libre.
5. **Projection fin de mois** = dépensé à ce jour ÷ jours écoulés × jours du mois.
   **Autonomie** = patrimoine disponible ÷ moyenne des dépenses mensuelles sur 6 mois.
6. **Prévision de trésorerie** au mois k = disponible + Σ récurrents de revenu − Σ récurrents de dépense − moyenne des dépenses variables (6 mois), mois par mois.

## 8. Erreurs et sauvegarde

- **Saisie invalide** (montant nul, transfert vers le même compte, catégorie manquante pour une dépense) : bouton OK grisé et message court. Jamais d'erreur technique à l'écran.
- **Export** : un fichier JSON versionné (`version`, date, toutes les entités), partagé via la feuille de partage du système.
- **Import** : contrôle du format et de la version, puis remplacement complet après confirmation.
- **Rappel** sur l'accueil si la dernière sauvegarde date de plus de 7 jours.
- **Données de démo** : jeu d'exemple chargeable depuis Réglages, jamais par défaut.

## 9. Tests

- Chaque règle du §7 est testée avec des valeurs calculées à la main.
- Aller-retour export → import sans perte.
- Report des enveloppes sur plusieurs mois, y compris un mois sans assignation.
- Échéances des récurrences (fin de mois, mois de 28 / 31 jours).

## 10. Livraison

1. `npx expo export -p web` produit le site statique.
2. Publication sur GitHub Pages (compte gratuit).
3. Sur iPhone : Safari → adresse → Partager → *Sur l'écran d'accueil*.
   Sur Android : Chrome → *Installer l'application*.
