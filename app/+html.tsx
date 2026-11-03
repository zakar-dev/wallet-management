import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';

const BASE = process.env.EXPO_BASE_URL ?? '';

const enregistrerServiceWorker = `
if ('serviceWorker' in navigator) {
  addEventListener('load', function () {
    navigator.serviceWorker.register('${BASE}/sw.js', { scope: '${BASE}/' }).catch(function () {});
  });
}`;

/**
 * Document HTML de l'export web : PWA installable (manifeste, icônes, thème noir, service worker).
 * SDK 58 : `headNodes` (styles) et `bodyNodes` (bundles JS) doivent être rendus ici.
 */
export default function Html({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();
  return (
    <html lang="fr" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Wallet" />
        <link rel="manifest" href={`${BASE}/manifest.json`} />
        <link rel="apple-touch-icon" href={`${BASE}/icone-192.png`} />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: 'body{background-color:#000}@media (prefers-color-scheme: light){body{background-color:#f2f2f7}}' }} />
        <script dangerouslySetInnerHTML={{ __html: enregistrerServiceWorker }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
