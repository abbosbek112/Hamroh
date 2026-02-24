import React, { useRef } from 'react';
import {
    X, Hash, Users, Crown, Settings, Trash2, LogOut, Pin, Search,
    MessageCircle, EllipsisVertical, Reply, Edit3, CheckCheck, Check, Send,
    CheckCircle2
} from 'lucide-react';
import { User, CommunityGroup, GroupMessage } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { UserBadge } from '../UserBadge';
import { MAX_LENGTHS, limitLength } from '../../utils/validation';

interface GroupChatProps {
    currentUser: User;
    selectedGroup: CommunityGroup;
    messages: GroupMessage[];
    messageInput: string;
    setMessageInput: (input: string) => void;
    messageSearchQuery: string;
    setMessageSearchQuery: (query: string) => void;
    onSendMessage: () => void;
    onBack: () => void;
    onShowMembers: () => void;
    onEditGroup: () => void;
    onClearHistory: () => void;
    onDeleteGroup: () => void;
    onLeaveGroup: () => void;
    onDeleteMessage: (msgId: string) => void;
    onEditMessage: (msgId: string) => void;
    onReplyMessage: (msg: GroupMessage) => void;
    onPinMessage: (msg: GroupMessage) => void;
    onUnpinMessage: () => void;
    replyingTo: GroupMessage | null;
    setReplyingTo: (msg: GroupMessage | null) => void;
    editingMessageId: string | null;
    setEditingMessageId: (id: string | null) => void;
    editMessageText: string;
    setEditMessageText: (text: string) => void;
    onSaveEdit: () => void;
    messageMenuOpen: string | null;
    setMessageMenuOpen: (id: string | null) => void;
    highlightedMessageId: string | null;
    groupMembers: User[];
    pinnedMessage: GroupMessage | null;
    isSendingMessage: boolean;
    formatTime: (ts: number) => string;
    scrollToMessage: (id: string) => void;
}

