import type {
  CategoryKind,
  ConnectorType,
  InverterType,
  OrderStatus,
  PanelType,
  PaymentMethod,
} from "@prisma/client";

/** Etiquetas legibles para los enums de Prisma (UI en español). */

export const CATEGORY_KIND_LABELS: Record<CategoryKind, string> = {
  EV_ACCESSORY: "Accesorios EV",
  RENEWABLE_ENERGY: "Energía renovable",
};

export const CONNECTOR_LABELS: Record<ConnectorType, string> = {
  TYPE1: "Tipo 1 (J1772)",
  TYPE2: "Tipo 2 (Mennekes)",
  CCS1: "CCS1",
  CCS2: "CCS2",
  CHADEMO: "CHAdeMO",
  GBT: "GB/T",
  NACS: "NACS (Tesla)",
};

export const PANEL_LABELS: Record<PanelType, string> = {
  MONOCRYSTALLINE: "Monocristalino",
  POLYCRYSTALLINE: "Policristalino",
  BIFACIAL: "Bifacial",
  THIN_FILM: "Capa fina",
};

export const INVERTER_LABELS: Record<InverterType, string> = {
  HYBRID: "Híbrido",
  ON_GRID: "On-grid",
  OFF_GRID: "Off-grid",
  MICROINVERTER: "Microinversor",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  PROCESSING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-sky-100 text-sky-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-violet-100 text-violet-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-slate-200 text-slate-700",
  REFUNDED: "bg-rose-100 text-rose-800",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CARD: "Tarjeta de crédito/débito",
  PSE: "PSE (débito bancario)",
  PAYPAL: "PayPal",
  STRIPE: "Stripe",
};

/** Rangos de potencia para el filtro del catálogo (kW). */
export const POWER_RANGES = [
  { value: "0-3.7", label: "Hasta 3.7 kW" },
  { value: "3.7-7.4", label: "3.7 – 7.4 kW" },
  { value: "7.4-11", label: "7.4 – 11 kW" },
  { value: "11-22", label: "11 – 22 kW" },
  { value: "22-1000", label: "Más de 22 kW" },
] as const;

export const PAGE_SIZE = 12;
