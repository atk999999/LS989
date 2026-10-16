import { GameGenre, CharacterTraits, WorldSettings, RegistryEntry } from '../types';
import { FusionResult } from '../DHJ-main/src/components/PokemonCard';

export interface TransmigrationPreview {
  fusion: FusionResult;
  targetGenre: GameGenre;
  convertedRealm: string;
  personality: string;
  spiritualRoot: string;
  talents: string[];
  equipment: string[];
  openingStory: string;
}

/**
 * Normalizes rank for cross-system scaling
 */
export const getRankTierKey = (rank: string): 'CHAOS' | 'ORIGIN' | 'ZENO' | 'GRAND_PRIEST' | 'ANGEL' | 'GOD_OF_DESTRUCTION' | 'ULTRA_INSTINCT' | 'SUPER_SAIYAN' | 'MORTAL' => {
  const r = (rank || '').toUpperCase().trim();
  if (r.includes('HỖN ĐỘN') || r.includes('CHAOS')) return 'CHAOS';
  if (r.includes('KHỞI NGUYÊN') || r.includes('ORIGIN')) return 'ORIGIN';
  if (r.includes('ZENO')) return 'ZENO';
  if (r.includes('ĐẠI THIÊN SỨ') || r.includes('GRAND MINISTER') || r.includes('GRAND PRIEST') || r.includes('DAISHINKAN')) return 'GRAND_PRIEST';
  if (r.includes('THIÊN SỨ') || r.includes('ANGEL') || r === 'SS' || r === 'SSS') return 'ANGEL';
  if (r.includes('HỦY DIỆT') || r.includes('DESTRUCTION') || r === 'S') return 'GOD_OF_DESTRUCTION';
  if (r.includes('VÔ CỰC') || r.includes('INSTINCT') || r === 'UR' || r === 'LR' || r === 'ZEN' || r.includes('BẢN NGÃ')) return 'ULTRA_INSTINCT';
  if (r.includes('SIÊU SAIYAN') || r.includes('SAIYAN') || r === 'SSR' || r === 'SR') return 'SUPER_SAIYAN';
  return 'MORTAL';
};

/**
 * Converts DHJ fusion rank and level to the target roleplaying genre realm
 */
