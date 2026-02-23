import React, { useRef } from 'react';
import { User } from '../../types';
import { Share2, Download, Trophy, Flame, Target, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ShareCardProps {
    user: User;
    stats: {
        streak: number;
        completion: number;
        weekFocus: number;
    };
    onClose: () => void;
}

export const ShareCard: React.FC<ShareCardProps> = ({ user, stats, onClose }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!cardRef.current) return;

        try {
            const canvas = await html2canvas(cardRef.current, {
                useCORS: true,
                scale: 2, // Better quality
                backgroundColor: null,
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `hamroh-stats-${new Date().toISOString().split('T')[0]}.png`;
            link.click();
        } catch (error) {
            console.error("Screenshot failed:", error);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-all duration-300" onClick={onClose}></div>

            <div className="relative flex flex-col gap-6 animate-fade-in-up items-center md:-translate-y-12">

                {/* THE CARD */}
                <div
                    ref={cardRef}
                    className="w-[320px] sm:w-[380px] bg-gradient-to-br from-indigo-900 to-black rounded-[2rem] p-8 text-white shadow-2xl border border-white/10 relative overflow-hidden"
                    style={{
                        backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png"), linear-gradient(135deg, #312e81 0%, #000000 100%)'
                    }}
                >
                    {/* Decors */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/30 rounded-full blur-[50px]"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-[40px]"></div>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                <Trophy size={20} className="text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-none">Hamroh</h3>
                                <span className="text-[10px] text-indigo-300 uppercase tracking-widest">Transformation</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-white/50">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Main Title / Identity */}
                    <div className="mb-8 relative z-10">
                        <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">MENING O'ZGARISHIM</p>
                        <div className="relative">
                            <CheckCircle2 className="absolute -left-6 top-1 text-emerald-500" size={16} />
                            <h2 className="text-2xl font-bold italic leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">
                                "{user.identity?.manifest || "Men har kuni o'z ustimda ishlayman."}"
                            </h2>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-1 text-orange-400">
                                <Flame size={16} className="fill-orange-400" />
                                <span className="text-[10px] font-bold uppercase">Streak</span>
                            </div>
                            <p className="text-3xl font-black">{stats.streak} <span className="text-sm font-medium text-white/50">kun</span></p>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-1 text-emerald-400">
                                <Target size={16} />
                                <span className="text-[10px] font-bold uppercase">Intizom</span>
                            </div>
                            <p className="text-3xl font-black">{stats.completion}% <span className="text-sm font-medium text-white/50">bugun</span></p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-white/10 relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
                                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-500"></div>}
                            </div>
                            <span className="font-bold text-sm">{user.name}</span>
                        </div>
                        <span className="px-3 py-1 bg-white text-black text-[10px] font-bold rounded-full">XP: {user.xp}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={handleDownload}
                        className="px-6 py-3 bg-white text-black rounded-full font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors"
                    >
                        <Download size={18} /> Screenshot oling
                    </button>
                    <button onClick={onClose} className="px-6 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-colors">
                        Yopish
                    </button>
                </div>

            </div>
        </div>
    );
};
