
import React, { useState, useEffect, useRef } from 'react';
import { Send, Headphones, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';
import { SupportMessage, User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { logger } from '../utils/logger';
import { validateMessage, sanitizeInput, checkSpamAndProfanity, MAX_LENGTHS } from '../utils/validation';
import { useToast } from '../contexts/ToastContext';

interface SupportProps {
  currentUser: User;
}

export const Support: React.FC<SupportProps> = ({ currentUser }) => {
  const { t } = useLanguage();
  const { notify } = useToast();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // Fetch the specific ticket for this user
    const loadMessages = async (silent = false) => {
      // Prevent concurrent polling
      if (isPollingRef.current && silent) return;

      try {
        if (!silent && isMounted) setIsLoading(true);
        const ticket = await api.getUserTicket(currentUser.id);

        if (!isMounted) return; // Component unmounted

        if (ticket) {
          const newMessages = ticket.messages;

          // Check if we have new messages by comparing IDs
          setMessages(prevMessages => {
            // If lengths differ, definitely update
            if (newMessages.length !== prevMessages.length) {
              if (newMessages.length > 0 && isMounted) {
                setLastMessageId(newMessages[newMessages.length - 1].id);
              }
              return newMessages;
            }

            // If same length, check if last message ID changed
            if (newMessages.length > 0) {
              const lastNewId = newMessages[newMessages.length - 1].id;
              const lastPrevId = prevMessages.length > 0 ? prevMessages[prevMessages.length - 1].id : null;

              if (lastNewId !== lastPrevId) {
                if (isMounted) {
                  setLastMessageId(lastNewId);
                }
                return newMessages;
              }
            }

            // No changes detected
            return prevMessages;
          });
        } else {
          // No ticket exists yet - clear messages only if we had messages
          setMessages(prevMessages => {
            if (prevMessages.length > 0) {
              if (isMounted) {
                setLastMessageId(null);
              }
              return [];
            }
            return prevMessages;
          });
        }
      } catch (error) {
        logger.error('Load support messages error:', error);
        if (!silent && isMounted) {
          notify(t('support.load_error'), 'error');
        }
      } finally {
        if (!silent && isMounted) setIsLoading(false);
        isPollingRef.current = false;
      }
    };

    // Load immediately
    loadMessages(false);

    // Optimized polling: Poll every 3 seconds for better real-time feel
    // Check for new messages only (silent mode)
    const POLLING_INTERVAL = 3000; // 3 seconds - faster updates
    pollingIntervalRef.current = setInterval(() => {
      if (isMounted) {
        isPollingRef.current = true;
        loadMessages(true); // Silent polling
      }
    }, POLLING_INTERVAL);

    // Cleanup: Always clear interval on unmount or dependency change
    return () => {
      isMounted = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      isPollingRef.current = false;
    };
  }, [currentUser.id]); // Only depend on user ID, not messages or lastMessageId

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [isSending, setIsSending] = useState(false);

  /**
   * Handle sending a support message
   * 
   * SECURITY FEATURES:
   * - Prevents race conditions with sending flag
   * - Validates and sanitizes input
   * - Checks for spam and profanity
   * - Handles errors gracefully
   * - Uses optimistic updates for better UX
   */
  const handleSend = async () => {
    // SECURITY: Prevent race condition - check if already sending
    if (!input.trim() || isSending) return;

    // SECURITY: Validate message length and format
    const validation = validateMessage(input);
    if (!validation.valid) {
      notify(validation.error || t('support.invalid_msg'), 'error');
      return;
    }

    // SECURITY: Check for spam and profanity
    const spamCheck = checkSpamAndProfanity(input);
    if (spamCheck.isSpam) {
      notify(spamCheck.reason || t('support.spam_error'), 'error');
      return;
    }

    // SECURITY: Sanitize input to prevent XSS attacks
    const sanitizedText = sanitizeInput(input.trim());

    // SECURITY: Prevent race condition - set sending flag before clearing input
    setIsSending(true);
    const messageToSend = sanitizedText;
    setInput(''); // Clear input early for better UX

    // SECURITY: Optimistic update with unique ID to prevent duplicates
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const tempMsg: SupportMessage = {
      id: tempId,
      text: messageToSend,
      sender: 'user',
      timestamp: Date.now()
    };

    // Add optimistic message immediately for better UX
    setMessages(prev => [...prev, tempMsg]);

    try {
      // SECURITY: Send to API with error handling
      const sentMessage = await api.sendSupportMessage(messageToSend, currentUser);

      // SECURITY: Validate response before updating
      if (!sentMessage || !sentMessage.id) {
        throw new Error('Server javob bermadi. Iltimos, qayta urinib ko\'ring.');
      }

      // Replace optimistic message with real message from server
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempId);
        const updated = [...filtered, sentMessage];

        // Update last message ID for polling
        setLastMessageId(sentMessage.id);

        return updated;
      });

      // Success notification
      notify(t('support.send_success'), 'success');

      // SECURITY: Scroll to bottom after message is sent
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);

      // Also scroll after message renders
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);

    } catch (error: unknown) {
      // SECURITY: Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(messageToSend); // Restore input on error

      // SECURITY: Log error for debugging
      const errorMessage = error instanceof Error ? error.message : t('common.error');
      logger.error('Send support message error:', error);

      // SECURITY: Show user-friendly error message
      notify(errorMessage, 'error');
    } finally {
      // SECURITY: Always reset sending flag to prevent race conditions
      setIsSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col max-w-4xl mx-auto">
      <div className="bg-white/80 dark:bg-[#1a1a1e]/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-full relative">
        {/* Gradient Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl -z-10"></div>

        {/* Header */}
        <div className="p-6 border-b border-white/20 dark:border-white/5 bg-gradient-to-r from-indigo-50/50 to-violet-50/50 dark:from-indigo-500/5 dark:to-violet-500/5 flex items-center gap-4 relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Headphones size={26} strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('support.title')}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">{t('support.subtitle')}</p>
          </div>
          {messages.length > 0 && (
            <div className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold">
              {messages.length} xabar
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50/30 to-transparent dark:from-black/20 dark:to-transparent relative">
          {isLoading && messages.length === 0 && (
            <div className="flex flex-col justify-center items-center h-full text-slate-400">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-medium">{t('common.loading')}</p>
            </div>
          )}
          {!isLoading && messages.length === 0 && (
            <div className="flex flex-col justify-center items-center h-full text-slate-400">
              <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mb-4">
                <Headphones size={32} className="text-indigo-500 dark:text-indigo-400 opacity-50" />
              </div>
              <p className="text-sm font-medium">{t('support.placeholder')}</p>
              <p className="text-xs mt-2 opacity-70">{t('support.input_hint')}</p>
            </div>
          )}
          {messages.map((msg, index) => {
            // Check if this is a temporary message (optimistic update)
            const isTemp = msg.id.startsWith('temp-');
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''} animate-fade-in ${isTemp ? 'opacity-70' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {msg.sender === 'admin' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
                    A
                  </div>
                )}
                <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm relative ${msg.sender === 'user'
                  ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm'
                  : 'bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-tl-sm backdrop-blur-md'
                  }`}>
                  {isTemp && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  )}
                  {msg.sender === 'admin' && (
                    <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1.5 uppercase tracking-wide">
                      {t('support.admin_label')}
                    </div>
                  )}
                  <p className="text-[15px] leading-relaxed font-medium whitespace-pre-wrap">{sanitizeInput(msg.text)}</p>
                  <span className={`text-[10px] mt-2 block opacity-70 ${msg.sender === 'user' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isTemp && <span className="ml-2 text-yellow-300">{t('support.sending')}</span>}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 bg-white/60 dark:bg-[#1a1a1e]/60 border-t border-white/20 dark:border-white/5 backdrop-blur-xl">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= MAX_LENGTHS.MESSAGE) {
                    setInput(value);
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={t('support.placeholder')}
                maxLength={MAX_LENGTHS.MESSAGE}
                className="w-full bg-white dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 pr-14 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 backdrop-blur-sm shadow-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-bold">
                Enter
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white rounded-2xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-95 flex items-center gap-2 font-bold relative overflow-hidden"
            >
              {isSending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">{t('support.sending')}</span>
                </>
              ) : (
                <>
                  <Send size={20} strokeWidth={2.5} />
                  <span className="hidden sm:inline">{t('support.send_btn')}</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">
            {t('support.footer_hint')}
          </p>
        </div>
      </div>
    </div >
  );
};
