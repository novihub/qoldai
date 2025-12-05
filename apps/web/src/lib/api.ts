const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  imageUrl?: string;
}

export interface SystemPromptInfo {
  role: string;
  prompt: string;
  availableRoles: { id: string; name: string }[];
}

export async function getSystemPrompt(accessToken: string): Promise<SystemPromptInfo> {
  const response = await fetch(`${API_URL}/chat/system-prompt`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get system prompt');
  }

  return response.json();
}

export async function setSystemPrompt(
  role: string,
  accessToken: string,
  customPrompt?: string
): Promise<SystemPromptInfo> {
  const response = await fetch(`${API_URL}/chat/system-prompt`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ role, customPrompt }),
  });

  if (!response.ok) {
    throw new Error('Failed to set system prompt');
  }

  return response.json();
}

export async function sendMessage(
  message: string,
  history: ChatMessage[],
  accessToken: string,
  imageBase64?: string
): Promise<ChatMessage> {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message, history, imageBase64 }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send message');
  }

  const data = await response.json();
  return data.message;
}

export async function analyzeImage(
  prompt: string,
  imageBase64: string,
  accessToken: string
): Promise<ChatMessage> {
  const response = await fetch(`${API_URL}/chat/vision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ prompt, imageBase64 }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to analyze image');
  }

  const data = await response.json();
  return data.message;
}

export function getGoogleAuthUrl(): string {
  return `${API_URL}/auth/google`;
}

export function getGithubAuthUrl(): string {
  return `${API_URL}/auth/github`;
}

// ============ CHAT HISTORY API ============

export interface ChatSummary {
  id: string;
  title: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
}

export interface ChatWithMessages {
  id: string;
  title: string | null;
  role: string;
  createdAt: string;
  messages: ChatMessage[];
}

export async function createChat(accessToken: string, title?: string, role?: string): Promise<{ id: string }> {
  const response = await fetch(`${API_URL}/chat/history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ title, role }),
  });

  if (!response.ok) throw new Error('Failed to create chat');
  return response.json();
}

export async function getUserChats(accessToken: string): Promise<ChatSummary[]> {
  const response = await fetch(`${API_URL}/chat/history`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error('Failed to get chats');
  return response.json();
}

export async function getChatWithMessages(chatId: string, accessToken: string): Promise<ChatWithMessages> {
  const response = await fetch(`${API_URL}/chat/history/${chatId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error('Failed to get chat');
  return response.json();
}

export async function addMessageToChat(
  chatId: string,
  role: 'user' | 'assistant',
  content: string,
  accessToken: string,
  imageUrl?: string
): Promise<ChatMessage> {
  const response = await fetch(`${API_URL}/chat/history/${chatId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ role, content, imageUrl }),
  });

  if (!response.ok) throw new Error('Failed to add message');
  return response.json();
}

