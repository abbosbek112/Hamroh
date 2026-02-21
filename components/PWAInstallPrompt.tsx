import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const PWAInstallPrompt: React.FC = () => {
    const { t } = useLanguage();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Check if user has already dismissed it recently
            const dismissed = localStorage.getItem('pwa_prompt_dismissed');
            if (!dismissed) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-96 bg-white dark:bg-[#1a1a1e] p-4 rounded-2xl shadow-2xl border border-indigo-500/20 z-50 animate-fade-in-up flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Download size={24} />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                    {t('pwa.install_title') || 'Ilovani o\'rnatish'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('pwa.install_desc') || 'Yaxshiroq ishlashi uchun ilovani telefoningizga o\'rnating'}
                </p>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={handleDismiss}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400 transition-colors"
                >
                    <X size={18} />
                </button>
                <button
                    onClick={handleInstallClick}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/30"
                >
                    {t('pwa.install_btn') || 'O\'rnatish'}
                </button>
            </div>
        </div>
    );
};