export const convertFusionToRealm = (rank: string, level: number = 1, genre: GameGenre): string => {
  const tier = getRankTierKey(rank);

  switch (genre) {
    case GameGenre.CULTIVATION: // Tu Tiên
      switch (tier) {
        case 'CHAOS':
          return `Đại Đạo Hỗn Độn Chi Chủ (Cực Hạn Thần Cấp ⭐ x${level || 1})`;
        case 'ORIGIN':
          return `Hư Vô Khởi Nguyên Thần (Đạo Tổ Cảnh)`;
        case 'ZENO':
          return `Thiên Đạo Chấp Pháp / Đại La Kim Tiên Cực Hạn`;
        case 'GRAND_PRIEST':
          return `Hỗn Nguyên Đại La Chuẩn Thánh Đỉnh Phong`;
        case 'ANGEL':
          return `Tiên Đế Viên Mãn / Bán Bộ Chuẩn Thánh`;
        case 'GOD_OF_DESTRUCTION':
          return `Kim Tiên / Độ Kiếp Kỳ Đỉnh Phong (Nắm Giữ Diệt Thế Quy Tắc)`;
        case 'ULTRA_INSTINCT':
          return `Hợp Thể Kỳ / Đại Thừa Kỳ (Thần Thức Vô Niệm)`;
        case 'SUPER_SAIYAN':
          return `Nguyên Anh Kỳ / Hóa Thần Kỳ (Chiến Khí Ngút Trời)`;
        case 'MORTAL':
        default:
          return `Trúc Cơ Kỳ / Kim Đan Sơ Kỳ (Chân Khí Sung Mãn)`;
      }

    case GameGenre.FANTASY: // Huyền Huyễn
      switch (tier) {
        case 'CHAOS':
          return `Sáng Thế Thần Vương / Chúa Tể Đa Chiều (Cấp ⭐ x${level || 1})`;
        case 'ORIGIN':
          return `Thượng Cổ Thần Minh / Thái Sơ Thánh Tôn`;
        case 'ZENO':
          return `Vị Diện Tối Cao Chấp Pháp Giả`;
        case 'GRAND_PRIEST':
          return `Chủ Thần Đỉnh Cấp (Thần Khí Bất Diệt)`;
        case 'ANGEL':
          return `Thần Vị Tối Thượng / Cấm Thuật Pháp Thần`;
        case 'GOD_OF_DESTRUCTION':
          return `Bán Thần / Hắc Ám Tận Thế Ma Thần`;
        case 'ULTRA_INSTINCT':
          return `Đấu Thánh Viên Mãn / Thánh Ma Đạo Sư`;
        case 'SUPER_SAIYAN':
          return `Đấu Tông / Đấu Tôn (Huyết Mạch Cuồng Nộ)`;
        case 'MORTAL':
        default:
          return `Đại Đấu Sư / Đại Pháp Sư Sơ Giai`;
      }

    case GameGenre.POST_APOCALYPTIC: // Mạt Thế
      switch (tier) {
        case 'CHAOS':
          return `Ý Chí Tinh Cầu Tối Cao (Siêu Dị Năng Cấp ⭐ x${level || 1})`;
        case 'ORIGIN':
          return `Thực Thể Sáng Tạo Đa Chiều / Chúa Tể Tận Thế`;
        case 'ZENO':
          return `Kẻ Hủy Diệt Hành Tinh Cấp EX`;
        case 'GRAND_PRIEST':
          return `Chiến Thần Tận Thế Cấp 15 (Bất Tử Chân Thân)`;
        case 'ANGEL':
          return `Vương Giả Tận Thế Cấp 12 (Thao Túng Không Gian)`;
        case 'GOD_OF_DESTRUCTION':
          return `Bán Thần Hắc Ám Cấp 10 (Ăn Mòn Tuyệt Đối)`;
        case 'ULTRA_INSTINCT':
          return `Siêu Dị Năng Giả Cấp 9 (Phản Xạ Vô Điều Kiện)`;
        case 'SUPER_SAIYAN':
          return `Cường Giả Dị Năng Cấp 7-8 (Hỏa/Lôi Chiến Thể)`;
        case 'MORTAL':
        default:
          return `Dị Năng Giả Cấp 3-4 (Thể Chất Biến Dị)`;
      }

    case GameGenre.SCIFI: // Khoa Huyễn
      switch (tier) {
        case 'CHAOS':
          return `Thực Thể Chiều Không Gian Thứ 11 (Cấp Siêu Văn Minh ⭐ x${level || 1})`;
        case 'ORIGIN':
          return `Thao Túng Quy Tắc Vũ Trụ (Văn Minh Cấp V)`;
        case 'ZENO':
          return `Vũ Khí Xóa Bỏ Dòng Thời Gian`;
        case 'GRAND_PRIEST':
          return `Siêu Máy Tính Lượng Tử Sinh Học Cấp Thần`;
        case 'ANGEL':
          return `Cơ Thể Hạt Ánh Sáng / Vô Cực Năng Lượng`;
        case 'GOD_OF_DESTRUCTION':
          return `Vũ Khí Hủy Diệt Tinh Cầu Cấp IV`;
        case 'ULTRA_INSTINCT':
          return `Siêu Chiến Binh Đột Biến Gen Đa Chiều SSS`;
        case 'SUPER_SAIYAN':
          return `Cơ Giáp Tinh Tế Cấp Siêu Quang Tốc`;
        case 'MORTAL':
        default:
          return `Chiến Binh Sinh Hóa Cải Tạo Cấp B`;
      }

    case GameGenre.ANIME_CROSSOVER: // Anime Đồng Nhân
    case GameGenre.ALL_ANIME: // Tổng Mạn
      switch (tier) {
        case 'CHAOS':
          return `Đấng Sáng Tạo Đa Vũ Trụ (Tier 1-A Outerverse ⭐ x${level || 1})`;
        case 'ORIGIN':
          return `Thần Linh Vượt Ngoài Quy Tắc Thực Tại`;
        case 'ZENO':
          return `Quyền Năng Xóa Sổ Đa Vũ Trụ (Absolute Erasure)`;
        case 'GRAND_PRIEST':
          return `Đại Thiên Sứ / Đỉnh Phong Của Mọi Võ Thuật`;
        case 'ANGEL':
          return `Thiên Sứ Bản Năng Vô Cực Hoàn Mỹ`;
        case 'GOD_OF_DESTRUCTION':
          return `Thần Hủy Diệt Hakai / Cường Giả Cấp Đa Thiên Hà`;
        case 'ULTRA_INSTINCT':
          return `Cực Hạn Bản Năng Vô Cực (Tự Động Phản Xạ)`;
        case 'SUPER_SAIYAN':
          return `Siêu Saiyan Thần / Siêu Saiyan 4`;
        case 'MORTAL':
        default:
          return `Chiến Binh Tinh Anh Vũ Trụ (Super Elite)`;
      }

    case GameGenre.HORROR: // Linh Dị
      switch (tier) {
        case 'CHAOS':
        case 'ORIGIN':
        case 'ZENO':
          return `Cổ Thần Nguyên Sơ / Ác Mộng Vĩnh Cửu Vũ Trụ`;
        case 'GRAND_PRIEST':
        case 'ANGEL':
          return `Thần Quan Trấn Tà Vô Thượng / Kim Thân Thần Thánh`;
        case 'GOD_OF_DESTRUCTION':
          return `Diệt Thế Minh Vương / Thao Túng U Minh`;
        case 'ULTRA_INSTINCT':
          return `Thiên Sư Bất Hoặc / Đạo Nhãn Thông Thần`;
        case 'SUPER_SAIYAN':
          return `Chiến Thể Trảm Ma / Thuần Dương Chân Khí`;
        case 'MORTAL':
        default:
          return `Pháp Sư Tinh Anh / Khí Huyết Cương Liệt`;
      }

    case GameGenre.REAL_LIFE: // Đời Thực / Showbiz
    case GameGenre.SLICE_OF_LIFE: // Đời Thường
    case GameGenre.DETECTIVE: // Trinh Thám
    case GameGenre.HISTORICAL: // Cổ Trang
    default:
      switch (tier) {
        case 'CHAOS':
        case 'ORIGIN':
        case 'ZENO':
          return `Chân Thần Giáng Thế / Thao Túng Vận Mệnh Nhân Gian`;
        case 'GRAND_PRIEST':
        case 'ANGEL':
          return `Vô Địch Thần Thoại / Tông Sư Xuất Trần`;
        case 'GOD_OF_DESTRUCTION':
          return `Chiến Thần Đô Thị / Sát Thần Hạ Phàm`;
        case 'ULTRA_INSTINCT':
          return `Đại Tông Sư Võ Thuật / Thần Nhãn Giác Quan`;
        case 'SUPER_SAIYAN':
          return `Thiên Tài Võ Đạo Vô Song / Thể Chất Siêu Phàm`;
        case 'MORTAL':
        default:
          return `Cao Thủ Đỉnh Cấp / Chiến Binh Thượng Thừa`;
      }
  }
};

