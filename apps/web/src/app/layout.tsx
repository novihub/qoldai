import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { ToastProvider } from '@/components/toast-provider';
import { Navbar } from '@/components/navbar';
import { I18nProvider } from '@/lib/i18n';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'QoldAI - AI Help Desk | IT FEST 2025',
  description: 'Интеллектуальная система поддержки клиентов от NOVITECH',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <ErrorBoundary>
          <I18nProvider>
            <AuthProvider>
              <Navbar />
              {children}
            </AuthProvider>
          </I18nProvider>
        </ErrorBoundary>
        <ToastProvider />
      </body>
    </html>
  );
}
