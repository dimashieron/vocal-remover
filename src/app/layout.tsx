import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VocalSplit — AI Vocal Remover",
  description: "Pisahkan vokal dari instrumental secara gratis, langsung di browser. Tidak perlu upload ke server. Zero cost, 100% privat.",
  keywords: ["vocal remover", "karaoke maker", "instrumental extractor", "music separator"],
  openGraph: {
    title: "VocalSplit — AI Vocal Remover",
    description: "Pisahkan vokal dari instrumental secara gratis, langsung di browser.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