/**
 * Extracts and synthesizes unique talents from base characters, items, and DNA
 */
export const extractTalentsFromFusion = (fusion: FusionResult): string[] => {
  const talents: string[] = [];
  const name = fusion.name.toLowerCase();
  const desc = (fusion.description || '').toLowerCase();
  const logic = (fusion.fusion_logic || '').toLowerCase();
  const rank = (fusion.rank || '').toLowerCase();

  // Check Rank/Tier features
  if (rank.includes('hỗn độn') || rank.includes('chaos')) {
    talents.push("⭐ Hỗn Độn Thần Thể (Miễn nhiễm mọi quy luật không-thời gian, sáng tạo và hủy diệt vạn vật)");
  }
  if (rank.includes('zeno') || rank.includes('khởi nguyên')) {
    talents.push("🌌 Quyền Năng Xóa Bổ Tuyệt Đối (Ý nghĩ có thể làm biến mất thực tại)");
  }
  if (rank.includes('thiên sứ') || rank.includes('angel')) {
    talents.push("🕊️ Bản Năng Vô Cực Hoàn Mỹ (Cơ thể tự động phòng thủ và phản công ở tốc độ ánh sáng)");
  }
  if (rank.includes('hủy diệt') || rank.includes('destruction') || desc.includes('hakai')) {
    talents.push("🟣 Năng Lượng Hakai (Khí hủy diệt phân rã linh hồn và vật chất)");
  }

  // Check DNA races
  if (fusion.dna_components && fusion.dna_components.length > 0) {
    fusion.dna_components.forEach(c => {
      const race = c.race.toLowerCase();
      if (race.includes('saiyan')) {
        talents.push(`🔥 Huyết Mạch Saiyan (${c.percentage}%: Càng chiến đấu càng mạnh, cận kề cái chết sẽ đột phá cảnh giới)`);
      } else if (race.includes('thiên sứ') || race.includes('angel')) {
        talents.push(`✨ Thần Khí Thiên Sứ (${c.percentage}%: Năng lượng vô tận, tĩnh lặng tuyệt đối)`);
      } else if (race.includes('mabu')) {
        talents.push(`🧬 Tái Tạo Bất Tử Mabu (${c.percentage}%: Hồi sinh cơ thể dù chỉ còn một tế bào)`);
      } else if (race.includes('namek')) {
        talents.push(`🌿 Tinh Hoa Namek (${c.percentage}%: Tự lành vết thương, ma thuật trị liệu)`);
      } else if (race.includes('frost') || race.includes('frieza')) {
        talents.push(`❄️ Sinh Mệnh Băng Giá Vĩnh Cửu (${c.percentage}%: Sống sót trong chân không vũ trụ)`);
      } else if (race.includes('kaioshin')) {
        talents.push(`🔮 Pháp Lực Thần Thánh (${c.percentage}%: Dịch chuyển tức thời, sáng tạo vật phẩm)`);
      }
    });
  }

  // Check special equipment or items in base characters
  if (fusion.baseCharacters && fusion.baseCharacters.length > 0) {
    fusion.baseCharacters.forEach(bc => {
      const bn = bc.name.toLowerCase();
      if (bn.includes('sharingan') || bn.includes('rinnegan')) {
        talents.push("👁️ Luân Hồi Nhãn / Sharingan (Ảo thuật tối thượng, nhìn thấu điểm yếu của đối thủ)");
      }
      if (bn.includes('pin infinity')) {
        talents.push("🔋 Pin Infinity (Nguồn thần lực dồi dào bất tận, không bao giờ cạn kiệt)");
      }
      if (bn.includes('thập vĩ') || bn.includes('chakra')) {
        talents.push("🌀 Năng Lượng Vĩ Thú (Khí hải bao la vô tận, Cầu Đạo Ngọc bao quanh)");
      }
      if (bn.includes('găng tay vô cực')) {
        talents.push("💎 Quyền Năng Vô Cực (Thao túng Thời Gian, Không Gian và Thực Tại)");
      }
      if (bn.includes('saitama')) {
        talents.push("👊 Phá Vỡ Giới Hạn (Cú đấm nghiêm túc có thể đánh nát thiên thạch và tinh cầu)");
      }
      if (bn.includes('zombie')) {
        talents.push("🧟 Thể Chất Bất Tử Cuồng Loạn (Không biết đau đớn, miễn nhiễm độc tố và khống chế)");
      }
    });
  }

  // Default fallback if too few talents
  if (talents.length === 0) {
    talents.push("⚡ Bản Năng Chiến Đấu Tột Cùng (Kinh nghiệm thực chiến từ hàng ngàn trận chiến vũ trụ)");
    talents.push("💥 Khí Hải Đại Phá Hoại (Có thể bắn ra các luồng sóng năng lượng hủy thiên diệt địa)");
  }

  return Array.from(new Set(talents)).slice(0, 5);
};

