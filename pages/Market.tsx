
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { User, StoreItem, StoreItemType, AppView } from '../types';
import { STORE_ITEMS } from '../constants';
import { api } from '../services/api';
import { ShoppingBag, Star, Zap, Palette, Lock, Check, Crown, Target, Sparkles, TrendingUp } from 'lucide-react';
import { logger } from '../utils/logger';
import { useToast } from '../contexts/ToastContext';

interface MarketProps {
    user: User | null;
    onUpdateUser: (user: User) => void;
    onNavigate: (view: AppView) => void;
}

export const Market: React.FC<MarketProps> = ({ user, onUpdateUser }) => {
    const { t } = useLanguage();
    const { notify } = useToast();
    const [activeTab, setActiveTab] = useState<'ALL' | StoreItemType>('ALL');
    const [buyingItem, setBuyingItem] = useState<string | null>(null);
    const [storeItems, setStoreItems] = useState<StoreItem[]>(STORE_ITEMS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadItems = async () => {
            try {
                const items = await api.getStoreItems();
                if (items && items.length > 0) {
                    setStoreItems(items);
                }
            } catch (e) {
                logger.error('Failed to load store items', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadItems();
    }, []);

    if (!user) return null;

    const handleBuy = async (item: StoreItem) => {
        if (user.xp < item.price) {
            notify(t('market.insufficient'), 'error');
            return;
        }

        const inventory = user.inventory || [];
        if (item.type !== 'UTILITY' && inventory.includes(item.id)) return;

        setBuyingItem(item.id);

        try {
            const updatedUser = await api.buyItem(item.id);
            onUpdateUser(updatedUser);
            notify(t('market.success'), 'success');
        } catch (e: any) {
            logger.error('Failed to purchase item', e);
            const errorMsg = e.message || t('market.error_msg') || 'Xatolik yuz berdi';
            notify(errorMsg, 'error');
        } finally {
            setBuyingItem(null);
        }
    };

    const handleApplyTheme = async (themeKey: string) => {
        try {
            const updatedUser = await api.updateUser({ ...user, appTheme: themeKey as any });
            onUpdateUser(updatedUser);
            notify(t('settings.theme_updated') || 'Mavzu yangilandi', 'success');
        } catch (e) {
            logger.error('Failed to apply theme', e);
            notify(t('common.error'), 'error');
        }
    };

    const filteredItems = storeItems.filter(item => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'INVENTORY') {
            return user.inventory?.includes(item.id) || (item.type === 'BADGE' && item.value && user.badges?.includes(item.value));
        }
        return item.type === activeTab;
    });

    return (
        <div className="space-y-10 pb-32 lg:pb-24 animate-fade-in">
            {/* Premium Header */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-slate-900 border border-white/10 shadow-2xl">
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[80px] -z-10"></div>

                <div className="p-6 sm:p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-yellow-400 text-xs font-black uppercase tracking-[0.2em] mb-6 animate-bounce-subtle">
                            <Crown size={14} />
                            {t('market.premium_store') || 'Premium Do\'kon'}
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 sm:mb-4 tracking-tight">
                            {t('market.title')}
                        </h1>
                        <p className="text-indigo-200/70 text-base sm:text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
                            {t('market.subtitle')}
                        </p>
                    </div>

                    {/* XP Balance Display */}
                    <div className="relative perspective-container">
                        <div className="market-card-glass dark:bg-white/5 border-white/20 p-6 sm:p-8 rounded-2xl sm:rounded-3xl flex items-center lg:flex-col gap-4 sm:gap-6 shadow-2xl transform-style-3d hover:rotate-y-12 transition-all duration-500">
                            <div className="relative h-16 w-16 sm:h-24 sm:w-24 flex items-center justify-center transition-transform hover:scale-110">
                                <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-2xl animate-pulse"></div>
                                <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-yellow-300 to-amber-600 flex items-center justify-center text-yellow-950 shadow-[0_0_30px_rgba(251,191,36,0.5)] border-4 border-yellow-200/50">
                                    <Star fill="currentColor" size={24} className="sm:w-[40px] sm:h-[40px] animate-spin-slow" />
                                </div>
                            </div>
                            <div className="text-left lg:text-center">
                                <p className="text-white/50 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-0.5 sm:mb-1">{t('market.balance')}</p>
                                <p className="text-3xl sm:text-5xl font-black text-white tabular-nums tracking-tighter xp-gold-glow">
                                    {user.xp.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Category Filter */}
            <div className="hidden lg:flex sticky top-0 z-20 py-4 -mx-4 px-4 bg-slate-50/80 dark:bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 items-center gap-2 overflow-x-auto hide-scrollbar">
                {[
                    { id: 'ALL', label: t('market.tabs.all'), icon: ShoppingBag, color: 'text-slate-500' },
                    { id: 'UTILITY', label: t('market.tabs.utility'), icon: Zap, color: 'text-blue-500' },
                    { id: 'THEME', label: t('market.tabs.theme'), icon: Palette, color: 'text-purple-500' },
                    { id: 'BADGE', label: t('market.tabs.badge'), icon: Star, color: 'text-yellow-500' },
                    { id: 'INVENTORY', label: t('market.tabs.inventory') || 'Savat', icon: Check, color: 'text-green-500' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all duration-300 whitespace-nowrap
                        ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 -translate-y-0.5'
                                : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                            }`}
                    >
                        <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : tab.color} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Store Items Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-[360px] rounded-[2rem] bg-white/50 dark:bg-white/5 animate-pulse border border-slate-200 dark:border-white/5"></div>
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="py-24 text-center">
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag size={48} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-2xl font-bold dark:text-white mb-2">
                        {activeTab === 'INVENTORY' ? t('market.inventory_empty_title') : t('market.store_empty_title')}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        {activeTab === 'INVENTORY' ? t('market.inventory_empty_subtitle') : t('market.store_empty_subtitle')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredItems.map((item) => {
                        const isOwned = item.type === 'BADGE' && item.value
                            ? (user.badges?.includes(item.value) || user.inventory?.includes(item.id))
                            : (item.type !== 'UTILITY' && user.inventory?.includes(item.id));
                        const isEquippedTheme = item.type === 'THEME' && user.appTheme === item.value;
                        const canAfford = user.xp >= item.price;
                        const isBuying = buyingItem === item.id;

                        return (
                            <div
                                key={item.id}
                                className={`group relative flex flex-col h-full rounded-[2.5rem] border transition-all duration-500 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2
                                ${isOwned && item.type !== 'UTILITY'
                                        ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5'
                                        : 'bg-white dark:bg-zinc-900/40 border-slate-200/50 dark:border-white/5'
                                    }`}
                            >
                                {/* Premium Shine Effect */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-br from-white/10 to-transparent"></div>

                                <div className="p-6 sm:p-8 flex flex-col h-full relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg transform transition-transform group-hover:scale-110 group-hover:rotate-6
                                        ${item.type === 'THEME' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20' :
                                                item.type === 'UTILITY' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20' :
                                                    'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20'}`}
                                        >
                                            {item.icon}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {item.isPremium && (
                                                <div className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                                                    <Crown size={10} /> {t('common.premium') || 'Premium'}
                                                </div>
                                            )}
                                            <div className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                                                {t(`market.item_types.${item.type}`)}
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                                        {t(item.name)}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-10 font-medium">
                                        {t(item.description)}
                                    </p>

                                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">{t('market.price')}</span>
                                            <div className="text-2xl font-black flex items-center gap-1.5 text-slate-900 dark:text-white">
                                                <span className="text-yellow-500"><Star size={20} fill="currentColor" /></span>
                                                {item.price.toLocaleString()}
                                            </div>
                                        </div>

                                        {isOwned && item.type !== 'UTILITY' ? (
                                            item.type === 'THEME' && item.value ? (
                                                <button
                                                    onClick={() => handleApplyTheme(item.value!)}
                                                    disabled={isEquippedTheme}
                                                    className={`px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 border transition-all
                                                    ${isEquippedTheme
                                                            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200/50 cursor-default'
                                                            : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'}`}
                                                >
                                                    {isEquippedTheme ? <Check size={16} strokeWidth={3} /> : <Zap size={16} />}
                                                    {isEquippedTheme ? t('market.applied') || 'Tanlangan' : t('market.apply') || 'Tanlash'}
                                                </button>
                                            ) : (
                                                <div className="px-6 py-3 rounded-2xl bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 font-black text-xs flex items-center gap-2 border border-green-200/50 dark:border-green-500/30">
                                                    <Check size={16} strokeWidth={3} /> {t('market.owned')}
                                                </div>
                                            )
                                        ) : (
                                            <button
                                                onClick={() => handleBuy(item)}
                                                disabled={!canAfford || isBuying}
                                                className={`px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all relative overflow-hidden group/btn
                                                ${canAfford
                                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 active:scale-95'
                                                        : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/10 cursor-not-allowed'
                                                    }`}
                                            >
                                                {isBuying ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                                        {t('common.processing') || 'Kutilmoqda...'}
                                                    </span>
                                                ) : !canAfford ? (
                                                    <span className="flex items-center gap-2">
                                                        <Lock size={16} /> {t('market.insufficient_short') || 'XP yetarli'}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        {t('market.buy')}
                                                        <TrendingUp size={16} className="transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                                                    </span>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Mobile Bottom Category Filter */}
            <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 flex justify-between items-center max-w-lg mx-auto overflow-x-auto no-scrollbar">
                    {[
                        { id: 'ALL', label: t('market.tabs.all'), icon: ShoppingBag, color: 'text-slate-500' },
                        { id: 'UTILITY', label: t('market.tabs.utility'), icon: Zap, color: 'text-blue-500' },
                        { id: 'THEME', label: t('market.tabs.theme'), icon: Palette, color: 'text-purple-500' },
                        { id: 'BADGE', label: t('market.tabs.badge'), icon: Star, color: 'text-yellow-500' },
                        { id: 'INVENTORY', label: t('market.tabs.inventory') || 'Savat', icon: Check, color: 'text-green-500' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-bold scale-105'
                                : 'text-slate-500 dark:text-slate-400 font-medium'}`}
                        >
                            <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : tab.color} />
                            <span className="text-[10px] leading-tight text-center">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
