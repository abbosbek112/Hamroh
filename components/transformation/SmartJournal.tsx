import React, { useState } from 'react';
import { SmartJournalEntry, User } from '../../types';
import { Save, X, Moon, Sun, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface SmartJournalProps {
    user: User;
    onSave: (entry: SmartJournalEntry) => void;
    onClose: () => void;
    type: 'MORNING' | 'EVENING';
}

export const SmartJournal: React.FC<SmartJournalProps> = ({ user, onSave, onClose, type }) => {
    const { t } = useLanguage();

    // Construct template dynamically based on language
    const template = type === 'MORNING' ? {
        prompts: [
            { id: 'identity', text: t('journal.morning.identity.text'), placeholder: t('journal.morning.identity.placeholder') },
            { id: 'focus', text: t('journal.morning.focus.text'), placeholder: t('journal.morning.focus.placeholder') },
            { id: 'energy', text: t('journal.morning.energy.text'), type: 'slider' }
        ],
        feedback: {
            high_energy: t('journal.morning.feedback.high'),
            low_energy: t('journal.morning.feedback.low'),
            default: t('journal.morning.feedback.default')
        }
    } : {
        prompts: [
            { id: 'win', text: t('journal.evening.win.text'), placeholder: t('journal.evening.win.placeholder') },
            { id: 'struggle', text: t('journal.evening.struggle.text'), placeholder: t('journal.evening.struggle.placeholder') },
            { id: 'fix', text: t('journal.evening.fix.text'), placeholder: t('journal.evening.fix.placeholder') }
        ],
        feedback: {
            consistent: t('journal.evening.feedback.consistent'),
            struggling: t('journal.evening.feedback.struggling'),
            tired: t('journal.evening.feedback.tired')
        }
    };
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [step, setStep] = useState(0);
    const [energy, setEnergy] = useState(3);

    const currentPrompt = template.prompts[step];
    const isLastStep = step === template.prompts.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            handleComplete();
        } else {
            setStep(step + 1);
        }
    };

    const handleComplete = () => {
        // Basic Rule-Based Feedback Logic
        let feedback = "";

        if (type === 'MORNING') {
            const fb = template.feedback as { high_energy: string; low_energy: string; default: string };
            if (energy >= 4) feedback = fb.high_energy || "";
            else if (energy <= 2) feedback = fb.low_energy || "";
            else feedback = fb.default || "";
        } else {
            const fb = template.feedback as { consistent: string; struggling: string; tired: string };
            // Evening logic could be based on answers length or keywords in future
            if (answers['struggle'] && answers['struggle'].length > 5) feedback = fb.struggling || "";
            else feedback = fb.consistent || "";
        }

        const entry: SmartJournalEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            type,
            answers: Object.entries(answers).map(([qid, ans]) => ({ questionId: qid, answer: ans as string })),
            energyLevel: energy,
            feedback,
            createdAt: Date.now()
        };
        onSave(entry);
    };

    const getGradient = () => {
        return type === 'MORNING'
            ? 'from-amber-200 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30'
            : 'from-indigo-900/50 to-slate-900/50';
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300`}>
            <div className={`w-full max-w-lg bg-gradient-to-br ${getGradient()} bg-white/90 dark:bg-[#1a1a1e]/90 rounded-[3rem] p-10 shadow-2xl relative border border-white/20 dark:border-white/5 backdrop-blur-2xl md:-translate-y-12 animate-fade-in-up overflow-hidden`}>

                {/* Progress Bar */}
                <div className="absolute top-0 left-0 h-1 bg-indigo-500 transition-all duration-300" style={{ width: `${((step + 1) / template.prompts.length) * 100}%` }}></div>

                <button onClick={onClose} aria-label={t('common.close')} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>

                <div className="mb-8 flex justify-center">
                    {type === 'MORNING' ? <Sun size={48} className="text-amber-500 animate-pulse-slow" /> : <Moon size={48} className="text-indigo-400" />}
                </div>

                <div className="min-h-[200px] flex flex-col justify-center animate-fade-in">
                    <h3 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-6">
                        {currentPrompt.text}
                    </h3>

                    {'type' in currentPrompt && currentPrompt.type === 'slider' ? (
                        <div className="px-4">
                            <div className="flex justify-between gap-2 mb-4">
                                {[
                                    { level: 1, emoji: "😫", label: t('journal.energy_levels.1') },
                                    { level: 2, emoji: "😕", label: t('journal.energy_levels.2') },
                                    { level: 3, emoji: "😐", label: t('journal.energy_levels.3') },
                                    { level: 4, emoji: "🙂", label: t('journal.energy_levels.4') },
                                    { level: 5, emoji: "🤩", label: t('journal.energy_levels.5') }
                                ].map((item) => (
                                    <button
                                        key={item.level}
                                        onClick={() => setEnergy(item.level)}
                                        className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${energy === item.level
                                            ? 'bg-indigo-600 text-white shadow-lg scale-110'
                                            : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500'
                                            }`}
                                    >
                                        <span className="text-2xl">{item.emoji}</span>
                                        <span className="text-[10px] font-bold uppercase">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <textarea
                            autoFocus
                            value={answers[currentPrompt.id] || ''}
                            onChange={(e) => setAnswers({ ...answers, [currentPrompt.id]: e.target.value })}
                            placeholder={currentPrompt.placeholder}
                            className="w-full p-4 bg-white/50 dark:bg-black/20 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[120px] text-lg"
                        />
                    )}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={!('type' in currentPrompt && currentPrompt.type === 'slider') && !answers[currentPrompt.id]?.trim()}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLastStep ? 'Yakunlash' : 'Davom etish'} <ChevronRight size={20} />
                    </button>
                </div>

            </div>
        </div>
    );
};
