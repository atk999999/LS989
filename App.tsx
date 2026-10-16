import React, { useState, useEffect, useCallback } from 'react';
import { 
  GameSession, Turn, GameStats, GameOption, StoryLength, 
  RegistryEntry, WorldSettings, CharacterTraits, GameGenre, 
  GameMechanics 
} from './types';
import { db } from './db';
import { geminiService } from './services/geminiService';
import { GameUI } from './components/GameUI';
import { SettingsScreen } from './components/SettingsScreen';
import { LandingScreen } from './components/LandingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import DHJApp from './DHJ-main/src/App';
import { FusionResult } from './DHJ-main/src/components/PokemonCard';
import { TransmigrationModal, TransmigrationConfig } from './components/TransmigrationModal';
import { FlaskConical, Book, Sparkles, Swords, CheckCircle2, ChevronRight, User } from 'lucide-react';

const App: React.FC = () => {
  // Navigation & Mode
  const [appMode, setAppMode] = useState<'dhj' | 'rpg'>('dhj');
  const [dhjInitialView, setDhjInitialView] = useState<'lab' | 'fusions'>('lab');
  const [dhjInitialMode, setDhjInitialMode] = useState<'fusion' | 'comparison'>('fusion');

  // RPG Session State
  const [session, setSession] = useState<GameSession | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [currentStats, setCurrentStats] = useState<GameStats | null>(null);
  const [currentOptions, setCurrentOptions] = useState<GameOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'landing' | 'settings' | 'game'>('landing');
  const [initialTemplate, setInitialTemplate] = useState<any>(null);

  // Transmigration State
  const [transmigratingFusion, setTransmigratingFusion] = useState<FusionResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fusionCount, setFusionCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('fusion_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.length : 0;
      }
    } catch {}
    return 0;
  });

  // Track fusion count changes efficiently without heavy 3s polling
  useEffect(() => {
    const updateCount = () => {
      try {
        const saved = localStorage.getItem('fusion_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          const count = Array.isArray(parsed) ? parsed.length : 0;
          setFusionCount(prev => (prev === count ? prev : count));
        } else {
          setFusionCount(0);
        }
      } catch {}
    };

    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('fusion_count_change', updateCount);

    // Low-impact periodic fallback only when page is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateCount();
      }
    }, 20000);

    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('fusion_count_change', updateCount);
      clearInterval(interval);
    };
  }, []);

  // Automatically restore active session and reading state after tabbing out or reloading
  useEffect(() => {
    const restoreActiveSession = async () => {
      try {
        const savedSessionId = localStorage.getItem('active_session_id');
        const savedMode = localStorage.getItem('app_mode') as 'dhj' | 'rpg' | null;
        const savedView = localStorage.getItem('rpg_view') as 'landing' | 'settings' | 'game' | null;

        if (savedSessionId) {
          const id = Number(savedSessionId);
          if (!isNaN(id) && id > 0) {
            const foundSession = await db.sessions.get(id);
            if (foundSession) {
              const loadedTurns = await db.turns.where('sessionId').equals(id).sortBy('turnIndex');
              const loadedWiki = await db.encyclopedia.where('sessionId').equals(id).toArray();

              setSession(foundSession);
              setTurns(loadedTurns);

              const lastModelTurn = [...loadedTurns].reverse().find(t => t.role === 'model' && t.rawResponseJSON);
              if (lastModelTurn && lastModelTurn.rawResponseJSON) {
                try {
                  const parsed = JSON.parse(lastModelTurn.rawResponseJSON);
                  setCurrentStats(parsed.stats);
                  setCurrentOptions(parsed.options);
                } catch (e) {
                  console.error("Error parsing turn stats", e);
                }
              }

              setView('game');
              setAppMode(savedMode || 'rpg');
              return;
            }
          }
        }

        if (savedMode) setAppMode(savedMode);
        if (savedView) setView(savedView);
      } catch (err) {
        console.error("Auto restore session failed", err);
      }
    };

    restoreActiveSession();

    // Listen for visibility changes (user tabs out to another app and tabs back in)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const activeId = localStorage.getItem('active_session_id');
        if (activeId && (!session || session.id !== Number(activeId))) {
          restoreActiveSession();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Save current app mode and view state
  useEffect(() => {
    localStorage.setItem('app_mode', appMode);
  }, [appMode]);

  useEffect(() => {
    localStorage.setItem('rpg_view', view);
  }, [view]);

  useEffect(() => {
    if (session?.id) {
      localStorage.setItem('active_session_id', String(session.id));
      localStorage.setItem('app_mode', 'rpg');
      localStorage.setItem('rpg_view', 'game');
    }
  }, [session?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleStartNewGame = () => {
    setInitialTemplate(null);
    setView('settings');
    setAppMode('rpg');
    localStorage.setItem('app_mode', 'rpg');
    localStorage.setItem('rpg_view', 'settings');
  };

  const handleLoadGame = (loadedSession: GameSession, loadedTurns: Turn[], loadedWiki: RegistryEntry[]) => {
    setSession(loadedSession);
    setTurns(loadedTurns);
    if (loadedSession.id) {
      localStorage.setItem('active_session_id', String(loadedSession.id));
      localStorage.setItem('app_mode', 'rpg');
      localStorage.setItem('rpg_view', 'game');
    }
    
    // Reconstruct current stats from last model turn if possible
    const lastModelTurn = [...loadedTurns].reverse().find(t => t.role === 'model' && t.rawResponseJSON);
    if (lastModelTurn && lastModelTurn.rawResponseJSON) {
        try {
            const parsed = JSON.parse(lastModelTurn.rawResponseJSON);
            setCurrentStats(parsed.stats);
            setCurrentOptions(parsed.options);
        } catch (e) {
            console.error("Error parsing last turn stats", e);
        }
    }
    
    // Update DB wiki cache if needed
    if (loadedSession.id && loadedWiki.length > 0) {
        db.upsertWikiEntries(loadedSession.id, loadedWiki);
    }
    
    setView('game');
    setAppMode('rpg');
  };

  const handleSettingsConfirm = async (
    basicInfo: any,
    world: WorldSettings,
    traits: CharacterTraits,
    gameConfig: { autoCodex: boolean, livingWorld: boolean },
    openingLength: number
  ) => {
    setLoading(true);
    try {
        const mechanics: GameMechanics = {
            reputation: false, survival: false, crafting: false, combat: false,
            time: true, currency: true, backpack: true,
            autoCodex: gameConfig.autoCodex,
            livingWorld: gameConfig.livingWorld
        };

        const newSession: GameSession = {
            heroName: basicInfo.name,
            customTitle: basicInfo.customTitle,
            gender: basicInfo.gender,
            genre: basicInfo.genre,
            worldSettings: world,
            characterTraits: traits,
            createdAt: Date.now(),
            avatarUrl: basicInfo.avatarUrl,
            isNSFW: basicInfo.isNSFW,
            nsfwIntensity: basicInfo.nsfwIntensity,
            writingStyle: basicInfo.writingStyle,
            nsfwFocus: basicInfo.nsfwFocus,
            pronounRules: basicInfo.pronounRules,
            aiModel: basicInfo.aiModel || 'gemini-3.8-flash',
            backgroundImageUrl: basicInfo.backgroundImageUrl,
            backgroundType: basicInfo.backgroundType,
            fontFamily: basicInfo.fontFamily,
            memoryDepth: basicInfo.memoryDepth,
            mechanics: mechanics,
            aiStyle: 'balanced',
            eventFrequency: 'medium'
        };

        // Create opening prompt
        let openingPrompt = `[HỆ THỐNG]: Khởi tạo thế giới. `;
        if (openingLength > 0) {
             openingPrompt += `Hãy viết phần mở đầu câu chuyện thật ấn tượng (khoảng ${openingLength} từ). `;
        } else {
             openingPrompt += `Hãy bắt đầu câu chuyện. `;
        }
        if (world.openingStory) {
            openingPrompt += `Tình huống khởi đầu: ${world.openingStory}`;
        }

        // Generate first turn
        const result = await geminiService.generateTurn(
            0,
            newSession.aiModel,
            newSession.genre,
            newSession.heroName,
            newSession.gender,
            newSession.worldSettings,
            openingPrompt,
            [],
            newSession.characterTraits,
            openingLength >= 1200 ? 'epic' : 'medium',
            newSession.isNSFW,
            newSession.nsfwIntensity,
            newSession.writingStyle,
            newSession.nsfwFocus,
            undefined,
            newSession.pronounRules,
            newSession.aiStyle,
            newSession.eventFrequency,
            newSession.mechanics,
            newSession.memoryDepth
        );

        // Save to DB
        const sessionId = await db.importSession(newSession, []); 
        const sessionWithId = { ...newSession, id: sessionId };
        
        const turn0: Turn = {
            sessionId,
            turnIndex: 0,
            role: 'model',
            narrative: result.parsed.narrative,
            rawResponseJSON: result.raw,
        };

        await db.turns.add(turn0);
        
        if (result.parsed.newRegistry && result.parsed.newRegistry.length > 0) {
             await db.upsertWikiEntries(sessionId, result.parsed.newRegistry as RegistryEntry[]);
        }

        setSession(sessionWithId);
        setTurns([turn0]);
        setCurrentStats(result.parsed.stats);
        setCurrentOptions(result.parsed.options || []);
        setView('game');
        setAppMode('rpg');

    } catch (e) {
        console.error("Game Start Error", e);
        alert("Có lỗi khi khởi tạo game. Vui lòng thử lại.");
    } finally {
        setLoading(false);
    }
  };

  const handleTurn = async (prompt: string, lengthMode: StoryLength) => {
      if (!session || !session.id) return;
      setLoading(true);

      try {
          const userTurn: Turn = {
              sessionId: session.id,
              turnIndex: turns.length,
              role: 'user',
              userPrompt: prompt
          };

          const newHistory = [...turns, userTurn];
          setTurns(newHistory);
          await db.turns.add(userTurn);

          const result = await geminiService.generateTurn(
              session.id,
              session.aiModel,
              session.genre,
              session.heroName,
              session.gender,
              session.worldSettings,
              prompt,
              turns, 
              session.characterTraits,
              lengthMode,
              session.isNSFW,
              session.nsfwIntensity,
              session.writingStyle,
              session.nsfwFocus,
              session.summary,
              session.pronounRules,
              session.aiStyle,
              session.eventFrequency,
              session.mechanics,
              session.memoryDepth
          );

          const modelTurn: Turn = {
              sessionId: session.id,
              turnIndex: newHistory.length,
              role: 'model',
              narrative: result.parsed.narrative,
              rawResponseJSON: result.raw
          };

          const finalHistory = [...newHistory, modelTurn];
          setTurns(finalHistory);
          setCurrentStats(result.parsed.stats);
          setCurrentOptions(result.parsed.options || []);
          await db.turns.add(modelTurn);

          if (result.parsed.newRegistry && result.parsed.newRegistry.length > 0) {
              await db.upsertWikiEntries(session.id, result.parsed.newRegistry as RegistryEntry[]);
          }

          if (finalHistory.length % 10 === 0) {
             const newSummary = await geminiService.summarizeStory(session.summary || "", finalHistory.slice(-10));
             if (newSummary !== session.summary) {
                 await db.sessions.update(session.id, { summary: newSummary });
                 setSession(prev => prev ? ({ ...prev, summary: newSummary }) : null);
             }
          }

          if (result.parsed.isGameOver) {
              alert("Kết thúc game!");
          }

      } catch (e) {
          console.error("Turn Generation Error", e);
          alert("Có lỗi xảy ra khi tạo nội dung. Vui lòng thử lại.");
      } finally {
          setLoading(false);
      }
  };

  const handleUndo = async () => {
      if (turns.length === 0 || !session || !session.id) return;
      
      let countToRemove = 1;
      const lastTurn = turns[turns.length - 1];
      if (lastTurn.role === 'model' && turns.length >= 2) {
          countToRemove = 2;
      }

      const newTurns = turns.slice(0, turns.length - countToRemove);
      
      const idsToDelete = turns.slice(turns.length - countToRemove).map(t => t.id).filter(id => id !== undefined) as number[];
      if (idsToDelete.length > 0) {
          await db.turns.bulkDelete(idsToDelete);
      }
      
      setTurns(newTurns);
      
      const prevModelTurn = [...newTurns].reverse().find(t => t.role === 'model');
      if (prevModelTurn && prevModelTurn.rawResponseJSON) {
          try {
              const parsed = JSON.parse(prevModelTurn.rawResponseJSON);
              setCurrentStats(parsed.stats);
              setCurrentOptions(parsed.options);
          } catch {}
      }
  };

  const handleRegenerate = (turnIndex: number, newPrompt: string, lengthMode: StoryLength) => {
      handleUndo().then(() => handleTurn(newPrompt, lengthMode));
  };

  const handleUpdateSession = (field: keyof GameSession, value: any) => {
      if (!session || !session.id) return;
      const updated = { ...session, [field]: value };
      setSession(updated);
      db.sessions.update(session.id, { [field]: value });
  };

  const handleExportJson = () => {
      if (!session || !session.id) return;
      
      db.encyclopedia.where('sessionId').equals(session.id).toArray().then(wiki => {
           const data = {
               session,
               turns,
               encyclopedia: wiki
           };
           const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
           const url = URL.createObjectURL(blob);
           const a = document.createElement('a');
           a.href = url;
           a.download = `thien-dao-save-${session.heroName}-${Date.now()}.json`;
           a.click();
           URL.revokeObjectURL(url);
      });
  };

  const handleExportText = () => {
    if (!session) return;
    try {
        let content = `THIÊN ĐẠO SIMULATOR - BIÊN NIÊN SỬ\n`;
        content += `====================================\n`;
        content += `Nhân vật: ${session.heroName}\n`;
        content += `Thể loại: ${session.genre}\n`;
        content += `Ngày khởi tạo: ${new Date(session.createdAt).toLocaleString()}\n`;
        content += `====================================\n\n`;

        turns.forEach((turn, idx) => {
            if (turn.role === 'user') {
                content += `\n[LỰA CHỌN CỦA BẠN]: ${turn.userPrompt}\n`;
                content += `------------------------------------\n`;
            } else if (turn.role === 'model') {
                content += `${turn.narrative}\n`;
            }
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Truyen-${session.heroName}-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Export Text failed", e);
        alert("Lỗi khi xuất file truyện.");
    }
  };

  const handleExit = () => {
      localStorage.removeItem('active_session_id');
      localStorage.setItem('rpg_view', 'landing');
      setView('landing');
      setSession(null);
      setTurns([]);
      setCurrentStats(null);
  };
  
  const handleDeleteSession = async () => {
      if(!session || !session.id) return;
      if (window.confirm("Bạn có chắc muốn xóa vĩnh viễn file save này?")) {
          await db.sessions.delete(session.id);
          await db.turns.where('sessionId').equals(session.id).delete();
          await db.encyclopedia.where('sessionId').equals(session.id).delete();
          handleExit();
      }
  };

  // --- Transmigration Execution ---
  const handleExecuteTransmigration = async (config: TransmigrationConfig) => {
    setTransmigratingFusion(null);

    if (config.role === 'MC') {
      // Create new world with character as Protagonist
      const basicInfo = {
        name: config.fusion.name,
        customTitle: `Truyền Kỳ ${config.fusion.name}`,
        gender: 'Nam',
        genre: config.genre,
        avatarUrl: config.fusion.imageUrl,
        isNSFW: false,
        nsfwIntensity: 'soft' as const,
        writingStyle: 'convert' as const,
        nsfwFocus: [],
        pronounRules: '',
        aiModel: 'gemini-3.8-flash',
        fontFamily: "'Merriweather', serif",
        memoryDepth: 'standard' as const
      };

      const world: WorldSettings = {
        worldContext: `Thế giới ${config.genre} bao la vô tận. Cường giả như mây, bí cảnh viễn cổ rải rác khắp các châu đại lục.`,
        plotDirection: `Hành trình của ${config.fusion.name} khi xé rách vách ngăn không gian, mang theo thần lực vũ trụ Dragon Ball (${config.convertedRealm}) giáng lâm để viết nên một huyền thoại mới.`,
        majorFactions: `- Các Đại Tông Môn & Hoàng Tộc\n- Thế Lực Cấm Địa Thần Bí\n- Liên Minh Các Cường Giả`,
        keyNpcs: `- Tuyệt thế thiên kiêu bản địa\n- Tông chủ chí tôn\n- Bí ẩn cổ xưa giám sát giả`,
        openingStory: config.openingStory
      };

      const traits: CharacterTraits = {
        spiritualRoot: config.spiritualRoot,
        talents: config.talents,
        personality: config.personality
      };

      showToast(`⚡ Đang xé rách không-thời gian: Khởi tạo thế giới ${config.genre} cho ${config.fusion.name}!`);
      setAppMode('rpg');
      await handleSettingsConfirm(basicInfo, world, traits, { autoCodex: true, livingWorld: true }, 600);

    } else {
      // Role is Companion or Boss
      if (config.targetMode === 'existing_session' && session && session.id) {
        const roleLabel = config.role === 'COMPANION' ? 'Hộ Đạo Giả' : 'Ẩn Thế Cường Giả / Trùm';
        const entry: RegistryEntry = {
          sessionId: session.id,
          name: config.fusion.name,
          type: 'NPC',
          description: `[${roleLabel}] ${config.fusion.description}`,
          status: 'Đang hiện diện trong thế giới',
          firstSeenTurn: turns.length,
          powerLevel: config.convertedRealm,
          appearance: config.fusion.visual_prompt || config.fusion.description,
          personality: config.personality,
          secrets: `Thần Lực Gốc: ${config.fusion.rank} (${config.fusion.powerLevel.toLocaleString('vi-VN')} BP). Tuyệt kỹ: ${config.talents.join(', ')}.`
        };

        await db.encyclopedia.add(entry);
        showToast(`✨ ${config.fusion.name} đã giáng lâm vào thế giới của ${session.heroName} với tư cách ${roleLabel} (${config.convertedRealm})!`);
        
        // Trigger arrival narrative turn
        const arrivalPrompt = `[HỆ THỐNG BIẾN ĐỘNG]: Bất ngờ thiên địa dị tượng, lôi kiếp xé rách bầu trời! Thực thể siêu việt ${config.fusion.name} mang cảnh giới [${config.convertedRealm}] mang thần lực vũ trụ giáng lâm và trở thành [${roleLabel}]! Hãy miêu tả khoảnh khắc chấn động này.`;
        setAppMode('rpg');
        setView('game');
        await handleTurn(arrivalPrompt, 'medium');

      } else {
        // Create new session draft with this NPC registered
        const roleLabel = config.role === 'COMPANION' ? 'Hộ Đạo Giả' : 'Ẩn Thế Cường Giả';
        setInitialTemplate({
          basicInfo: {
            name: 'Trần Phong',
            customTitle: `Thế Giới Giáng Lâm: ${config.fusion.name}`,
            genre: config.genre,
            gender: 'Nam',
            aiModel: 'gemini-3.8-flash'
          },
          worldSettings: {
            worldContext: `Thế giới ${config.genre} vừa xuất hiện vết nứt không-thời gian kỳ bí.`,
            plotDirection: `Khám phá các bí mật cổ đại và tương tác cùng vị thực thể giáng lâm: ${config.fusion.name}.`,
            majorFactions: `- Thế lực bản địa\n- Vị Diện Giám Sát`,
            keyNpcs: `- ${config.fusion.name} (${roleLabel} - Tu vi: ${config.convertedRealm})`,
            openingStory: `Bầu trời bỗng xuất hiện luồng thần quang rực rỡ, ${config.fusion.name} giáng thế với cảnh giới [${config.convertedRealm}]. ${config.openingStory}`
          },
          characterTraits: {
            spiritualRoot: 'Hỗn Độn Linh Căn',
            talents: ['Kỳ Ngộ Vô Hạn', 'Nhìn Thấu Khí Vận'],
            personality: 'Điềm tĩnh cẩn trọng'
          }
        });
        showToast(`Đã thiết lập mẫu thế giới mới với sự xuất hiện của ${config.fusion.name}!`);
        setAppMode('rpg');
        setView('settings');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* ================= UNIFIED TOP NAVIGATION BAR ================= */}
      <header className="sticky top-0 z-[100] border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-3 sm:px-6 h-14 flex items-center justify-between gap-3 shadow-lg">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div 
            onClick={() => { setAppMode('dhj'); setDhjInitialView('lab'); setDhjInitialMode('fusion'); }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-yellow-400 to-cyan-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white truncate">
                  FUSION & THIÊN ĐẠO
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold hidden sm:inline">
                  v6.9
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Mode Switch Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto max-w-full">
          {/* Dung Hợp Tab */}
          <button
            type="button"
            onClick={() => {
              setAppMode('dhj');
              setDhjInitialView('lab');
              setDhjInitialMode('fusion');
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              appMode === 'dhj' && dhjInitialView === 'lab' && dhjInitialMode === 'fusion'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 shrink-0" />
            <span>Dung Hợp</span>
          </button>

          {/* So Sánh Tab */}
          <button
            type="button"
            onClick={() => {
              setAppMode('dhj');
              setDhjInitialView('lab');
              setDhjInitialMode('comparison');
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              appMode === 'dhj' && dhjInitialView === 'lab' && dhjInitialMode === 'comparison'
                ? 'bg-purple-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Swords className="w-3.5 h-3.5 shrink-0" />
            <span>So Sánh</span>
          </button>

          {/* Sổ Thẻ Bài Tab */}
          <button
            type="button"
            onClick={() => {
              setAppMode('dhj');
              setDhjInitialView('fusions');
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              appMode === 'dhj' && dhjInitialView === 'fusions'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Book className="w-3.5 h-3.5 shrink-0" />
            <span>Sổ Thẻ Bài</span>
            {fusionCount > 0 && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                appMode === 'dhj' && dhjInitialView === 'fusions' 
                  ? 'bg-slate-950 text-amber-300' 
                  : 'bg-amber-400/20 text-amber-300'
              }`}>
                {fusionCount}
              </span>
            )}
          </button>

          {/* Thế Giới Nhập Vai Tab */}
          <button
            type="button"
            onClick={() => {
              setAppMode('rpg');
              if (session) {
                setView('game');
              }
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              appMode === 'rpg'
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 text-white shadow-md font-black ring-1 ring-white/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-yellow-300 fill-current" />
            <span>Nhập Vai</span>
            {session && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Đang có ván game" />
            )}
          </button>
        </div>

        {/* Right Quick Status / Action */}
        <div className="flex items-center gap-2">
          {session ? (
            <div 
              onClick={() => { setAppMode('rpg'); setView('game'); }}
              className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-amber-400/50 rounded-xl cursor-pointer transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <div className="text-left text-[11px] leading-tight">
                <span className="font-bold text-white block truncate max-w-[120px]">{session.heroName}</span>
                <span className="text-slate-400 text-[10px]">{session.genre}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleStartNewGame}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chơi Mới</span>
            </button>
          )}
        </div>
      </header>

      {/* ================= FLOATING TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-[200] max-w-md p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-2 border-amber-400/60 rounded-2xl shadow-2xl flex items-start gap-3 animate-slide-up">
          <div className="p-1 rounded-full bg-amber-400/20 text-amber-300 shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-100 flex-1 leading-snug">
            {toastMessage}
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT CONTAINER ================= */}
      <main className="flex-1 flex flex-col">
        {/* VIEW 1: DBZ FUSION LAB & CODEX */}
        {appMode === 'dhj' && (
          <div className="flex-1 w-full">
            <DHJApp 
              initialView={dhjInitialView}
              initialMode={dhjInitialMode}
              hideHeader={true}
              activeSessionName={session ? session.heroName : undefined}
              onNavigateToRPG={() => setAppMode('rpg')}
              onTransmigrateToRPG={(f) => setTransmigratingFusion(f)}
            />
          </div>
        )}

        {/* VIEW 2: ROLEPLAYING WORLD (THIÊN ĐẠO SIMULATOR) */}
        {appMode === 'rpg' && (
          <div className="flex-1 w-full flex flex-col">
            <ErrorBoundary onReset={handleExit}>
              {view === 'landing' && (
                <LandingScreen 
                  onStartNewGame={handleStartNewGame}
                  onLoadGame={handleLoadGame}
                />
              )}
              
              {view === 'settings' && (
                <SettingsScreen 
                  onConfirm={handleSettingsConfirm}
                  onBack={() => setView('landing')}
                  initialTemplate={initialTemplate}
                />
              )}

              {view === 'game' && session && (
                <GameUI 
                  session={session}
                  turns={turns}
                  currentStats={currentStats}
                  currentOptions={currentOptions}
                  loading={loading}
                  onOptionClick={handleTurn}
                  onRegenerate={handleRegenerate}
                  onUndo={handleUndo}
                  genre={session.genre}
                  onExit={handleExit}
                  onDelete={handleDeleteSession}
                  onExport={handleExportJson}
                  onExportText={handleExportText}
                  onSave={() => handleUpdateSession('id', session.id)} 
                  onUpdateSession={handleUpdateSession}
                  avatarUrl={session.avatarUrl}
                />
              )}
            </ErrorBoundary>
          </div>
        )}
      </main>

      {/* ================= TRANSMIGRATION PORTAL MODAL ================= */}
      <TransmigrationModal 
        fusion={transmigratingFusion}
        isOpen={!!transmigratingFusion}
        onClose={() => setTransmigratingFusion(null)}
        onConfirm={handleExecuteTransmigration}
        activeSession={session}
      />
    </div>
  );
};

export default App;