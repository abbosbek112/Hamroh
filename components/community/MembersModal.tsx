import React from 'react';
import { Users, X, Shield, ShieldOff, Trash2, Mail } from 'lucide-react';
import { User, CommunityGroup } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { UserBadge } from '../UserBadge';

interface MembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupMembers: User[];
    selectedGroup: CommunityGroup;
    currentUser: User;
    onSelectMember: (user: User) => void;
    onToggleBlock: (userId: string) => void;
    isUserBlocked: (userId: string) => boolean;
    onRemoveMember: (userId: string) => void;
    onStartDM: (user: User) => void;
}

export const MembersModal: React.FC<MembersModalProps> = ({
    isOpen,
    onClose,
    groupMembers,
    selectedGroup,
    currentUser,
    onSelectMember,
    onToggleBlock,
    isUserBlocked,
    onRemoveMember,
    onStartDM,
}) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    const isOwner = selectedGroup.owner_id === currentUser.id || currentUser.role === 'admin';

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-[#0a0a0c] rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Users size={24} className="text-indigo-500" />
                        {t('community.group_members')} ({groupMembers.length})
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                        {groupMembers.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                            >
                                <div
                                    className="flex items-center gap-3 cursor-pointer"
                                    onClick={() => onSelectMember(member)}
                                >
                                    <img
                                        src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}`}
                                        alt={member.name}
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <UserBadge user={member} size="sm" />
                                            <h4 className="font-bold text-slate-900 dark:text-white">{member.name}</h4>
                                            {member.id === selectedGroup.owner_id && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 rounded-md font-bold uppercase tracking-wider">Owner</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">@{member.username}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {member.id !== currentUser.id && (
                                        <>
                                            <button
                                                onClick={() => onStartDM(member)}
                                                className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                                                title={t('community.direct_messages')}
                                            >
                                                <Mail size={18} />
                                            </button>
                                            {isOwner && member.id !== selectedGroup.owner_id && (
                                                <>
                                                    <button
                                                        onClick={() => onToggleBlock(member.id)}
                                                        className={`p-2 rounded-xl transition-all ${isUserBlocked(member.id)
                                                            ? 'text-red-500 bg-red-50 dark:bg-red-500/10'
                                                            : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                                                            }`}
                                                        title={isUserBlocked(member.id) ? t('community.unblock') : t('community.block')}
                                                    >
                                                        {isUserBlocked(member.id) ? <ShieldOff size={18} /> : <Shield size={18} />}
                                                    </button>
                                                    <button
                                                        onClick={() => onRemoveMember(member.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                                        title={t('community.remove_member')}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
