import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { User, Badge } from '../types';
import { Share2, Download, Loader2, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

interface ShareableAchievementProps {
    user: User;
    badge: Badge;
    onClose: () => void;
}

export const ShareableAchievement: React.FC<ShareableAchievementProps> = ({ user, badge, onClose }) => {
    const { t } = useLanguage();
    const { notify } = useToast();
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);

        try {
            // Small delay to ensure images loaded
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(cardRef.current, {
                scale: 2, // High resolution
                backgroundColor: null,
                logging: false,
                useCORS: true
            });

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `hamroh-achievement-${badge.id}.png`;
            link.click();
        } catch (error) {
            console.error('Error generating image:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleShare = async () => {
        if (!cardRef.current) return;

        setIsGenerating(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                backgroundColor: null,
                useCORS: true
            });

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    setIsGenerating(false);
                    return;
                }

                const file = new File([blob], `hamroh-${badge.id}.png`, { type: 'image/png' });

                // 1. Try Web Share API (Mobile)
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: t('share.share_caption'),
                            text: t('share.share_text', { badge: t(`badges.${badge.id}.name`) })
                        });
                        setIsGenerating(false);
                        return;
                    } catch (error) {
                        console.warn('Share API failed/cancelled, trying clipboard...', error);
                    }
                }

                // 2. Try Clipboard (Desktop)
                try {
                    if (typeof ClipboardItem !== 'undefined') {
                        await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]);
                        notify(t('share.copied'), 'success');
                        setIsGenerating(false);
                        return;
                    }
                } catch (error) {
                    console.warn('Clipboard failed, defaulting to download...', error);
                }

                // 3. Fallback to Download
                handleDownload();
                notify(t('share.not_supported'), 'info');
                setIsGenerating(false);
            });
        } catch (error) {
            console.error('Error sharing:', error);
            handleDownload();
            notify(t('share.not_supported'), 'error');
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#1a1a1e] rounded-3xl p-6 w-full max-w-md relative animate-fade-in-up">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-white/10 rounded-full hover:bg-slate-200 transition-colors z-50"
                >
                    <X size={20} className="text-slate-600 dark:text-slate-300" />
                </button>

                <h3 className="text-xl font-bold text-center mb-6 text-slate-900 dark:text-white">
                    {t('share.title')}
                </h3>

                {/* --- CAPTURE AREA (Instagram Story Aspect Ratio 9:16 ish) --- */}
                <div className="flex justify-center mb-6">
                    <div
                        ref={cardRef}
                        className="w-[300px] h-[533px] relative overflow-hidden rounded-2xl shadow-2xl flex flex-col items-center text-center p-8"
                        style={{
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)'
                        }}
                    >
                        {/* Decorative Elements */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/20 rounded-full blur-3xl"></div>

                        {/* Logo / Brand */}
                        <div className="relative z-10 flex items-center gap-2 mb-8 opacity-80">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                <span className="text-indigo-600 font-bold text-lg">H</span>
                            </div>
                            <span className="text-white font-bold tracking-wider">HAMROH AI</span>
                        </div>

                        {/* User Info */}
                        <div className="relative z-10 mb-6">
                            <div className="w-20 h-20 mx-auto rounded-full border-4 border-white/30 p-1 mb-3">
                                <img
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                    alt="User"
                                    className="w-full h-full rounded-full object-cover bg-white"
                                />
                            </div>
                            <h2 className="text-white font-bold text-xl drop-shadow-md">@{user.username}</h2>
                        </div>

                        {/* Achievement */}
                        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full flex-1 flex flex-col items-center justify-center mb-8">
                            <span className="text-xs text-indigo-100 font-bold tracking-widest uppercase mb-2">{t('share.new_achievement')}</span>
                            <div className="text-7xl mb-4 drop-shadow-xl animate-bounce-slow">
                                {badge.icon}
                            </div>
                            <h1 className="text-white font-black text-2xl mb-2 leading-tight">
                                {t(`badges.${badge.id}.name`)}
                            </h1>
                            <p className="text-indigo-100 text-sm font-medium">
                                {t(`badges.${badge.id}.desc`)}
                            </p>
                        </div>

                        {/* Footer / CTA */}
                        <div className="relative z-10 mt-auto">
                            <div className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                                hamroh.ai
                            </div>
                        </div>

                    </div>
                </div>

                {/* --- ACTIONS --- */}
                <div className="flex gap-3">
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        {t('share.download')}
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={isGenerating}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                    >
                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                        {t('share.share_button')}
                    </button>
                </div>

            </div>
        </div>
    );
};
