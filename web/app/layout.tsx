import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./ui/theme-provider";
import { Providers } from "./providers";
import { TxStatusToast } from "@/components/shared/tx-status-toast";
import { WalletModal } from "@/components/shared/wallet-modal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://stashh-mvp.vercel.app'),

  title: "Stash",
  description: "Stablecoin banking",

  openGraph: {
    title: "Stash",
    description: "Stablecoin neobank for saving, sending, and growing digital dollars.",
    url: "https://stashh-mvp.vercel.app",
    siteName: "Stash",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Stash Stablecoin Banking",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Stash",
    description: "Stablecoin neobank for saving, sending, and growing digital dollars.",
    images: ["/opengraph-image"],
  },

  icons: {
    icon: "/icon.svg",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
            <TxStatusToast />
            <WalletModal />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
