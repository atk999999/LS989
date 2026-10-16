import { GoogleGenAI, Type } from "@google/genai";
import { 
  GameGenre, WorldSettings, CharacterTraits, StoryLength, 
  NSFWIntensity, WritingStyle, NSFWFocus, AIStyle, EventFrequency, 
  GameMechanics, Turn, AIResponseSchema 
} from '../types';
import { findRelevantContext, findRelevantWiki } from '../db';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  async embedText(text: string): Promise<number[]> {
    if (!text || !text.trim()) return [];
    try {
      const response: any = await this.ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: text,
      });
      return response.embedding?.values || response.embeddings?.[0]?.values || [];
    } catch (e) {
      try {
        // Fallback for embedding
        const fbRes: any = await this.ai.models.embedContent({
          model: "text-embedding-004",
          contents: text,
        });
        return fbRes.embedding?.values || fbRes.embeddings?.[0]?.values || [];
      } catch {
        console.warn("Embedding failed", e);
        return [];
      }
    }
  }

  async generateTurn(
    sessionId: number,
    modelName: string | undefined,
    genre: GameGenre,
    heroName: string,
    gender: string,
    worldSettings: WorldSettings,
    userPrompt: string,
    history: Turn[],
    traits: CharacterTraits | undefined,
    lengthMode: StoryLength,
    isNSFW: boolean | undefined,
    nsfwIntensity: NSFWIntensity | undefined,
    writingStyle: WritingStyle | undefined,
    nsfwFocus: NSFWFocus[] | undefined,
    summary: string | undefined,
    pronounRules: string | undefined,
    aiStyle: AIStyle | undefined,
    eventFrequency: EventFrequency | undefined,
    mechanics: GameMechanics | undefined,
    memoryDepth: 'standard' | 'high' | undefined
  ): Promise<{ parsed: AIResponseSchema; raw: string; thoughtSignature?: string }> {
    
    // 1. Prepare RAG Context
    let contextString = "";
    let wikiString = "";
    
    if (userPrompt && userPrompt.length > 5) {
        try {
            const queryVec = await this.embedText(userPrompt);
            if (queryVec.length > 0) {
                // Fetch relevant past turns
                const relevantTurns = await findRelevantContext(sessionId, queryVec, history.length, memoryDepth === 'high' ? 8 : 4);
                if (relevantTurns.length > 0) {
                     contextString = relevantTurns.map(t => `[Hồi ức - Turn ${t.turn.turnIndex}]: ${t.turn.narrative?.substring(0, 300)}...`).join("\n\n");
                }

                // Fetch relevant wiki entries
                const relevantWiki = await findRelevantWiki(sessionId, queryVec, userPrompt, 5);
                if (relevantWiki.length > 0) {
                     wikiString = relevantWiki.map(e => `[Wiki - ${e.type}]: ${e.name} - ${e.description} (Status: ${e.status})`).join("\n");
                }
            }
        } catch (e) {
            console.warn("RAG retrieval failed", e);
        }
    }

    // 2. Build System Instruction
    const systemInstruction = this.buildSystemPrompt(
        genre, heroName, gender, worldSettings, traits, 
        isNSFW, nsfwIntensity, writingStyle, nsfwFocus, 
        summary, pronounRules, aiStyle, eventFrequency, mechanics,
        contextString, wikiString
    );

    // 3. Prepare History for Chat
    // Gemini 1.5/2.5/3.0 format: { role: 'user' | 'model', parts: [{ text: string }] }
    const contents = history.slice(Math.max(0, history.length - (memoryDepth === 'high' ? 20 : 10))).map(t => ({
      role: t.role,
      parts: [{ text: t.role === 'user' ? (t.userPrompt || "") : (t.narrative || "") }]
    }));

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: this.enrichUserPrompt(userPrompt, lengthMode, mechanics) }]
    });

    // 4. Define Response Schema
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        narrative: { type: Type.STRING },
        worldEvents: { type: Type.ARRAY, items: { type: Type.STRING } },
        stats: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            realm: { type: Type.STRING },
            status: { type: Type.STRING },
            inventory: { type: Type.ARRAY, items: { type: Type.STRING } },
            attributes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING },
                  value: { type: Type.STRING }
                }
              }
            },
            currency: { type: Type.STRING },
            currentTime: { type: Type.STRING },
            currentLocation: { type: Type.STRING },
            visitedLocations: { type: Type.ARRAY, items: { type: Type.STRING } },
            mapData: {
                type: Type.OBJECT,
                properties: {
                    locationName: { type: Type.STRING },
                    currentFloor: { type: Type.STRING },
                    layout: { 
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                floorName: { type: Type.STRING },
                                rooms: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }
                        }
                    },
                    isInterior: { type: Type.BOOLEAN }
                }
            }
          }
        },
        options: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              action: { type: Type.STRING },
              type: { type: Type.STRING }
            }
          }
        },
        isGameOver: { type: Type.BOOLEAN },
        newRegistry: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { 
                type: Type.STRING,
                enum: ['NPC', 'LOCATION', 'FACTION', 'ITEM', 'KNOWLEDGE', 'SKILL']
              },
              description: { type: Type.STRING },
              status: { type: Type.STRING },
              powerLevel: { type: Type.STRING },
              affiliation: { type: Type.STRING },
              appearance: { type: Type.STRING },
              personality: { type: Type.STRING },
              secrets: { type: Type.STRING },
            },
            required: ['name', 'type', 'description']
          }
        }
      },
      required: ['narrative', 'stats', 'isGameOver']
    };

    // 5. Call API - resolve deprecated models to latest active models
    let model = modelName || 'gemini-3.8-flash';
    if (model === 'gemini-3.1-pro-preview' || model === 'gemini-3-pro-preview' || model === 'gemini-1.5-pro' || model === 'gemini-2.0-pro' || model === 'gemini-pro') {
      model = 'gemini-4-argon';
    } else if (model === 'gemini-3-flash-preview' || model === 'gemini-2.5-flash' || model === 'gemini-2.0-flash' || model === 'gemini-1.5-flash' || model === 'gemini-flash' || model === 'gemini-flash-latest') {
      model = 'gemini-3.8-flash';
    } else if (model === 'gemini-flash-lite-latest' || model === 'gemini-flash-lite') {
      model = 'gemini-3.1-flash-lite';
    }

    let result: any;
    try {
        result = await this.ai.models.generateContent({
            model: model,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.9,
                topK: 64,
                topP: 0.95,
            }
        });
    } catch (e) {
        if (model !== 'gemini-3.8-flash') {
            console.warn(`Model ${model} failed, falling back to gemini-3.8-flash:`, e);
            try {
                result = await this.ai.models.generateContent({
                    model: 'gemini-3.8-flash',
                    contents: contents,
                    config: {
                        systemInstruction: systemInstruction,
                        responseMimeType: 'application/json',
                        responseSchema: responseSchema,
                        temperature: 0.9,
                        topK: 64,
                        topP: 0.95,
                    }
                });
            } catch (fallbackErr) {
                console.error("Gemini Fallback Generation Error", fallbackErr);
                throw fallbackErr;
            }
        } else {
            console.error("Gemini Generation Error", e);
            throw e;
        }
    }

    const text = result.text || "{}";
    let parsed: AIResponseSchema;
    try {
        parsed = JSON.parse(text);
    } catch (e) {
        console.error("JSON Parse Error", e);
        // Fallback empty response
        parsed = { narrative: "Hệ thống gặp lỗi khi xử lý phản hồi.", stats: {} as any, isGameOver: false, options: [] };
    }

    return { parsed, raw: text };
  }

  // --- Helpers ---

  private enrichUserPrompt(prompt: string, lengthMode: StoryLength, mechanics?: GameMechanics): string {
      let suffix = "";
      if (lengthMode === 'short') suffix += "\n[Yêu cầu: Viết ngắn gọn, khoảng 100-200 từ]";
      else if (lengthMode === 'long') suffix += "\n[Yêu cầu: Viết dài, chi tiết, khoảng 600-800 từ]";
      else if (lengthMode === 'epic') suffix += "\n[Yêu cầu: Viết cực dài, tiểu thuyết hóa, tối thiểu 1200 từ]";
      
      if (mechanics?.livingWorld) suffix += "\n[System: Hãy mô phỏng 1-2 sự kiện thế giới xảy ra song song (Living World) trong output JSON]";
      
      return prompt + suffix;
  }

  private buildSystemPrompt(
      genre: string, name: string, gender: string, world: WorldSettings, traits?: CharacterTraits,
      isNSFW?: boolean, nsfwIntensity?: string, writingStyle?: string, nsfwFocus?: NSFWFocus[],
      summary?: string, pronounRules?: string, aiStyle?: string, eventFrequency?: string, mechanics?: GameMechanics,
      context?: string, wiki?: string
  ): string {
      
      const autoCodexEnabled = mechanics ? mechanics.autoCodex : true; // Default to true if undefined

      return `
      Bạn là Thiên Đạo (Game Master) của trò chơi nhập vai thể loại ${genre}.
      Người chơi: ${name} (Giới tính: ${gender}).
      ${traits ? `Căn cơ: ${traits.spiritualRoot}. Thiên phú: ${traits.talents.join(', ')}. Tính cách: ${traits.personality}.` : ''}

      THẾ GIỚI:
      ${world.worldContext}
      Cốt truyện chính: ${world.plotDirection}
      Các thế lực: ${world.majorFactions}
      NPC quan trọng: ${world.keyNpcs}
      ${world.referenceContext ? `\nDỮ LIỆU THAM KHẢO (FILE): ${world.referenceContext.substring(0, 2000)}...` : ''}

      ${summary ? `TÓM TẮT CỐT TRUYỆN TRƯỚC ĐÓ:\n${summary}` : ''}

      ${context ? `HỒI ỨC LIÊN QUAN:\n${context}` : ''}
      ${wiki ? `THÔNG TIN WIKI:\n${wiki}` : ''}

      LUẬT CHƠI:
      1. Viết tiếp câu chuyện dựa trên hành động của người chơi.
      2. Nếu ${writingStyle === 'convert'}, sử dụng văn phong Hán Việt, Convert (Tiên hiệp). Nếu ${writingStyle === 'anime'}, dùng văn phong Light Novel Nhật Bản.
      3. ${isNSFW ? `CHẾ ĐỘ NSFW ĐANG BẬT (${nsfwIntensity}). Cho phép nội dung người lớn, mô tả chi tiết cơ thể và hành động. QUAN TRỌNG: TUYỆT ĐỐI KHÔNG để nhân vật chính xuất tinh/lên đỉnh (climax) trừ khi người chơi có yêu cầu hoặc hành động rõ ràng cho phép điều đó.` : 'Nội dung an toàn, không NSFW.'}
      4. ${pronounRules || ''}
      5. ${autoCodexEnabled ? 'AUTO-CODEX: BẮT BUỘC trích xuất thông tin NPC (Nhân vật), Địa danh, Thế lực mới xuất hiện (hoặc có cập nhật quan trọng) vào mảng "newRegistry". Với NPC, bắt buộc dùng type="NPC".' : ''}
      6. Cập nhật chỉ số nhân vật (Stats) chính xác sau mỗi lượt.
      7. [QUAN TRỌNG] Quản lý Thời Gian (currentTime):
         - BẮT BUỘC dùng định dạng: "Thứ [X], Ngày [DD]/[MM]/[YYYY], [HH]:[MM]" (Ví dụ: Thứ Hai, Ngày 01/01/2024, 08:00).
         - Tự động tính toán thời gian trôi qua dựa trên hành động (Ngủ, đi đường, tu luyện...).
      
      Output JSON strictly following the schema.
      `;
  }

  async summarizeStory(currentSummary: string, recentTurns: Turn[]): Promise<string> {
      const text = recentTurns.map(t => `${t.role}: ${t.role === 'user' ? t.userPrompt : t.narrative}`).join("\n");
      const prompt = `Tóm tắt ngắn gọn diễn biến mới nhất của câu chuyện dựa trên nội dung sau, nối tiếp với tóm tắt cũ:\nCũ: ${currentSummary}\nMới:\n${text}`;
      
      try {
          const res = await this.ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents: [{ role: 'user', parts: [{ text: prompt }] }]
          });
          return res.text || currentSummary;
      } catch {
          return currentSummary;
      }
  }

  async generateWorldAssist(genre: GameGenre, prompt: string, heroInfo: any): Promise<WorldSettings> {
      const p = `Hỗ trợ viết setting cho game ${genre}. Yêu cầu: ${prompt}. Trả về JSON với các trường: worldContext, plotDirection, majorFactions, keyNpcs. Tất cả giá trị phải là STRING (Mô tả chi tiết, gạch đầu dòng). KHÔNG sử dụng mảng/object lồng nhau.`;
      
      const schema = {
        type: Type.OBJECT,
        properties: {
            worldContext: { type: Type.STRING },
            plotDirection: { type: Type.STRING },
            majorFactions: { type: Type.STRING },
            keyNpcs: { type: Type.STRING }
        },
        required: ["worldContext", "plotDirection", "majorFactions", "keyNpcs"]
      };

      try {
          const res = await this.ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents: [{ role: 'user', parts: [{ text: p }] }],
              config: { 
                  responseMimeType: 'application/json',
                  responseSchema: schema
              }
          });
          return JSON.parse(res.text || "{}");
      } catch (e) {
          console.error(e);
          throw e;
      }
  }
  
  async generateWorldFromTitle(title: string, genre: string, heroInfo: any): Promise<WorldSettings> {
       const p = `Dựa trên tác phẩm/ý tưởng "${title}" (Thể loại ${genre}), hãy xây dựng thế giới game. Trả về JSON: worldContext, plotDirection, majorFactions, keyNpcs, openingStory. Tất cả giá trị phải là STRING (Mô tả chi tiết, gạch đầu dòng). KHÔNG sử dụng mảng/object lồng nhau.`;
       
       const schema = {
        type: Type.OBJECT,
        properties: {
            worldContext: { type: Type.STRING },
            plotDirection: { type: Type.STRING },
            majorFactions: { type: Type.STRING },
            keyNpcs: { type: Type.STRING },
            openingStory: { type: Type.STRING }
        },
        required: ["worldContext", "plotDirection", "majorFactions", "keyNpcs", "openingStory"]
      };

       try {
          const res = await this.ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents: [{ role: 'user', parts: [{ text: p }] }],
              config: { 
                  responseMimeType: 'application/json',
                  responseSchema: schema
              }
          });
          return JSON.parse(res.text || "{}");
      } catch (e) {
          console.error(e);
          throw e;
      }
  }

  async generateSingleWorldField(genre: GameGenre, fieldLabel: string, context: string, heroInfo: any): Promise<string> {
       const p = `Viết nội dung cho trường "${fieldLabel}" của game ${genre}. Context hiện tại: ${context}. Chỉ trả về nội dung text, không JSON.`;
       try {
          const res = await this.ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents: [{ role: 'user', parts: [{ text: p }] }]
          });
          return res.text || "";
      } catch (e) {
          return "";
      }
  }
}

export const geminiService = new GeminiService();