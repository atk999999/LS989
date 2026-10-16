import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Zap, 
  Crown, 
  ShieldCheck, 
  Skull, 
  Compass, 
  Flame, 
  Dna, 
  Check, 
  ArrowRight,
  BookOpen,
  User,
  Quote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameGenre, GameSession } from '../types';
import { FusionResult, getEnergyTypeInfo, getCardStyling } from '../DHJ-main/src/components/PokemonCard';
import { 
  convertFusionToRealm, 
  extractTalentsFromFusion, 
  generateFusionPersonality, 
  generateTransmigrationOpeningStory 
} from '../services/transmigrationService';

export interface TransmigrationConfig {
  fusion: FusionResult;
  role: 'MC' | 'COMPANION' | 'BOSS';
  genre: GameGenre;
  targetMode: 'new_world' | 'existing_session';
  convertedRealm: string;
  personality: string;
  spiritualRoot: string;
  talents: string[];
  equipment: string[];
  openingStory: string;
}

interface TransmigrationModalProps {
  fusion: FusionResult | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: TransmigrationConfig) => void;
  activeSession: GameSession | null;
}

export const TransmigrationModal: React.FC<TransmigrationModalProps> = ({
  fusion,
  isOpen,
  onClose,
  onConfirm,
  activeSession
}) => {
  const [role, setRole] = useState<'MC' | 'COMPANION' | 'BOSS'>('MC');
  const [genre, setGenre] = useState<GameGenre>(activeSession?.genre || GameGenre.CULTIVATION);
  const [targetMode, setTargetMode] = useState<'new_world' | 'existing_session'>(
    activeSession ? 'existing_session' : 'new_world'
  );
  
  const [realm, setRealm] = useState<string>('');
  const [personality, setPersonality] = useState<string>('');
  const [talents, setTalents] = useState<string[]>([]);
  const [customOpening, setCustomOpening] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-calculate realm, personality, and talents when fusion or genre changes
  useEffect(() => {
    if (!fusion) return;
    const computedRealm = convertFusionToRealm(fusion.rank, fusion.level, genre);
    const computedPersonality = generateFusionPersonality(fusion);
    const computedTalents = extractTalentsFromFusion(fusion);
    const computedOpening = generateTransmigrationOpeningStory(fusion, genre, computedRealm, role);

    setRealm(computedRealm);
    setPersonality(computedPersonality);
    setTalents(computedTalents);
    setCustomOpening(computedOpening);
  }, [fusion, genre, role]);

  if (!isOpen || !fusion) return null;

  const energy = getEnergyTypeInfo(fusion.rank);
  const style = getCardStyling(fusion.rank);
  const isChaos = (fusion.rank || '').toUpperCase().includes('HỖN ĐỘN') || (fusion.rank || '').toUpperCase().includes('CHAOS');

  const handleExecute = () => {
    const config: TransmigrationConfig = {
      fusion,
      role,
      genre: targetMode === 'existing_session' && activeSession ? activeSession.genre : genre,
      targetMode,
      convertedRealm: realm,
      personality,
      spiritualRoot: fusion.dna_components?.map(c => `${c.race} (${c.percentage}%)`).join(' + ') || "Thần Linh Hỗn Độn Căn",
      talents,
      equipment: [
        `Pháp bảo bản mệnh: ${fusion.name}`,
        fusion.baseCharacters?.some(b => b.name.includes("Pin Infinity")) ? "Pin Infinity (Vô Hạn Thần Năng)" : "Chiến Giáp Tinh Hà",
      ],
      openingStory: customOpening
    };
    onConfirm(config);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop with cosmic effect */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-[0_0_50px_rgba(234,179,8,0.15)] overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-950 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wide flex items-center gap-2">
                  Cổng Xuyên Không Đa Vũ Trụ
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                    DHJ ➜ Thiên Đạo
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Đưa nhân vật dung hợp vào Thế Giới Nhập Vai với đầy đủ bản sắc, ngoại hình và quy đổi cảnh giới.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* Character Summary Hero */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-lg shrink-0 bg-slate-900 group">
                <img 
                  src={fusion.imageUrl || "https://picsum.photos/seed/dragonball/300/300"} 
                  alt={fusion.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-md rounded text-[9px] font-black text-amber-400">
                  {fusion.rank}
                </div>
              </div>

              <div className="space-y-1.5 flex-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                    {energy.name}
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {isChaos ? `⭐ x${fusion.level || 1}` : `${fusion.powerLevel.toLocaleString('vi-VN')} BP`}
                  </span>
                  <span className="text-xs text-slate-400">
                    • Độ tương thích: <b className="text-emerald-400">{fusion.compatibility_score}%</b>
                  </span>
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                  {fusion.name}
                </h4>
                {fusion.quote && (
                  <p className="text-xs text-yellow-300 italic flex items-center justify-center sm:justify-start gap-1">
                    <Quote className="w-3 h-3 opacity-60 shrink-0" />
                    <span>"{fusion.quote}"</span>
                  </p>
                )}
                <div className="text-[11px] text-slate-400 line-clamp-2">
                  {fusion.description}
                </div>
              </div>
            </div>

            {/* Step 1: Choose Role */}
            <div className="space-y-2.5">
              <label className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" /> 1. Chọn Vai Trò Trong Thế Giới Nhập Vai
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Main Character */}
                <button
                  type="button"
                  onClick={() => setRole('MC')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    role === 'MC'
                      ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
                      <Crown className="w-4 h-4" />
                    </span>
                    {role === 'MC' && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="text-sm font-black text-white">Nhân Vật Chính (MC)</div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Trực tiếp nhập vai nhân vật này xé rách hư không, chinh phục đỉnh cao thế giới mới.
                  </p>
                </button>

                {/* Companion */}
                <button
                  type="button"
                  onClick={() => setRole('COMPANION')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    role === 'COMPANION'
                      ? 'bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="p-2 rounded-xl bg-cyan-400/20 text-cyan-300">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    {role === 'COMPANION' && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div className="text-sm font-black text-white">Hộ Đạo Giả / Đồng Đội</div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Trở thành người bảo hộ, kề vai sát cánh cùng nhân vật chính trong cốt truyện.
                  </p>
                </button>

                {/* Boss / Legendary NPC */}
                <button
                  type="button"
                  onClick={() => setRole('BOSS')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    role === 'BOSS'
                      ? 'bg-purple-500/15 border-purple-400 shadow-md shadow-purple-500/10 ring-1 ring-purple-400/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="p-2 rounded-xl bg-purple-400/20 text-purple-300">
                      <Skull className="w-4 h-4" />
                    </span>
                    {role === 'BOSS' && <Check className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div className="text-sm font-black text-white">Ẩn Thế Cường Giả / Trùm</div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Ghi vào Bách Khoa Toàn Thư (Codex/Wiki), xuất hiện như cơ duyên hoặc đại địch bí ẩn.
                  </p>
                </button>
              </div>
            </div>

            {/* Step 2: Destination & World Genre */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" /> 2. Chọn Thế Giới & Thể Loại
              </label>

              {/* Existing vs New Session Choice */}
              {activeSession && role !== 'MC' && (
                <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 w-fit">
                  <button
                    type="button"
                    onClick={() => setTargetMode('existing_session')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      targetMode === 'existing_session' 
                        ? 'bg-amber-400 text-slate-950 shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Đưa Vào Ván Game Đang Chơi ({activeSession.heroName} - {activeSession.genre})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode('new_world')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      targetMode === 'new_world' 
                        ? 'bg-amber-400 text-slate-950 shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tạo Thế Giới Mới Hoàn Toàn
                  </button>
                </div>
              )}

              {/* Genre Selector */}
              {(targetMode === 'new_world' || role === 'MC') && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    GameGenre.CULTIVATION,
                    GameGenre.FANTASY,
                    GameGenre.SCIFI,
                    GameGenre.POST_APOCALYPTIC,
                    GameGenre.ANIME_CROSSOVER,
                    GameGenre.ALL_ANIME,
                    GameGenre.HORROR,
                    GameGenre.REAL_LIFE
                  ].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenre(g)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        genre === g
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm ring-1 ring-amber-400/40'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3: Converted Realm & Power Scale Preview */}
            <div className="p-4 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-950 border border-indigo-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-cyan-300 tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Quy Đổi Cảnh Giới & Sức Mạnh Tương Ứng
                </span>
                <span className="text-[10px] text-slate-400">
                  Thể loại: <b className="text-white">{targetMode === 'existing_session' && activeSession ? activeSession.genre : genre}</b>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex-1 w-full sm:w-auto">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Rank Gốc (DHJ)</span>
                  <div className="text-sm font-bold text-yellow-400">{fusion.rank}</div>
                </div>

                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-cyan-400">
                  <ArrowRight className="w-4 h-4" />
                </div>

                <div className="flex-1 w-full sm:w-auto">
                  <span className="text-[9px] uppercase font-bold text-emerald-400 block">Cảnh Giới Quy Đổi</span>
                  <input
                    type="text"
                    value={realm}
                    onChange={(e) => setRealm(e.target.value)}
                    className="w-full bg-transparent font-black text-sm text-cyan-300 border-b border-cyan-500/40 focus:outline-none focus:border-cyan-400 py-0.5"
                    placeholder="Nhập cảnh giới tùy chỉnh..."
                  />
                </div>
              </div>

              {/* Inherited Talents */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Thiên Phú & Tuyệt Kỹ Kế Thừa ({talents.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {talents.map((t, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-[11px] text-slate-200 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Toggle (Personality & Opening) */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{showAdvanced ? "▲ Thu gọn tùy biến chi tiết" : "▼ Tùy biến Tính cách & Bối cảnh giáng lâm"}</span>
              </button>

              {showAdvanced && (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Tính Cách & Khẩu Khí (AI Roleplay Prompt)
                    </label>
                    <textarea
                      value={personality}
                      onChange={(e) => setPersonality(e.target.value)}
                      rows={2}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Cốt Truyện Mở Đầu Khi Giáng Lâm
                    </label>
                    <textarea
                      value={customOpening}
                      onChange={(e) => setCustomOpening(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-400 text-center sm:text-left">
              Vai trò: <b className="text-amber-300">{role === 'MC' ? 'Nhân Vật Chính' : role === 'COMPANION' ? 'Hộ Đạo Giả' : 'Ẩn Thế Cường Giả'}</b>
              {' '}• Cảnh giới: <b className="text-cyan-300">{realm}</b>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                onClick={handleExecute}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Khởi Hành Xuyên Không</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
