import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "Circular Chef Advisor",
  description: "Recetas de reaprovechamiento generadas de forma local con Ollama.",
  openGraph: {
    title: "Circular Chef Advisor",
    description: "Convierte sobrantes en recetas con IA local.",
    images: [{ url: "/og.png", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Circular Chef Advisor",
    description: "Convierte sobrantes en recetas con IA local.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
