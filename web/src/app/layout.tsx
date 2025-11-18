import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Daytona QA | AI-Powered Testing',
  description: 'AI-powered QA automation using Daytona and browser-use',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
              <div className="container mx-auto px-6 py-5">
                <div className="flex items-center justify-between">
                  {/* Logo */}
                  <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" className="text-primary" />
                        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" className="text-primary" />
                        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" className="text-primary" />
                      </svg>
                    </div>
                    <span className="text-xl font-bold text-foreground">Daytona QA</span>
                  </Link>

                  {/* Navigation */}
                  <nav className="hidden md:flex items-center gap-6">
                    <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Dashboard
                    </Link>
                    <Link href="/test-flows" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Test Flows
                    </Link>
                    <Link href="/qa-runs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      QA Runs
                    </Link>
                  </nav>
                </div>
              </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto px-6 py-12">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-border/40 mt-24">
              <div className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
                Built for Daytona Hacksprint 2025
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
