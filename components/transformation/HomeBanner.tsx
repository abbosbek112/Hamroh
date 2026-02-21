import React from 'react';
import { UserIdentity } from '../../types';
import { Target, Sparkles } from 'lucide-react';

interface HomeBannerProps {
    identity: UserIdentity;
}

export const HomeBanner: React.FC<HomeBannerProps> = ({ identity }) => {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 sm:p-8 text-white shadow-2xl shadow-indigo-500/20 mb-8 animate-fade-in-up">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-fuchsia-500/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">
                            <Target size={14} /> 90-Kunlik Transformatsiya
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-2">
                            "{identity.manifest}"
                        </h2>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {identity.values.map((val, idx) => (
                                <span key={idx} className="px-3 py-1 bg-white/20 rounded-lg text-xs font-bold backdrop-blur-md border border-white/10">
                                    #{val}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="hidden sm:block">
                        <Sparkles size={48} className="text-amber-300 opacity-80" />
                    </div>
                </div>
            </div>
        </div>
    );
};