export async function deleteChat(chatId: string, accessToken: string): Promise<void> {
  const response = await fetch(`${API_URL}/chat/history/${chatId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error('Failed to delete chat');
}

export async function updateChatTitle(chatId: string, title: string, accessToken: string): Promise<void> {
  const response = await fetch(`${API_URL}/chat/history/${chatId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) throw new Error('Failed to update chat');
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

// ============ TICKET API ============

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'WAITING_OPERATOR' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Channel = 'WEB' | 'PHONE' | 'EMAIL' | 'TELEGRAM' | 'WHATSAPP';
export type Language = 'RU' | 'KZ' | 'EN';
export type UserRole = 'CLIENT' | 'OPERATOR' | 'ADMIN';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  channel: Channel;
  language: Language;
  aiCategory?: string;
  aiSentiment?: string;
  aiSummary?: string;
  aiSuggestedReply?: string;
  clientId: string;
  client?: { id: string; name?: string; email: string; image?: string };
  operatorId?: string;
  operator?: { id: string; name?: string; email: string; image?: string };
  departmentId?: string;
  department?: { id: string; name: string };
  slaDeadline?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
  attachments?: Attachment[];
  _count?: { messages: number };
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  content: string;
  isAiGenerated: boolean;
  createdAt: string;
  sender?: { id: string; name?: string; image?: string; role: UserRole };
}

export interface Attachment {
  id: string;
  ticketId: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface CreateTicketDto {
  subject: string;
  description: string;
  channel?: Channel;
  language?: Language;
}

export interface UpdateTicketDto {
  subject?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  operatorId?: string;
  departmentId?: string;
}

export interface TicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  urgentTickets: number;
  
  // AI & Automation metrics
  aiClassifiedTickets: number;
  aiClassificationRate: number;
  autoResolvedTickets: number;
  autoResolutionRate: number;
  
  // Response times
  avgResolutionTimeHours: number;
  avgFirstResponseTimeMinutes: number;
  
  // SLA
  slaBreachedTickets: number;
  slaComplianceRate: number;
  
  // Distributions
  channelDistribution: { web: number; email: number; telegram: number };
  languageDistribution: { ru: number; kz: number; en: number };
  categoryDistribution: { category: string; count: number }[];
  sentimentDistribution: { sentiment: string; count: number }[];
}

// Create new ticket
export async function createTicket(dto: CreateTicketDto, accessToken: string): Promise<Ticket> {
  const response = await fetch(`${API_URL}/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create ticket');
  }

  return response.json();
}

// Get user's tickets
export async function getMyTickets(accessToken: string): Promise<Ticket[]> {
  const response = await fetch(`${API_URL}/tickets/my`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error('Failed to get tickets');
  return response.json();
}

// Get all tickets (for operators/admins)
export async function getAllTickets(
  accessToken: string,
  filters?: { status?: TicketStatus; priority?: TicketPriority; search?: string }
): Promise<Ticket[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.search) params.append('search', filters.search);

  const response = await fetch(`${API_URL}/tickets?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error('Failed to get tickets');
  return response.json();
}

// Get assigned tickets (for operators)
export async function getAssignedTickets(accessToken: string): Promise<Ticket[]> {
  const response = await fetch(`${API_URL}/tickets/assigned`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error('Failed to get assigned tickets');
  return response.json();
}

// Get single ticket
export async function getTicket(ticketId: string, accessToken: string): Promise<Ticket> {
  const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error('Failed to get ticket');
  return response.json();
}

// Update ticket
export async function updateTicket(
  ticketId: string,
  dto: UpdateTicketDto,
  accessToken: string
): Promise<Ticket> {
  const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) throw new Error('Failed to update ticket');
  return response.json();
}

// Add message to ticket
export async function addTicketMessage(
  ticketId: string,
  content: string,
  accessToken: string
): Promise<TicketMessage> {
  const response = await fetch(`${API_URL}/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
}

// Get AI suggestion (for operators)
export async function getAiSuggestion(
  ticketId: string,
  accessToken: string
): Promise<{ suggestion: string }> {
  const response = await fetch(`${API_URL}/tickets/${ticketId}/suggestion`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error('Failed to get AI suggestion');
  return response.json();
}

// Summarize ticket (for operators)
export async function summarizeTicket(
  ticketId: string,
  accessToken: string
): Promise<{ summary: string }> {
  const response = await fetch(`${API_URL}/tickets/${ticketId}/summarize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error('Failed to summarize ticket');
  return response.json();
}

// Take ticket (self-assign for operators)
export async function takeTicket(ticketId: string, accessToken: string): Promise<Ticket> {
  const response = await fetch(`${API_URL}/tickets/${ticketId}/take`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error('Failed to take ticket');
  return response.json();
}

// Get ticket stats (for operators/admins)
export async function getTicketStats(accessToken: string): Promise<TicketStats> {
  const response = await fetch(`${API_URL}/tickets/stats`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error('Failed to get stats');
  return response.json();
}


// Timeline stats type
export interface TimelineData {
  date: string;
  created: number;
  resolved: number;
  [key: string]: unknown;
}

export interface TimelineStats {
  timeline: TimelineData[];
}

// Get timeline stats (last 7 days)
export async function getTimelineStats(accessToken: string): Promise<TimelineStats> {
  const response = await fetch(`${API_URL}/tickets/stats/timeline`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error('Failed to get timeline stats');
  return response.json();
}