/**
 * Generates an evocative personality prompt preserving the fusion's demeanor
 */
export const generateFusionPersonality = (fusion: FusionResult): string => {
  let base = "";
  if (fusion.quote) {
    base += `Khẩu khí cửa miệng: "${fusion.quote}". `;
  }

  const names = fusion.baseCharacters?.map(c => c.name).join(", ") || "";
  base += `Bản ngã được đúc kết từ tinh hoa của: ${names || fusion.name}. `;
  
  const rank = (fusion.rank || '').toUpperCase();
  if (rank.includes('HỖN ĐỘN') || rank.includes('CHAOS') || rank.includes('ZENO') || rank.includes('ORIGIN')) {
    base += "Khí chất tối cao chí thượng, xem vạn vật như hư vô, điềm tĩnh nhưng khi ra tay thì quyết đoán tuyệt đối.";
  } else if (rank.includes('HỦY DIỆT')) {
    base += "Phong thái lạnh lùng, uy nghiêm của bậc chúa tể hủy diệt, không khoan nhượng với kẻ ngạo mạn.";
  } else if (rank.includes('THIÊN SỨ')) {
    base += "Ung dung, thanh tao, luôn giữ nụ cười bí ẩn và phong thái của bậc hiền triết vũ trụ.";
  } else {
    base += "Mang dòng máu hiếu chiến cuồng nhiệt, tôn trọng kẻ mạnh, không bao giờ lùi bước trước nghịch cảnh.";
  }

  return base;
};

