import React, { useState } from 'react';
import { 
  X, 
  RotateCw, 
  Zap, 
  Plus, 
  Dna, 
  Cpu, 
  Activity, 
  Flame, 
  Trophy, 
  Sparkles, 
  Star,
  Quote,
  Share2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PokemonCard, FusionResult, getEnergyTypeInfo, getCardStyling } from './PokemonCard';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


interface PokemonCardModalProps {
  fusion: FusionResult | null;
  onClose: () => void;
  onCompare: (fusion: FusionResult) => void;
  onUpgrade: (fusion: FusionResult) => void;
  onTransmigrate?: (fusion: FusionResult) => void;
}

export function PokemonCardModal({
  fusion,
  onClose,
  onCompare,
  onUpgrade,
  onTransmigrate
}: PokemonCardModalProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showFullArt, setShowFullArt] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'dna' | 'logic'>('stats');
  const [copied, setCopied] = useState(false);

  if (!fusion) return null;

  const energy = getEnergyTypeInfo(fusion.rank);
  const style = getCardStyling(fusion.rank);
  const isChaos = (fusion.rank || '').toUpperCase().includes('HỖN ĐỘN') || (fusion.rank || '').toUpperCase().includes('CHAOS');

  const handleCopy = () => {
    const text = `Thẻ Bài Pokemon DBZ: ${fusion.name} | Cảnh Giới: ${fusion.rank} | Level: ${fusion.level} | BP: ${fusion.powerLevel.toLocaleString()}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 25 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto z-10 flex flex-col max-h-[92vh]"
        >
          {/* Modal Header */}
          <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Chi Tiết Thẻ Bài Pokemon DBZ
              </span>
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                ID: #{fusion.id.slice(0, 8)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Sao chép thông tin thẻ"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Interactive 3D Pokemon Card Display or Full Art */}
            <div className="md:col-span-5 flex flex-col items-center gap-3">
              <div className="w-full max-w-[320px] mx-auto">
                {showFullArt && fusion.imageUrl ? (
                  <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-amber-400/60 bg-gradient-to-b from-slate-900 to-slate-950 p-2 shadow-2xl relative flex items-center justify-center">
                    <img 
                      src={fusion.imageUrl} 
                      alt={fusion.name} 
                      className="w-full h-full object-contain object-bottom"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[9px] font-bold text-amber-400 border border-amber-400/30">
                      Ảnh Nguyên Bản 1:1
                    </div>
                  </div>
                ) : (
                  <PokemonCard 
                    fusion={fusion}
                    isFlipped={isFlipped}
                    onFlip={() => setIsFlipped(prev => !prev)}
                    interactive={true}
                  />
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {!showFullArt && (
                  <button
                    type="button"
                    onClick={() => setIsFlipped(prev => !prev)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all shadow-md cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{isFlipped ? "Mặt Trước" : "Lật Thẻ (Mặt Sau)"}</span>
                  </button>
                )}

                {fusion.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setShowFullArt(prev => !prev)}
                    className="px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{showFullArt ? "Xem Thẻ Bài 3D" : "Xem Trọn Dáng Nhân Vật"}</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 text-center">
                {showFullArt ? "Hiển thị trọn vẹn toàn bộ ngoại hình nhân vật từ đầu đến chân" : "Di chuột trên thẻ để thấy hiệu ứng quang học 3D"}
              </p>
            </div>

            {/* Right: Detailed Card Almanac & Stats */}
            <div className="md:col-span-7 space-y-4">
              {/* Name & Basic Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-sm",
                    style.stageBadge
                  )}>
                    {style.stageTag}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    Hệ: <b className="text-white">{energy.name}</b>
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                  {fusion.name}
                </h2>
                {fusion.quote && (
                  <p className="text-xs sm:text-sm text-yellow-300 italic flex items-start gap-1.5 pt-1">
                    <Quote className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60" />
                    <span>"{fusion.quote}"</span>
                  </p>
                )}
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-slate-800 gap-2 pt-2">
                <button
                  onClick={() => setActiveTab('stats')}
                  className={cn(
                    "pb-2 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5",
                    activeTab === 'stats' 
                      ? "border-amber-400 text-amber-400" 
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Trophy className="w-3.5 h-3.5" /> Chỉ Số & Lực Chiến
                </button>
                <button
                  onClick={() => setActiveTab('dna')}
                  className={cn(
                    "pb-2 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5",
                    activeTab === 'dna' 
                      ? "border-emerald-400 text-emerald-400" 
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Dna className="w-3.5 h-3.5" /> Phân Tích DNA
                </button>
                <button
                  onClick={() => setActiveTab('logic')}
                  className={cn(
                    "pb-2 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5",
                    activeTab === 'logic' 
                      ? "border-cyan-400 text-cyan-400" 
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Cpu className="w-3.5 h-3.5" /> Logic Dung Hợp
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'stats' && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Lực Chiến Tuyệt Đối</span>
                      <div className="text-base sm:text-lg font-black font-mono text-cyan-400">
                        {isChaos ? `⭐ x${fusion.level || 1}` : `${fusion.powerLevel.toLocaleString('vi-VN')} BP`}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Cấp Độ (Level)</span>
                      <div className="text-base sm:text-lg font-black font-mono text-yellow-400">
                        {isChaos ? `⭐ x${fusion.level || 1}` : `Cấp ${fusion.level.toLocaleString('vi-VN')}`}
                      </div>
                    </div>
                  </div>

                  {/* Compatibility */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Độ Tương Thích Linh Hồn</span>
                      <span className="text-xs font-bold text-white">
                        {fusion.compatibility_score}% - Trạng thái: {fusion.compatibility_status}
                      </span>
                    </div>
                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          fusion.compatibility_score >= 80 ? "bg-emerald-400" :
                          fusion.compatibility_score >= 40 ? "bg-amber-400" : "bg-red-400"
                        )}
                        style={{ width: `${fusion.compatibility_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Power Comparison */}
                  {fusion.power_comparison && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-200">
                      <span className="font-bold uppercase text-[9px] text-yellow-400 block mb-1">So Sánh Sức Mạnh</span>
                      {fusion.power_comparison}
                    </div>
                  )}

                  {/* Story Description */}
                  <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed max-h-36 overflow-y-auto">
                    <Markdown>{fusion.description}</Markdown>
                  </div>
                </div>
              )}

              {activeTab === 'dna' && (
                <div className="space-y-3 pt-2">
                  {fusion.dna_components && fusion.dna_components.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Tỷ Lệ Huyết Mạch & Chủng Tộc</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {fusion.dna_components.map((comp, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-white">{comp.race}</span>
                              <span className="font-mono text-emerald-400 font-bold">{comp.percentage}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full", comp.color || "bg-emerald-500")}
                                style={{ width: `${comp.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {fusion.dna_analysis && (
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                      <Markdown>{fusion.dna_analysis}</Markdown>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'logic' && (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed max-h-56 overflow-y-auto">
                    <Markdown>{fusion.fusion_logic || "Không có dữ liệu logic dung hợp bổ sung."}</Markdown>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5">
                {onTransmigrate && (
                  <button
                    onClick={() => {
                      onTransmigrate(fusion);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer ring-1 ring-white/20"
                  >
                    <Sparkles className="w-4 h-4 fill-current text-yellow-300" />
                    Xuyên Không Vào Nhập Vai
                  </button>
                )}

                <button
                  onClick={() => {
                    onCompare(fusion);
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  Đưa Vào So Sánh
                </button>

                <button
                  onClick={() => {
                    onUpgrade(fusion);
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Nâng Cấp
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
