/**
 * Constants for travel planner
 */

export const TIME_SLOT_MAP: { [key: string]: string } = {
  'early_morning': '🌅 Sáng sớm (5:00-7:00) - Đón bình minh, đi chợ sớm',
  'morning': '☀️ Buổi sáng (8:00-11:00) - Tham quan, bảo tàng',
  'lunch': '🍽️ Buổi trưa (12:00-14:00) - Ăn trưa, nghỉ ngơi',
  'afternoon': '🌤️ Buổi chiều (15:00-17:00) - Bãi biển, công viên',
  'evening': '🌆 Buổi tối (18:00-21:00) - Ăn tối, phố đi bộ',
  'night': '🌙 Ban đêm (22:00-24:00) - Quán bar, nightlife'
};

export const ZONE_CENTERS = {
  'beach': { lat: 16.0399, lng: 108.2474, name: 'Khu Bãi Biển (Mỹ Khê, Non Nước)' },
  'mountain': { lat: 15.9969, lng: 107.9971, name: 'Khu Núi (Bà Nà Hills, Sơn Trà)' },
  'center': { lat: 16.0683, lng: 108.2211, name: 'Khu Trung Tâm (Cầu Rồng, Chợ Hàn)' },
  'hoi_an': { lat: 15.8801, lng: 108.3380, name: 'Hội An (Phố Cổ)' },
};

export const ZONE_NAMES: { [key: string]: string } = {
  'beach': 'Khu Bãi Biển (Mỹ Khê, Non Nước)',
  'mountain': 'Khu Núi (Bà Nà Hills, Sơn Trà)',
  'center': 'Khu Trung Tâm (Cầu Rồng, Chợ Hàn)',
  'hoi_an': 'Hội An (Phố Cổ)',
};

export const CATEGORY_EMOJIS: { [key: string]: string } = {
  'entertainment': '🎭',
  'beauty_health': '💆',
  'nature_beaches': '🏖️',
  'nightlife': '🌙',
  'cafes_checkin': '📸',
  'spiritual_cultural': '🏛️',
  'landmarks_bridges': '🌉',
  'street_food_hidden_gems': '🍜',
  'shopping_markets': '🛍️',
  'cafes_chill': '☕',
  'nature_camping': '🏕️',
  'homestay_budget': '🏠',
  'theme_parks_resorts': '🎢',
  'hoi_an_ancient_town': '🏮',
  'cinematic_checkin_spots': '🎬'
};

export const PREFERENCE_KEYWORDS = {
  'beach': ['biển', 'beach', 'tắm biển', 'swimming'],
  'mountain': ['núi', 'mountain', 'bà nà', 'son tra'],
  'food': ['ăn', 'food', 'ẩm thực', 'món ngon'],
  'culture': ['văn hóa', 'culture', 'bảo tàng', 'chùa'],
  'shopping': ['mua sắm', 'shopping', 'chợ', 'market'],
  'nightlife': ['bar', 'nightlife', 'quán bar', 'club'],
  'relax': ['nghỉ dưỡng', 'relax', 'spa', 'massage'],
  'adventure': ['phiêu lưu', 'adventure', 'thể thao', 'extreme'],
};

export const AVOIDANCE_KEYWORDS = {
  'spicy': ['không cay', 'no spicy', 'không ăn cay'],
  'heights': ['sợ độ cao', 'fear of heights', 'không thích cao'],
  'crowded': ['tránh đông', 'avoid crowd', 'không thích đông'],
  'outdoor': ['không ngoài trời', 'no outdoor', 'tránh nắng'],
  'seafood': ['không hải sản', 'no seafood', 'dị ứng hải sản'],
};