/**
 * Builds opening story for the character transmigrating into the roleplaying universe
 */
export const generateTransmigrationOpeningStory = (
  fusion: FusionResult,
  targetGenre: GameGenre,
  realm: string,
  role: 'MC' | 'COMPANION' | 'BOSS'
): string => {
  const charName = fusion.name;
  const quote = fusion.quote ? `"${fusion.quote}"` : '';

  if (role === 'MC') {
    return `[DỊ TƯỢNG GIÁNG LÂM]: Giữa hư không của thế giới ${targetGenre}, một vết nứt thời không màu tím bạc bỗng nhiên xé toạc bầu trời. Từ trong luồng bão tố năng lượng khổng lồ, ${charName} - thực thể siêu việt mang thần lực vũ trụ Dragon Ball chính thức giáng lâm! Khí tức bàng bạc thuộc cảnh giới [${realm}] tỏa ra khiến nhật nguyệt thất sắc. ${quote ? `Thanh âm vang vọng: ${quote}. ` : ''}Ký ức về các trận chiến đỉnh cao vẫn còn nguyên vẹn, và một hành trình chinh phục đỉnh cao mới tại thế giới này chính thức bắt đầu!`;
  } else if (role === 'COMPANION') {
    return `[HỘ ĐẠO GIẢ XUẤT HIỆN]: Một luồng ánh sáng thần bí rủ xuống che chở người chơi. Thực thể huyền thoại ${charName} mang cảnh giới [${realm}] xé rách vị diện bước ra, thề ước trở thành người bảo hộ và đồng đội sinh tử kề vai sát cánh!`;
  } else {
    return `[THẦN BÍ CƯỜNG GIẢ ẨN THẾ]: Nghe đồn tại khu vực cấm địa bí ẩn của thế giới này, vừa có một vị tuyệt thế tồn tại mang tên ${charName} với tu vi [${realm}] xé rách vách ngăn không gian hàng lâm. Kẻ này tính cách cổ quái, hành tung bất định và sở hữu những bí pháp chưa từng thấy trong lịch sử!`;
  }
};
