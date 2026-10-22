import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/cart-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Positive Energy — Accesorios para vehículos eléctricos y energía solar",
    template: "%s | Positive Energy",
  },
  description:
    "Cargadores, adaptadores Tipo 1/Tipo 2/CCS2, cables de carga, paneles solares, inversores híbridos y baterías LiFePO4.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-slate-50 font-sans text-slate-900 antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
