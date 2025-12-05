'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { 
  getTicket, 
  addTicketMessage, 
  updateTicket,
  getAiSuggestion,
  summarizeTicket,
  Ticket, 
  TicketMessage,
  TicketStatus, 
  TicketPriority,
  UserRole,
} from '@/lib/api';
import { Button, Input, Card, Badge, Spinner, Avatar } from '@/components/ui';
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

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  const { accessToken, user, isLoading: authLoading } = useAuth();
  const { t, language } = useI18n();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isOperator = user?.role === 'OPERATOR' || user?.role === 'ADMIN';
  const dateLocale = language === 'kz' ? 'kk-KZ' : language === 'en' ? 'en-US' : 'ru-RU';

  // Initial load
  useEffect(() => {
    if (!accessToken || !ticketId) return;

    const loadTicket = async () => {
      try {
        const data = await getTicket(ticketId, accessToken);
        setTicket(data);
        setLastMessageCount(data.messages?.length || 0);
      } catch (error) {
        console.error('Failed to load ticket:', error);
        notify.error(t.errors.somethingWrong);
        router.push('/tickets');
      } finally {
        setIsLoading(false);
      }
    };

    loadTicket();
  }, [accessToken, ticketId, router]);

  // Real-time polling for new messages (every 5 seconds)
  useEffect(() => {
    if (!accessToken || !ticketId || isLoading) return;

    const pollMessages = async () => {
      try {
        const data = await getTicket(ticketId, accessToken);
        const newMessageCount = data.messages?.length || 0;
        
        // Only update if there are new messages
        if (newMessageCount > lastMessageCount) {
          setTicket(data);
          setLastMessageCount(newMessageCount);
          
          // Show notification if new message from someone else
          const lastMessage = data.messages?.[data.messages.length - 1];
          if (lastMessage && lastMessage.senderId !== user?.id) {
            notify.info(language === 'ru' ? 'Новое сообщение' : language === 'kz' ? 'Жаңа хабарлама' : 'New message');
          }
        }
        
        // Also update status if changed
        if (data.status !== ticket?.status) {
          setTicket(prev => prev ? { ...prev, status: data.status } : null);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    const intervalId = setInterval(pollMessages, 1000);
    
    return () => clearInterval(intervalId);
  }, [accessToken, ticketId, isLoading, lastMessageCount, user?.id, ticket?.status, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !message.trim() || !ticket) return;

    setIsSending(true);
    try {
      const newMessage = await addTicketMessage(ticket.id, message.trim(), accessToken);
      setTicket(prev => prev ? {
        ...prev,
        messages: [...(prev.messages || []), newMessage],
      } : null);
      setMessage('');
      setAiSuggestion(null);
      notify.success(t.common.success);
    } catch (error) {
      notify.error(t.errors.somethingWrong);
    } finally {
      setIsSending(false);
    }
  };

  const handleGetSuggestion = async () => {
    if (!accessToken || !ticket) return;

    setIsLoadingSuggestion(true);
    try {
      const result = await getAiSuggestion(ticket.id, accessToken);
      setAiSuggestion(result.suggestion);
    } catch (error) {
      notify.error(t.errors.somethingWrong);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleUseSuggestion = () => {
    if (aiSuggestion) {
      setMessage(aiSuggestion);
      setAiSuggestion(null);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!accessToken || !ticket) return;

    try {
      const updated = await updateTicket(ticket.id, { status: newStatus }, accessToken);
      setTicket(prev => prev ? { ...prev, ...updated } : null);
      notify.success(t.common.success);
    } catch (error) {
      notify.error(t.common.error);
    }
  };

  const handleSummarize = async () => {
    if (!accessToken || !ticket) return;

    setIsSummarizing(true);
    try {
      const result = await summarizeTicket(ticket.id, accessToken);
      setTicket(prev => prev ? { ...prev, aiSummary: result.summary } : null);
      notify.success(t.common.success);
    } catch (error) {
      notify.error(t.errors.somethingWrong);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (authLoading || isLoading) {
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

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{t.errors.notFound}</p>
          <Button onClick={() => router.push('/tickets')}>{t.common.back}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t.common.back}
          </button>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={statusColors[ticket.status]}>
                  {t.status[ticket.status]}
                </Badge>
                <Badge variant={priorityColors[ticket.priority]}>
                  {t.priority[ticket.priority]}
                </Badge>
                {ticket.aiCategory && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {ticket.aiCategory}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{ticket.subject}</h1>
              <p className="text-sm text-gray-500">
                {t.tickets.created}: {new Date(ticket.createdAt).toLocaleString(dateLocale)}
                {ticket.operator && (
                  <> · {t.tickets.operator}: {ticket.operator.name || ticket.operator.email}</>
                )}
              </p>
            </div>

            {/* Status Change (for operators) */}
            {isOperator && (
              <div className="shrink-0">
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OPEN">{t.status.OPEN}</option>
                  <option value="IN_PROGRESS">{t.status.IN_PROGRESS}</option>
                  <option value="WAITING_CLIENT">{t.status.WAITING_CLIENT}</option>
                  <option value="WAITING_OPERATOR">{t.status.WAITING_OPERATOR}</option>
                  <option value="RESOLVED">{t.status.RESOLVED}</option>
                  <option value="CLOSED">{t.status.CLOSED}</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Original Description */}
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">{t.tickets.problemDescription}</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </Card>

            {/* AI Auto-Reply (if exists) */}
            {ticket.aiSuggestedReply && (
              <Card className="border-blue-200 bg-blue-50">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="text-sm font-medium text-blue-800">{t.tickets.autoReply}</h3>
                  </div>
                  <p className="text-gray-700">{ticket.aiSuggestedReply}</p>
                </div>
              </Card>
            )}

            {/* Messages */}
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-4">
                  {t.tickets.messages} ({ticket.messages?.length || 0})
                </h3>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {ticket.messages?.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} currentUserId={user?.id} t={t} dateLocale={dateLocale} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {ticket.status !== 'CLOSED' && (
                  <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-gray-200">
                    {/* AI Suggestion for operators */}
                    {isOperator && aiSuggestion && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-blue-600 font-medium">{t.tickets.aiSuggestion}</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleUseSuggestion}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              {t.tickets.useSuggestion}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAiSuggestion(null)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              {t.tickets.rejectSuggestion}
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{aiSuggestion}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {isOperator && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleGetSuggestion}
                          disabled={isLoadingSuggestion}
                          className="shrink-0"
                        >
                          {isLoadingSuggestion ? (
                            <Spinner size="sm" />
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          )}
                        </Button>
                      )}
                      <Input
                        placeholder={t.tickets.writeMessage}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isSending}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={isSending || !message.trim()}>
                        {isSending ? <Spinner size="sm" /> : t.common.send}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Ticket Info */}
            <Card>
              <div className="p-4 space-y-4">
                <h3 className="font-medium text-gray-900">{t.tickets.ticketInfo}</h3>
                
                <div>
                  <span className="text-xs text-gray-500">{t.tickets.client}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar 
                      src={ticket.client?.image} 
                      name={ticket.client?.name || ticket.client?.email} 
                      size="sm" 
                    />
                    <span className="text-sm text-gray-900">
                      {ticket.client?.name || ticket.client?.email}
                    </span>
                  </div>
                </div>

                {ticket.operator && (
                  <div>
                    <span className="text-xs text-gray-500">{t.tickets.operator}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar 
                        src={ticket.operator.image} 
                        name={ticket.operator.name || ticket.operator.email} 
                        size="sm" 
                      />
                      <span className="text-sm text-gray-900">
                        {ticket.operator.name || ticket.operator.email}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-xs text-gray-500">{t.tickets.channel}</span>
                  <p className="text-sm text-gray-900 mt-1">{ticket.channel}</p>
                </div>

                <div>
                  <span className="text-xs text-gray-500">{t.tickets.language}</span>
                  <p className="text-sm text-gray-900 mt-1">{ticket.language}</p>
                </div>

                {ticket.slaDeadline && (
                  <div>
                    <span className="text-xs text-gray-500">{t.tickets.slaDeadline}</span>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(ticket.slaDeadline).toLocaleString(dateLocale)}
                    </p>
                  </div>
                )}

                {ticket.resolvedAt && (
                  <div>
                    <span className="text-xs text-gray-500">{t.tickets.resolved}</span>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(ticket.resolvedAt).toLocaleString(dateLocale)}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* AI Analysis - Always show for operators */}
            {isOperator && (
              <Card className="border-blue-200 bg-blue-50/50">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <h3 className="font-medium text-blue-800">{t.tickets.aiAnalysis}</h3>
                    </div>
                  </div>

                  {ticket.aiCategory && (
                    <div>
                      <span className="text-xs text-gray-500">{t.tickets.category}</span>
                      <p className="text-sm text-gray-900 mt-1 capitalize">{ticket.aiCategory}</p>
                    </div>
                  )}

                  {ticket.aiSentiment && (
                    <div>
                      <span className="text-xs text-gray-500">{t.tickets.sentiment}</span>
                      <p className="text-sm mt-1">
                        {ticket.aiSentiment === 'positive' && <span className="text-green-600">{t.sentiment.positive}</span>}
                        {ticket.aiSentiment === 'neutral' && <span className="text-gray-600">{t.sentiment.neutral}</span>}
                        {ticket.aiSentiment === 'negative' && <span className="text-red-600">{t.sentiment.negative}</span>}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-blue-200 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">{t.tickets.summary}</span>
                      {!ticket.aiSummary && (
                        <button
                          onClick={handleSummarize}
                          disabled={isSummarizing}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          {isSummarizing ? (
                            <>
                              <Spinner size="sm" />
                              {t.common.loading}
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              {t.tickets.generateSummary}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {ticket.aiSummary ? (
                      <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-blue-100">
                        {ticket.aiSummary}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        {t.tickets.summaryNotCreated}
                      </p>
                    )}
                  </div>

                  {ticket.aiSuggestedReply && (
                    <div className="border-t border-blue-200 pt-3">
                      <span className="text-xs text-gray-500">{t.tickets.suggestedReply}</span>
                      <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-blue-100 mt-2">
                        {ticket.aiSuggestedReply}
                      </p>
                      <button
                        onClick={() => setMessage(ticket.aiSuggestedReply || '')}
                        className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                      >
                        {t.tickets.useAsReply}
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* AI Analysis for clients (simplified) */}
            {!isOperator && (ticket.aiCategory || ticket.aiSentiment) && (
              <Card className="border-blue-200">
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h3 className="font-medium text-blue-800">{t.tickets.aiAnalysis}</h3>
                  </div>

                  {ticket.aiCategory && (
                    <div>
                      <span className="text-xs text-gray-500">{t.tickets.category}</span>
                      <p className="text-sm text-gray-900 mt-1">{ticket.aiCategory}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message, currentUserId, t, dateLocale }: { 
  message: TicketMessage; 
  currentUserId?: string;
  t: any;
  dateLocale: string;
}) {
  const isOwn = message.senderId === currentUserId;
  
  const roleLabels: Record<string, string> = {
    OPERATOR: t.tickets.operator,
    ADMIN: 'Admin',
  };
  
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
        <div className="flex items-center gap-2 mb-1">
          {!isOwn && (
            <Avatar 
              src={message.sender?.image} 
              name={message.sender?.name || 'User'} 
              size="xs" 
            />
          )}
          <span className="text-xs text-gray-500">
            {message.sender?.name || t.tickets.client}
            {message.isAiGenerated && (
              <span className="ml-1 text-blue-500">(AI)</span>
            )}
            {message.sender?.role && message.sender.role !== 'CLIENT' && (
              <span className="ml-1 text-green-600">
                ({roleLabels[message.sender.role] || message.sender.role})
              </span>
            )}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(message.createdAt).toLocaleTimeString(dateLocale, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwn
              ? 'bg-blue-600 text-white'
              : message.isAiGenerated
              ? 'bg-blue-50 border border-blue-200 text-gray-700'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
