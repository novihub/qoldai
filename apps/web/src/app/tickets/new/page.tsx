'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { createTicket } from '@/lib/api';
import { Button, Input, Textarea, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { notify } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';

export default function CreateTicketPage() {
  const router = useRouter();
  const { accessToken, isLoading: authLoading } = useAuth();
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessToken) {
      notify.error(t.errors.accessDenied);
      router.push('/auth/login');
      return;
    }

    if (!subject.trim() || !description.trim()) {
      notify.error(t.errors.somethingWrong);
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await createTicket(
        { subject: subject.trim(), description: description.trim() },
        accessToken
      );
      notify.success(t.common.success);
      router.push(`/tickets/${ticket.id}`);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : t.errors.somethingWrong);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!accessToken) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t.common.back}
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.tickets.newTicket}</h1>
          <p className="text-gray-600">
            {t.newTicket.description}
          </p>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>{t.tickets.createTicket}</CardTitle>
              <CardDescription>
                {t.newTicket.helpText}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.tickets.subject}
                </label>
                <Input
                  id="subject"
                  placeholder={t.newTicket.subjectPlaceholder}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.tickets.description}
                </label>
                <Textarea
                  id="description"
                  placeholder={t.newTicket.descriptionPlaceholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  rows={8}
                />
              </div>

              {/* AI Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="shrink-0">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">{t.newTicket.aiAssistant}</h4>
                    <p className="text-sm text-gray-600">
                      {t.newTicket.aiInfo}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                {t.common.cancel}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !subject.trim() || !description.trim()}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t.common.loading}
                  </>
                ) : (
                  t.tickets.createTicket
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
