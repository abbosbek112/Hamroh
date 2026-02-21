import React, { useState, useEffect } from 'react';
import { RoutineStack as RoutineStackType, RoutineStep } from '../../types';
import { ArrowRight, CheckCircle2, Circle, Trophy } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface RoutineStackProps {
    routine: RoutineStackType;
    onUpdate: (routine: RoutineStackType) => void;
    onComplete: () => void;
}

export const RoutineStack: React.FC<RoutineStackProps> = ({ routine, onUpdate, onComplete }) => {
    const { t } = useLanguage();
    const getRoutineTitle = () => {
        if (routine.id === 'morning_1') return t('routine.morning.name');
        if (routine.id === 'evening_1') return t('routine.evening.name');
        return routine.name;
    };

    const getStepTitle = (step: RoutineStep) => {
        if (routine.id === 'morning_1') {
            if (step.id === 's1') return t('routine.morning.s1');
            if (step.id === 's2') return t('routine.morning.s2');
            if (step.id === 's3') return t('routine.morning.s3');
            if (step.id === 's4') return t('routine.morning.s4');
        }
        if (routine.id === 'evening_1') {
            if (step.id === 'e1') return t('routine.evening.e1');
            if (step.id === 'e2') return t('routine.evening.e2');
            if (step.id === 'e3') return t('routine.evening.e3');
        }
        return step.title;
    };

    const currentStep = routine.steps[routine.currentStepIndex];

    const handleStepComplete = () => {
        const newSteps = [...routine.steps];
        newSteps[routine.currentStepIndex].isCompleted = true;

        const nextIndex = routine.currentStepIndex + 1;
        const isAllDone = nextIndex >= routine.steps.length;

        const updatedRoutine: RoutineStackType = {
            ...routine,
            steps: newSteps,
            currentStepIndex: isAllDone ? routine.currentStepIndex : nextIndex,
            isCompleted: isAllDone,
            lastCompletedDate: isAllDone ? new Date().toISOString().split('T')[0] : routine.lastCompletedDate,
            streak: isAllDone ? routine.streak + 1 : routine.streak
        };

        onUpdate(updatedRoutine);

        if (isAllDone) {
            onComplete();
        }
    };

    if (routine.isCompleted) {
        return (
            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between opacity-60">
                <span className="font-bold text-slate-500 line-through">{getRoutineTitle()}</span>
                <CheckCircle2 className="text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#1a1a1e] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden transform transition-all hover:scale-[1.02]">
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                <h3 className="font-bold">{getRoutineTitle()}</h3>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{routine.currentStepIndex + 1} / {routine.steps.length}</span>
            </div>

            <div className="p-6 text-center">
                <div className="mb-6">
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2 block">{t('routine.current_step')}</span>
                    <h4 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{getStepTitle(currentStep)}</h4>
                    {currentStep.duration > 0 && (
                        <span className="text-sm font-bold text-slate-500 bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-full">
                            {currentStep.duration} {t('routine.minutes')}
                        </span>
                    )}
                </div>

                <button
                    onClick={handleStepComplete}
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                >
                    <CheckCircle2 size={24} className="text-emerald-500" /> {t('routine.done')}
                </button>
            </div>

            {/* Next Steps Preview */}
            <div className="px-6 pb-6 opacity-50 space-y-3 bg-slate-50 dark:bg-black/20 pt-4 border-t border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('routine.next_steps')}</span>
                {routine.steps.slice(routine.currentStepIndex + 1, routine.currentStepIndex + 3).map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <Circle size={14} className="text-slate-400" />
                        <span>{getStepTitle(step)}</span>
                    </div>
                ))}
                {routine.steps.length - routine.currentStepIndex > 3 && (
                    <div className="text-xs text-slate-400 pl-6">{t('routine.more_steps', { count: routine.steps.length - routine.currentStepIndex - 3 })}</div>
                )}
            </div>
        </div>
    );
};
