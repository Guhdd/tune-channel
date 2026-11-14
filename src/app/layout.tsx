import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Tune — Web TV",
  description: "Uma grade contínua de conteúdos exibidos pelo player oficial do YouTube.",
  icons: {
    icon: "/tune-symbol-red.png",
    shortcut: "/tune-symbol-red.png",
    apple: "/tune-symbol-red.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="dark">
      <body>{children}</body>
    </html>
  );
}
