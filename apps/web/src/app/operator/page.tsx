'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { 
  getAllTickets, 
  getTicketStats,
  takeTicket,
  Ticket, 
  TicketStats,
  TicketStatus, 
  TicketPriority 
} from '@/lib/api';
import { Button, Card, Badge, Spinner, Input } from '@/components/ui';
import { notify } from '@/lib/toast';
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

export default function OperatorDashboard() {
  const router = useRouter();
  const { accessToken, user, isLoading: authLoading } = useAuth();
  const { t, language } = useI18n();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [search, setSearch] = useState('');

  const dateLocale = language === 'kz' ? 'kk-KZ' : language === 'en' ? 'en-US' : 'ru-RU';

  useEffect(() => {
    if (!accessToken) return;

    const loadData = async () => {
      try {
        const [ticketsData, statsData] = await Promise.all([
          getAllTickets(accessToken, {
            status: statusFilter !== 'all' ? statusFilter : undefined,
            priority: priorityFilter !== 'all' ? priorityFilter : undefined,
            search: search || undefined,
          }),
          getTicketStats(accessToken),
        ]);
        setTickets(ticketsData);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load data:', error);
        if (error instanceof Error && error.message.includes('403')) {
          notify.error('Доступ запрещён. Эта страница только для операторов.');
          router.push('/tickets');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [accessToken, statusFilter, priorityFilter, search, router]);

  const handleTakeTicket = async (ticketId: string) => {
    if (!accessToken) return;

    try {
      await takeTicket(ticketId, accessToken);
      notify.success('Тикет взят в работу');
      // Refresh tickets
      const updated = await getAllTickets(accessToken, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: search || undefined,
      });
      setTickets(updated);
    } catch (error) {
      notify.error('Не удалось взять тикет');
    }
  };

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

  if (user?.role !== 'OPERATOR' && user?.role !== 'ADMIN') {
    router.push('/tickets');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.operator.title}</h1>
          <p className="text-gray-600">
            {t.operator.subtitle}
          </p>
        </div>

        {/* Stats - Basic Metrics */}
        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <StatCard label={t.operator.totalTickets} value={stats.totalTickets} />
              <StatCard label={t.operator.openTickets} value={stats.openTickets} color="blue" />
              <StatCard label={t.operator.inProgress} value={stats.inProgressTickets} color="yellow" />
              <StatCard label={t.operator.resolvedTickets} value={stats.resolvedTickets} color="green" />
              <StatCard label={t.operator.urgentTickets} value={stats.urgentTickets} color="red" />
              <StatCard 
                label={t.operator.avgResolutionTime}
                value={`${stats.avgResolutionTimeHours}${language === 'en' ? 'h' : 'ч'}`} 
                color="purple" 
              />
            </div>

            {/* AI & Automation Metrics Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">{t.operator.aiClassification}</p>
                      <p className="text-2xl font-bold text-blue-700">{stats.aiClassificationRate}%</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-blue-500 mt-2">{stats.aiClassifiedTickets} / {stats.totalTickets} {t.operator.tickets}</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">{t.operator.autoResolution}</p>
                      <p className="text-2xl font-bold text-green-700">{stats.autoResolutionRate}%</p>
                    </div>
                    <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-green-500 mt-2">{t.operator.goal}: 50% | {t.operator.current}: {stats.autoResolvedTickets} {t.operator.tickets}</p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">{t.operator.responseTime}</p>
                      <p className="text-2xl font-bold text-purple-700">{stats.avgFirstResponseTimeMinutes} {language === 'en' ? 'min' : 'мин'}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-purple-500 mt-2">{t.operator.avgFirstResponse}</p>
                </div>
              </Card>

              <Card className={`bg-gradient-to-br ${stats.slaComplianceRate >= 90 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${stats.slaComplianceRate >= 90 ? 'text-emerald-600' : 'text-orange-600'}`}>SLA Compliance</p>
                      <p className={`text-2xl font-bold ${stats.slaComplianceRate >= 90 ? 'text-emerald-700' : 'text-orange-700'}`}>{stats.slaComplianceRate}%</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stats.slaComplianceRate >= 90 ? 'bg-emerald-200' : 'bg-orange-200'}`}>
                      <svg className={`w-6 h-6 ${stats.slaComplianceRate >= 90 ? 'text-emerald-600' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <p className={`text-xs mt-2 ${stats.slaComplianceRate >= 90 ? 'text-emerald-500' : 'text-orange-500'}`}>{stats.slaBreachedTickets} {t.operator.slaBreaches}</p>
                </div>
              </Card>
            </div>

            {/* Distribution Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Language Distribution */}
              <Card>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">{t.operator.languageDistribution}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">🇷🇺 {t.languages.ru}</span>
                      <span className="font-medium">{stats.languageDistribution.ru}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">🇰🇿 {t.languages.kz}</span>
                      <span className="font-medium">{stats.languageDistribution.kz}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">🇬🇧 {t.languages.en}</span>
                      <span className="font-medium">{stats.languageDistribution.en}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Channel Distribution */}
              <Card>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">{t.operator.channelDistribution}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">🌐 {t.channels.web}</span>
                      <span className="font-medium">{stats.channelDistribution.web}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">📧 {t.channels.email}</span>
                      <span className="font-medium">{stats.channelDistribution.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">📱 {t.channels.telegram}</span>
                      <span className="font-medium">{stats.channelDistribution.telegram}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Sentiment Distribution */}
              <Card>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">{t.operator.sentimentDistribution}</h3>
                  <div className="space-y-2">
                    {stats.sentimentDistribution.map((s) => (
                      <div key={s.sentiment} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {s.sentiment === 'positive' && t.sentiment.positive}
                          {s.sentiment === 'neutral' && t.sentiment.neutral}
                          {s.sentiment === 'negative' && t.sentiment.negative}
                        </span>
                        <span className="font-medium">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder={t.operator.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t.operator.allStatuses}</option>
                <option value="OPEN">{t.status.OPEN}</option>
                <option value="IN_PROGRESS">{t.status.IN_PROGRESS}</option>
                <option value="WAITING_CLIENT">{t.status.WAITING_CLIENT}</option>
                <option value="WAITING_OPERATOR">{t.status.WAITING_OPERATOR}</option>
                <option value="RESOLVED">{t.status.RESOLVED}</option>
                <option value="CLOSED">{t.status.CLOSED}</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'all')}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t.operator.allPriorities}</option>
                <option value="URGENT">{t.priority.URGENT}</option>
                <option value="HIGH">{t.priority.HIGH}</option>
                <option value="MEDIUM">{t.priority.MEDIUM}</option>
                <option value="LOW">{t.priority.LOW}</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Tickets Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : tickets.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>{t.operator.noTicketsFound}</p>
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{t.tickets.subject}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{t.tickets.client}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{t.tickets.status}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{t.tickets.priority}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{t.tickets.category}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{t.tickets.created}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{t.operator.actions}</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr 
                    key={ticket.id} 
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Link 
                        href={`/tickets/${ticket.id}`}
                        className="text-gray-900 hover:text-blue-600 font-medium"
                      >
                        {ticket.subject}
                      </Link>
                      {ticket._count?.messages && ticket._count.messages > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({ticket._count.messages} сообщ.)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {ticket.client?.name || ticket.client?.email}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={statusColors[ticket.status]}>
                        {t.status[ticket.status]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={priorityColors[ticket.priority]}>
                        {t.priority[ticket.priority]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {ticket.aiCategory || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString(dateLocale)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link href={`/tickets/${ticket.id}`}>
                          <Button variant="ghost" size="sm">
                            {t.operator.open}
                          </Button>
                        </Link>
                        {!ticket.operatorId && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleTakeTicket(ticket.id)}
                          >
                            {t.operator.take}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  label, 
  value, 
  color 
}: { 
  label: string; 
  value: number | string;
  color?: 'blue' | 'yellow' | 'green' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  };

  return (
    <Card className={color ? colorClasses[color] : ''}>
      <div className="p-4 text-center">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </div>
    </Card>
  );
}
