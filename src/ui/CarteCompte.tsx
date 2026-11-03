import { Platform, Pressable, View } from 'react-native';
import { LIBELLES_TYPE_COMPTE } from '@/src/domaine/comptes';
import { formatMontant } from '@/src/domaine/montant';
import type { Compte } from '@/src/domaine/types';
import { ICONE_TYPE_COMPTE, iconeDe } from './icones';
import { Texte } from './Texte';

export const HAUTEUR_CARTE = 190;
const DEPASSEMENT = 64;

interface Props {
  compte: Compte;
  solde: number;
  onPress?: () => void;
  /** Toutes les cartes sauf la première chevauchent la précédente (pile façon Wallet). */
  empilee?: boolean;
}

export function CarteCompte({ compte, solde, onPress, empilee }: Props) {
  const Icone = iconeDe(ICONE_TYPE_COMPTE[compte.type]);
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: HAUTEUR_CARTE, borderRadius: 16, padding: 18, marginHorizontal: 16,
        marginTop: empilee ? DEPASSEMENT - HAUTEUR_CARTE : 0,
        backgroundColor: compte.couleur, justifyContent: 'space-between',
        shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: -2 },
        ...(Platform.OS === 'web'
          ? { backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,.22), rgba(0,0,0,.18))' }
          : {}),
      } as object}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icone color="#ffffff" size={22} />
          <Texte variante="titre" couleur="#ffffff">{compte.nom}</Texte>
        </View>
        <Texte chiffres couleur="#ffffff" style={{ fontWeight: '600' }}>{formatMontant(solde)}</Texte>
      </View>
      <View>
        <Texte variante="petit" couleur="rgba(255,255,255,0.8)">{LIBELLES_TYPE_COMPTE[compte.type]}</Texte>
        <Texte chiffres couleur="#ffffff" style={{ fontSize: 26, fontWeight: '700' }}>
          {formatMontant(solde)} MAD
        </Texte>
      </View>
    </Pressable>
  );
}
