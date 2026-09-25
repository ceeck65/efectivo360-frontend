import {
  BadgeCheck,
  Clock,
  Coins,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  Star,
  Store,
  Tag,
  Truck,
  Wrench,
} from 'lucide-vue-next';
import type { Component } from 'vue';

// Íconos de las "ventajas" de la tienda (las claves las valida el backend).
export const BENEFIT_ICONS: Record<string, { icon: Component; label: string }> = {
  truck: { icon: Truck, label: 'Envíos' },
  coins: { icon: Coins, label: 'Pagos / monedas' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp' },
  shield: { icon: ShieldCheck, label: 'Garantía' },
  clock: { icon: Clock, label: 'Horario / rapidez' },
  tag: { icon: Tag, label: 'Ofertas' },
  wrench: { icon: Wrench, label: 'Servicio técnico' },
  star: { icon: Star, label: 'Calidad' },
  store: { icon: Store, label: 'Tienda física' },
  card: { icon: CreditCard, label: 'Tarjetas / pago móvil' },
};

export function benefitIcon(key: string): Component {
  return BENEFIT_ICONS[key]?.icon || BadgeCheck;
}
