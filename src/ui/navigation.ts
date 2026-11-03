import { router, type Href } from 'expo-router';

/** Revient en arrière ; sans historique (lien direct, PWA rechargée), va vers `repli`. */
export function retour(repli: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(repli);
}
