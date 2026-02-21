
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { User, StoreItem, StoreItemType, AppView } from '../types';
import { STORE_ITEMS, TRANSLATIONS } from '../constants';
import { api } from '../services/api';
import { ShoppingBag, Star, Zap, Palette, Lock, Check } from 'lucide-react';
import { logger } from '../utils/logger';
import { useToast } from '../contexts/ToastContext';

interface MarketProps {
    user: User | null;
    onUpdateUser: (user: User) => void;
    onNavigate: (view: AppView) => void;
}

export const Market: React.FC<MarketProps> = ({ user, onUpdateUser }) => {
    const { t, language } = useLanguage();
    const { notify } = useToast();  // Added useToast
    const [activeTab, setActiveTab] = useState<'ALL' | StoreItemType>('ALL');
    const [buyingItem, setBuyingItem] = useState<string | null>(null);
    const [storeItems, setStoreItems] = useState<StoreItem[]>(STORE_ITEMS); // Fallback to constants initial
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

    const inventory = user.inventory || [];

    const handleBuy = async (item: StoreItem) => {
        if (user.xp < item.price) {
            notify(t('market.insufficient'), 'error');
            return;
        }

        // Allow multiple purchases for UTILITY items
        const inventory = user.inventory || [];
        if (item.type !== 'UTILITY' && inventory.includes(item.id)) return;

        setBuyingItem(item.id);

        try {
            // SECURE: Use dedicated buyItem API instead of direct user update
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

    const filteredItems = storeItems.filter(item =>
        activeTab === 'ALL' ? true : item.type === activeTab
    );

    const getIcon = (type: StoreItemType) => {
        switch (type) {
            case 'UTILITY': return <Zap size={18} />;
            case 'THEME': return <Palette size={18} />;
            case 'BADGE': return <Star size={18} />;
            default: return <ShoppingBag size={18} />;
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header & Balance */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white shadow-xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-black/10 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                            <ShoppingBag className="text-yellow-300" size={32} />
                            {t('market.title')}
                        </h1>
                        <p className="text-violet-200 text-lg max-w-xl">
                            {t('market.subtitle')}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
                        <div className="text-right">
                            <p className="text-xs text-violet-200 font-bold uppercase tracking-wider">{t('market.balance')}</p>
                            <p className="text-3xl font-black tabular-nums">{user.xp.toLocaleString()}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 shadow-lg">
                            <Star fill="currentColor" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
                {[
                    { id: 'ALL', label: t('market.tabs.all'), icon: ShoppingBag },
                    { id: 'UTILITY', label: t('market.tabs.utility'), icon: Zap },
                    { id: 'THEME', label: t('market.tabs.theme'), icon: Palette },
                    { id: 'BADGE', label: t('market.tabs.badge'), icon: Star },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap
              ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => {
                    const isOwned = item.type === 'BADGE' && item.value
                        ? (user.badges?.includes(item.value) || inventory.includes(item.id))
                        : (item.type !== 'UTILITY' && inventory.includes(item.id));
                    const canAfford = user.xp >= item.price;
                    const isBuying = buyingItem === item.id;

                    return (
                        <div
                            key={item.id}
                            className={`relative group overflow-hidden rounded-2xl border transition-all duration-300
                ${isOwned
                                    ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5 opacity-80'
                                    : 'bg-white dark:bg-white/5 border-white/20 dark:border-white/5 hover:shadow-xl hover:-translate-y-1'
                                }`}
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl shadow-sm
                    ${item.type === 'THEME' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' :
                                            item.type === 'UTILITY' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                                                'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30'}`}
                                    >
                                        {item.icon}
                                    </div>
                                    <div className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-500">
                                        {t(`market.item_types.${item.type}`)}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                    {t(item.name)}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 min-h-[40px]">
                                    {t(item.description)}
                                </p>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="font-black text-lg flex items-center gap-1 text-slate-700 dark:text-slate-200">
                                        {item.price} <span className="text-xs font-bold text-slate-400">{t('market.xp')}</span>
                                    </div>

                                    {isOwned && item.type !== 'UTILITY' ? (
                                        <button disabled className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-100 text-green-700 font-bold text-sm cursor-default">
                                            <Check size={16} /> {t('market.owned')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleBuy(item)}
                                            disabled={!canAfford || isBuying}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all
                        ${canAfford
                                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none'
                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {isBuying ? (
                                                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                            ) : !canAfford ? (
                                                <>
                                                    <Lock size={16} /> {t('market.insufficient')}
                                                </>
                                            ) : (
                                                t('market.buy')
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
