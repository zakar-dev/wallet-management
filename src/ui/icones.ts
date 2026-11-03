import {
  ArrowLeftRight, Baby, Banknote, Bath, Briefcase, Bus, Car, CirclePlus, Coffee, Dumbbell, Ellipsis, Fuel,
  Gamepad2, Gift, GraduationCap, HandCoins, HeartPulse, House, Key, PawPrint, PiggyBank, Plane, Repeat,
  Shield, Shirt, ShoppingBag, ShoppingCart, Smartphone, Tag, Utensils, Wallet, Wifi, Zap,
  type LucideIcon,
} from 'lucide-react-native';
import type { TypeCompte } from '@/src/domaine/types';

export const ICONES: Record<string, LucideIcon> = {
  'briefcase': Briefcase, 'key': Key, 'gift': Gift, 'tag': Tag, 'circle-plus': CirclePlus,
  'house': House, 'zap': Zap, 'wifi': Wifi, 'shield': Shield, 'repeat': Repeat,
  'shopping-cart': ShoppingCart, 'fuel': Fuel, 'coffee': Coffee, 'utensils': Utensils, 'bath': Bath,
  'bus': Bus, 'car': Car, 'heart-pulse': HeartPulse, 'shopping-bag': ShoppingBag, 'gamepad-2': Gamepad2,
  'graduation-cap': GraduationCap, 'baby': Baby, 'plane': Plane, 'smartphone': Smartphone, 'shirt': Shirt,
  'dumbbell': Dumbbell, 'paw-print': PawPrint, 'hand-coins': HandCoins, 'ellipsis': Ellipsis,
  'wallet': Wallet, 'piggy-bank': PiggyBank, 'banknote': Banknote, 'arrow-left-right': ArrowLeftRight,
};

export function iconeDe(nom: string): LucideIcon {
  return ICONES[nom] ?? Ellipsis;
}

export const ICONE_TYPE_COMPTE: Record<TypeCompte, string> = {
  courant: 'wallet', epargne: 'piggy-bank', especes: 'banknote',
};
