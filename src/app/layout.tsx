import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth";
import './globals.css';

export const metadata: Metadata = {
  title: 'MagicBox',
  description: 'Turn Your Expertise Into AI Solutions',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen font-body antialiased bg-background text-foreground flex flex-col">
        <AuthProvider>
          <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
