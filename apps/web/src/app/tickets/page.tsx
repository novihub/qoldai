'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { getMyTickets, Ticket, TicketStatus, TicketPriority } from '@/lib/api';
import { Button, Card, Badge, Spinner } from '@/components/ui';
import { useI18n } from '@/lib/i18n';

const statusColors: Record<TicketStatus, 'default' | 'secondary' | 'success' | 'warning' | 'error'> = {
  OPEN: 'default',
  IN_PROGRESS: 'warning',
  WAITING_CLIENT: 'warning',
  WAITING_OPERATOR: 'secondary',
  RESOLVED: 'success',
  CLOSED: 'secondary',
};

const priorityColors: Record<TicketPriority, 'default' | 'secondary' | 'success' | 'warning' | 'error'> = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'warning',
  URGENT: 'error',
};

export default function MyTicketsPage() {
  const router = useRouter();
  const { accessToken, isLoading: authLoading } = useAuth();
  const { t, language } = useI18n();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  useEffect(() => {
    if (!accessToken) return;

    const loadTickets = async () => {
      try {
        const data = await getMyTickets(accessToken);
        setTickets(data);
      } catch (error) {
        console.error('Failed to load tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();
  }, [accessToken]);

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    if (filter === 'open') return !['RESOLVED', 'CLOSED'].includes(ticket.status);
    if (filter === 'resolved') return ['RESOLVED', 'CLOSED'].includes(ticket.status);
    return true;
  });

  // Localized labels
  const filterLabels = {
    all: t.common.all,
    open: language === 'ru' ? 'Активные' : language === 'kz' ? 'Белсенді' : 'Active',
    resolved: language === 'ru' ? 'Решённые' : language === 'kz' ? 'Шешілген' : 'Resolved',
  };

  const dateLocale = language === 'kz' ? 'kk-KZ' : language === 'en' ? 'en-US' : 'ru-RU';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!accessToken) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.tickets.title}</h1>
            <p className="text-gray-600">
              {language === 'ru' && 'Просматривайте и управляйте вашими обращениями в службу поддержки'}
              {language === 'kz' && 'Қолдау қызметіне өтініштеріңізді қараңыз және басқарыңыз'}
              {language === 'en' && 'View and manage your support tickets'}
            </p>
          </div>
          <Link href="/tickets/new">
            <Button>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t.tickets.newTicket}
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
            }`}
          >
            {filterLabels.all} ({tickets.length})
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'open'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
            }`}
          >
            {filterLabels.open} ({tickets.filter(t => !['RESOLVED', 'CLOSED'].includes(t.status)).length})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'resolved'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
            }`}
          >
            {filterLabels.resolved} ({tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length})
          </button>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {t.tickets.noTickets}
            </div>
            <Link href="/tickets/new">
              <Button>{t.tickets.createFirst}</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4 flex flex-col gap-0.5">
            {filteredTickets.map(ticket => (
              <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                <Card className="hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={statusColors[ticket.status]}>
                            {t.status[ticket.status]}
                          </Badge>
                          <Badge variant={priorityColors[ticket.priority]}>
                            {t.priority[ticket.priority]}
                          </Badge>
                          {ticket.aiCategory && (
                            <span className="text-xs text-gray-500">
                              {ticket.aiCategory}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 truncate mb-1">
                          {ticket.subject}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {t.tickets.created}: {new Date(ticket.createdAt).toLocaleDateString(dateLocale, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {ticket._count?.messages && ticket._count.messages > 0 && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {ticket._count.messages} {t.tickets.messages.toLowerCase()}
                            </span>
                          )}
                          {ticket.operator && (
                            <span>{t.tickets.operator}: {ticket.operator.name || ticket.operator.email}</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