export const GroupChat: React.FC<GroupChatProps> = ({
    currentUser,
    selectedGroup,
    messages,
    messageInput,
    setMessageInput,
    messageSearchQuery,
    setMessageSearchQuery,
    onSendMessage,
    onBack,
    onShowMembers,
    onEditGroup,
    onClearHistory,
    onDeleteGroup,
    onLeaveGroup,
    onDeleteMessage,
    onEditMessage,
    onReplyMessage,
    onPinMessage,
    onUnpinMessage,
    replyingTo,
    setReplyingTo,
    editingMessageId,
    setEditingMessageId,
    editMessageText,
    setEditMessageText,
    onSaveEdit,
    messageMenuOpen,
    setMessageMenuOpen,
    highlightedMessageId,
    groupMembers,
    pinnedMessage,
    isSendingMessage,
    formatTime,
    scrollToMessage,
}) => {
    const { t } = useLanguage();
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isOwner = selectedGroup.owner_id === currentUser.id;
    const canPinMessages = isOwner || currentUser.role === 'admin';

    const filteredMessages = messages.filter(msg =>
        !messageSearchQuery || msg.text.toLowerCase().includes(messageSearchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-white dark:bg-[#0a0a0c]">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X size={20} className="text-slate-600 dark:text-slate-400" />
                        </button>
                        <Hash className="text-indigo-500" size={20} />
                        <div>
                            <h2 className="font-bold text-slate-900 dark:text-white">{selectedGroup.name}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            onClick={onShowMembers}
                            className="px-2.5 sm:px-3 py-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors flex items-center gap-1"
                        >
                            <Users size={14} />
                            <span className="hidden md:inline">{t('community.members_count')} ({groupMembers.length})</span>
                            <span className="md:hidden">{groupMembers.length}</span>
                        </button>

                        {isOwner && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={onEditGroup}
                                    className="p-1.5 sm:px-3 sm:py-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors"
                                    title={t('community.editGroup')}
                                >
                                    <Settings size={14} />
                                </button>
                                <button
                                    onClick={onClearHistory}
                                    className="hidden sm:block px-3 py-1.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-bold hover:bg-orange-200 dark:hover:bg-orange-500/30 transition-colors"
                                    title={t('common.clear')}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}

                        <button
                            onClick={onLeaveGroup}
                            className="p-1.5 sm:px-3 sm:py-1.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors flex items-center gap-1"
                            title={t('community.leave_group')}
                        >
                            <LogOut size={14} />
                            <span className="hidden sm:inline">{t('community.leave_group_short') || 'Chiqish'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 relative"
                style={{ isolation: 'isolate' }}
            >
                {pinnedMessage && (
                    <div className="mb-3 p-3 rounded-2xl border border-amber-200/70 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                            <Pin size={16} className="text-amber-500 mt-0.5" />
                            <div>
                                <div className="text-xs font-bold text-amber-700 dark:text-amber-300">{t('community.pinned_message')}</div>
                                <div className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2">{pinnedMessage.text}</div>
                            </div>
                        </div>
                        {canPinMessages && (
                            <button
                                onClick={onUnpinMessage}
                                className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline"
                            >
                                {t('community.unpin')}
                            </button>
                        )}
                    </div>
                )}

                <div className="sticky top-0 z-20 mb-3">
                    <div className="flex items-center gap-2 bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 backdrop-blur">
                        <Search size={14} className="text-slate-400" />
                        <input
                            value={messageSearchQuery}
                            onChange={(e) => setMessageSearchQuery(e.target.value)}
                            placeholder={t('community.searchMessages')}
                            className="flex-1 bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200"
                        />
                        {messageSearchQuery && (
                            <button onClick={() => setMessageSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {filteredMessages.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                        <p>{messageSearchQuery ? 'Natija topilmadi' : "Hozircha xabarlar yo'q. Birinchi xabarni yuboring!"}</p>
                    </div>
                ) : (
                    filteredMessages.map((msg) => {
                        const isOwn = msg.userId === currentUser.id;
                        return (
                            <div
                                id={`message-${msg.id}`}
                                key={msg.id}
                                className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : ''} transition-all duration-300 relative ${messageMenuOpen === msg.id ? 'z-50' : 'z-0'
                                    } ${highlightedMessageId === msg.id ? 'ring-2 ring-indigo-500 rounded-xl p-1 bg-indigo-100/50 dark:bg-indigo-500/20' : ''
                                    }`}
                            >
                                <img
                                    src={msg.userAvatar || `https://ui-avatars.com/api/?name=${msg.userName}`}
                                    alt={msg.userName}
                                    className="w-10 h-10 rounded-full flex-shrink-0 relative z-10"
                                />
                                <div className={`flex-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col max-w-[75%] relative overflow-visible z-0`}>
                                    {!isOwn && (
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5 overflow-visible">
                                            {(() => {
                                                const messageUser = groupMembers.find(m => m.id === msg.userId) ||
                                                    (msg.userId === currentUser.id ? currentUser : null);
                                                return messageUser ? <UserBadge user={messageUser} size="sm" /> : null;
                                            })()}
                                            {msg.userName}
                                        </span>
                                    )}
                                    <div className="relative group flex gap-2 items-start z-0">
                                        <div
                                            className={`px-4 py-2.5 rounded-2xl max-w-[75%] relative z-0 ${isOwn
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                                                }`}
                                        >
                                            {msg.replyTo && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (msg.replyTo?.id) {
                                                            scrollToMessage(msg.replyTo.id);
                                                        }
                                                    }}
                                                    className={`mb-2 px-3 py-1.5 rounded-lg text-xs border-l-2 cursor-pointer hover:opacity-80 transition-opacity text-left w-full ${isOwn
                                                        ? 'bg-indigo-500/30 border-indigo-300 text-indigo-100 hover:bg-indigo-500/40'
                                                        : 'bg-slate-200/50 dark:bg-white/5 border-slate-300 dark:border-white/20 text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-white/10'
                                                        }`}
                                                >
                                                    <div className="font-bold">{msg.replyTo.userName}</div>
                                                    <div className="truncate">{msg.replyTo.text}</div>
                                                </button>
                                            )}
                                            <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                            {msg.isEdited && (
                                                <span className={`text-xs ml-2 ${isOwn ? 'text-indigo-200' : 'text-slate-500'}`}>(tahrirlangan)</span>
                                            )}
                                        </div>
                                        <div className="relative flex-shrink-0 z-10">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMessageMenuOpen(messageMenuOpen === msg.id ? null : msg.id);
                                                }}
                                                className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 ${isOwn ? 'order-first' : ''}`}
                                            >
                                                <EllipsisVertical size={16} className="text-slate-500 dark:text-slate-400" />
                                            </button>
                                            {messageMenuOpen === msg.id && (
                                                <div
                                                    data-message-menu
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-full mt-2 z-[9999] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-1.5 min-w-[170px] backdrop-blur-sm`}
                                                >
                                                    {!msg.isSystem && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    onReplyMessage(msg);
                                                                    setMessageMenuOpen(null);
                                                                }}
                                                                className="w-full px-3 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg flex items-center gap-2.5 transition-colors"
                                                            >
                                                                <Reply size={16} />
                                                                {t('community.reply')}
                                                            </button>
                                                            {selectedGroup && canPinMessages && (
                                                                <button
                                                                    onClick={() => {
                                                                        onPinMessage(msg);
                                                                        setMessageMenuOpen(null);
                                                                    }}
                                                                    className="w-full px-3 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg flex items-center gap-2.5 transition-colors"
                                                                >
                                                                    <Pin size={16} />
                                                                    {pinnedMessage?.id === msg.id ? t('community.unpin') : t('community.pin')}
                                                                </button>
                                                            )}
                                                            {msg.userId === currentUser.id && (
                                                                <button
                                                                    onClick={() => {
                                                                        onEditMessage(msg.id);
                                                                        setMessageMenuOpen(null);
                                                                    }}
                                                                    className="w-full px-3 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg flex items-center gap-2.5 transition-colors"
                                                                >
                                                                    <Edit3 size={16} />
                                                                    {t('community.edit')}
                                                                </button>
                                                            )}
                                                            {(msg.userId === currentUser.id || isOwner) && (
                                                                <button
                                                                    onClick={() => {
                                                                        onDeleteMessage(msg.id);
                                                                        setMessageMenuOpen(null);
                                                                    }}
                                                                    className="w-full px-3 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg flex items-center gap-2.5 transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                    {t('community.delete')}
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        <span>{formatTime(msg.timestamp)}</span>
                                        {isOwn && (
                                            msg.readAt ? (
                                                <CheckCheck size={14} className="text-emerald-500" />
                                            ) : (
                                                <Check size={14} className="text-slate-400" />
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-xl">
                {replyingTo && (
                    <div className="mb-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg flex items-center justify-between">
                        <div className="flex-1">
                            <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{t('community.reply_prefix')} {replyingTo.userName}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 truncate">{replyingTo.text}</div>
                        </div>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded"
                        >
                            <X size={14} className="text-indigo-600 dark:text-indigo-400" />
                        </button>
                    </div>
                )}
                {editingMessageId && (
                    <div className="mb-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg flex items-center justify-between">
                        <div className="text-xs font-bold text-yellow-700 dark:text-yellow-300">{t('community.editing_message')}</div>
                        <button
                            onClick={() => {
                                setEditingMessageId(null);
                                setEditMessageText('');
                            }}
                            className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 rounded"
                        >
                            <X size={14} className="text-yellow-600 dark:text-yellow-400" />
                        </button>
                    </div>
                )}
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={editingMessageId ? editMessageText : messageInput}
                        onChange={(e) => {
                            const value = limitLength(e.target.value, MAX_LENGTHS.MESSAGE);
                            if (editingMessageId) {
                                setEditMessageText(value);
                            } else {
                                setMessageInput(value);
                            }
                        }}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !isSendingMessage) {
                                if (editingMessageId) {
                                    onSaveEdit();
                                } else if (messageInput.trim()) {
                                    onSendMessage();
                                }
                            }
                        }}
                        placeholder={editingMessageId ? t('community.editMessage') : t('community.writeMessage')}
                        disabled={isSendingMessage}
                        maxLength={MAX_LENGTHS.MESSAGE}
                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {editingMessageId ? (
                        <>
                            <button
                                onClick={onSaveEdit}
                                disabled={!editMessageText.trim() || isSendingMessage}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:hover:shadow-lg flex items-center justify-center"
                            >
                                {isSendingMessage ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle2 size={20} />
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setEditingMessageId(null);
                                    setEditMessageText('');
                                }}
                                className="px-6 py-3 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all"
                            >
                                <X size={20} />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onSendMessage}
                            disabled={!messageInput.trim() || isSendingMessage}
                            className="px-4 sm:px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:hover:shadow-lg flex items-center justify-center min-w-[50px] sm:min-w-[80px]"
                        >
                            {isSendingMessage ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send size={20} />
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
