'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth-provider';
import { Avatar, Button } from './ui';
import { useI18n, LanguageSwitcher } from '@/lib/i18n';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useI18n();

  const isOperator = user?.role === 'OPERATOR' || user?.role === 'ADMIN';

  const navItems = [
    { href: '/tickets/new', label: t.nav.newTicket, show: true },
    { href: '/tickets', label: t.nav.myTickets, show: true },
    { href: '/operator', label: t.nav.operatorPanel, show: isOperator },
  ];

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/tickets" className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">QoldAI</span>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.filter(item => item.show).map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="hidden sm:flex items-center gap-2">
              <Avatar src={user.image} name={user.name || user.email} size="sm" />
              <div className="text-sm">
                <p className="text-gray-900 font-medium">{user.name || user.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role?.toLowerCase()}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              {t.nav.logout}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 flex gap-1 overflow-x-auto">
          {navItems.filter(item => item.show).map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
