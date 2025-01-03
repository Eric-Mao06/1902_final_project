import localFont from 'next/font/local';
import './globals.css';
import { Providers } from './providers';
import Header from '../components/header';
import MetaTags from '../components/meta-tags';
import { Toaster } from "@/components/ui/sonner"

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <MetaTags />
      </head>
      <body className="antialiased min-h-screen flex flex-col overflow-auto" suppressHydrationWarning>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Toaster position="top-center" />
          </div>
        </Providers>
      </body>
    </html>
  );
}
