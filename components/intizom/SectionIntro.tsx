import React, { useState, useEffect } from 'react';
import { X, Lightbulb, Target, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface SectionIntroProps {
    sectionKey: 'plan' | 'daily' | 'tasks' | 'journal' | 'focus' | 'stats';
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
    plan: '🧠',
    daily: '📅',
    tasks: '✅',
    journal: '📝',
    focus: '⏱️',
    stats: '📊',
};

const SECTION_GRADIENTS: Record<string, string> = {
    plan: 'from-indigo-600 via-violet-600 to-purple-600',
    daily: 'from-violet-600 via-purple-600 to-fuchsia-600',
    tasks: 'from-emerald-600 via-teal-600 to-cyan-600',
    journal: 'from-blue-600 via-indigo-600 to-violet-600',
    focus: 'from-amber-600 via-orange-600 to-red-500',
    stats: 'from-cyan-600 via-blue-600 to-indigo-600',
};

export const SectionIntro: React.FC<SectionIntroProps> = ({ sectionKey }) => {
    const { t } = useLanguage();
    const storageKey = `hamroh_intro_seen_${sectionKey}`;

    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem(storageKey);
        if (!seen) {
            setVisible(true);
        }
    }, [storageKey]);

    const handleDismiss = () => {
        localStorage.setItem(storageKey, 'true');
        setVisible(false);
    };

    if (!visible) return null;

    const emoji = SECTION_ICONS[sectionKey] || '💡';
    const gradient = SECTION_GRADIENTS[sectionKey] || 'from-indigo-600 to-violet-600';

    return (
        <div className="animate-fade-in mb-6 sm:mb-8">
            <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br ${gradient} p-5 sm:p-8 text-white shadow-2xl`}>
                {/* Background decorations */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white/70 hover:text-white z-10"
                    aria-label="Close"
                >
                    <X size={16} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-4 sm:mb-5">
                    <span className="text-3xl sm:text-4xl">{emoji}</span>
                    <div>
                        <h3 className="text-lg sm:text-xl font-black tracking-tight">
                            {t(`intizom.intro.${sectionKey}.title`)}
                        </h3>
                        <p className="text-white/60 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                            {t('intizom.intro.guide_label')}
                        </p>
                    </div>
                </div>

                {/* Content cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {/* What */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <HelpCircle size={16} className="text-white/80" />
                            <span className="text-xs font-black uppercase tracking-wider text-white/80">
                                {t('intizom.intro.what_label')}
                            </span>
                        </div>
                        <p className="text-sm text-white/90 leading-relaxed font-medium">
                            {t(`intizom.intro.${sectionKey}.what`)}
                        </p>
                    </div>

                    {/* Can do */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <Target size={16} className="text-white/80" />
                            <span className="text-xs font-black uppercase tracking-wider text-white/80">
                                {t('intizom.intro.can_do_label')}
                            </span>
                        </div>
                        <p className="text-sm text-white/90 leading-relaxed font-medium">
                            {t(`intizom.intro.${sectionKey}.can_do`)}
                        </p>
                    </div>

                    {/* How */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <Lightbulb size={16} className="text-white/80" />
                            <span className="text-xs font-black uppercase tracking-wider text-white/80">
                                {t('intizom.intro.how_label')}
                            </span>
                        </div>
                        <p className="text-sm text-white/90 leading-relaxed font-medium">
                            {t(`intizom.intro.${sectionKey}.how`)}
                        </p>
                    </div>
                </div>

                {/* Dismiss button */}
                <div className="flex justify-end mt-4 sm:mt-5">
                    <button
                        onClick={handleDismiss}
                        className="px-5 sm:px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-sm rounded-xl transition-all active:scale-95 border border-white/10 backdrop-blur-sm"
                    >
                        {t('intizom.intro.dismiss')} ✓
                    </button>
                </div>
            </div>
        </div>
    );
};
