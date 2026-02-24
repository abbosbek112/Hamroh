import React, { useState } from 'react';
import { User, UserIdentity } from '../../types';
import { X, Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface IdentitySetupProps {
    user: User;
    onComplete: (identity: UserIdentity) => void;
    onClose: () => void;
}

export const IdentitySetup: React.FC<IdentitySetupProps> = ({ user, onComplete, onClose }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [manifest, setManifest] = useState('');
    const [values, setValues] = useState<string[]>(['', '', '']);
    const [reason, setReason] = useState('');

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else handleComplete();
    };

    const handleComplete = () => {
        const identity: UserIdentity = {
            manifest,
            values: values.filter(v => v.trim()),
            reason,
            startDate: new Date().toISOString()
        };
        onComplete(identity);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
            <div className="bg-white/95 dark:bg-[#151518] shadow-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg p-6 sm:p-8 relative border-t sm:border border-white/20 dark:border-white/5 animate-fade-in-up">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-20">
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 mb-6">
                    {step === 1 ? t('identity.manifest_label') : step === 2 ? t('identity.step_2_title') : t('identity.reason_label')}
                </h2>

                {step === 1 && (
                    <div className="space-y-4">
                        <p className="text-slate-600 dark:text-slate-300">
                            {t('identity.step_1_desc')}
                        </p>
                        <div className="relative">
                            <textarea
                                value={manifest}
                                onChange={(e) => setManifest(e.target.value)}
                                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 h-32 text-lg font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder={t('identity.manifest_placeholder')}
                            />
                            <div className="mt-3 text-sm text-slate-500 bg-slate-100 dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/5">
                                <span className="font-bold text-indigo-500">{t('identity.example_label')}</span> {t('identity.manifest_example')}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <p className="text-slate-600 dark:text-slate-300">
                            {t('identity.step_2_desc')}
                        </p>
                        {values.map((val, idx) => (
                            <div key={idx}>
                                <input
                                    value={val}
                                    onChange={(e) => {
                                        const newVals = [...values];
                                        newVals[idx] = e.target.value;
                                        setValues(newVals);
                                    }}
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder={t('identity.values_placeholder').split(', ')[idx] || `${idx + 1}`}
                                />
                                {idx === 0 && !val && <p className="text-xs text-slate-400 mt-1 pl-2">{t('identity.example_label')} {t('identity.values_placeholder')}</p>}
                            </div>
                        ))}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <p className="text-slate-600 dark:text-slate-300">
                            {t('identity.step_3_desc')}
                        </p>
                        <div className="relative">
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 h-32 text-lg font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder={t('identity.reason_placeholder')}
                            />
                            <div className="mt-3 text-sm text-slate-500 bg-slate-100 dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/5">
                                <span className="font-bold text-indigo-500">{t('identity.example_label')}</span> {t('identity.reason_example')}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-end gap-3">
                    {step > 1 && (
                        <button onClick={() => setStep(step - 1)} className="px-4 py-2 text-slate-500">
                            {t('home.onboarding.back')}
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2"
                    >
                        {step === 3 ? t('identity.complete') : t('home.onboarding.next')} <Check size={18} />
                    </button>
                </div>
            </div>
        </div >
    );
};
