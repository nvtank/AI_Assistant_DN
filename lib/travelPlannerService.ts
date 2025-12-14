import { 
  TravelPlanRequest, 
  TravelPlan, 
  DayPlan, 
  Activity, 
  WeatherForecast,
  ActivitySchedule,
  MealPlan
} from './types';
import danangPlacesData from './danang-places-data.json';
import { addMinutes, subtractMinutes, calculateDistance, calculateTravelTime, calculateGrabCost } from './travelPlanHelpers';
import { TIME_SLOT_MAP, ZONE_CENTERS, ZONE_NAMES, CATEGORY_EMOJIS, PREFERENCE_KEYWORDS, AVOIDANCE_KEYWORDS } from './travelPlanConstants';

export class TravelPlannerService {
  private geminiApiKey: string;
  private placesApiKey: string;
  private weatherApiKey: string;

  constructor() {
    this.geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
    this.placesApiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!;
    this.weatherApiKey = process.env.OPENWEATHER_API_KEY!;
  }

  /**
   * Lấy dự báo thời tiết cho Đà Nẵng
   */
  async getWeatherForecast(startDate: string, endDate: string): Promise<WeatherForecast[]> {
    try {
      const DA_NANG_LAT = 16.0544;
      const DA_NANG_LNG = 108.2022;

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?` +
        `lat=${DA_NANG_LAT}&lon=${DA_NANG_LNG}&` +
        `appid=${this.weatherApiKey}&units=metric&lang=vi`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      return this.parseWeatherData(data, startDate, endDate);
    } catch (error) {
      console.error('Weather forecast error:', error);
      return this.getMockWeatherData(startDate, endDate);
    }
  }

  /**
   * Parse weather data từ OpenWeather API
   */
  private parseWeatherData(data: any, startDate: string, endDate: string): WeatherForecast[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const forecasts: WeatherForecast[] = [];

    // Group forecast by date
    const dailyForecasts = new Map<string, any[]>();

    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!dailyForecasts.has(dateStr)) {
        dailyForecasts.set(dateStr, []);
      }
      dailyForecasts.get(dateStr)!.push(item);
    });

    // Create forecast for each day
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayData = dailyForecasts.get(dateStr) || [];

      if (dayData.length > 0) {
        const temps = dayData.map((d: any) => d.main.temp);
        const conditions = dayData.map((d: any) => d.weather[0].main);
        const mostCommonCondition = this.getMostCommon(conditions);

        forecasts.push({
          date: dateStr,
          temp: {
            min: Math.min(...temps),
            max: Math.max(...temps),
            morning: dayData[0]?.main.temp || temps[0],
            afternoon: dayData[Math.floor(dayData.length / 2)]?.main.temp || temps[0],
            evening: dayData[dayData.length - 1]?.main.temp || temps[0],
          },
          condition: mostCommonCondition,
          description: dayData[0]?.weather[0].description || '',
          humidity: dayData[0]?.main.humidity || 0,
          windSpeed: dayData[0]?.wind.speed || 0,
          rainfall: dayData.reduce((sum: number, d: any) => sum + (d.rain?.['3h'] || 0), 0),
          icon: dayData[0]?.weather[0].icon,
          recommendation: this.getWeatherRecommendation(mostCommonCondition, temps[0]),
        });
      }
    }

    return forecasts;
  }

  /**
   * Mock weather data khi API fail
   */
  private getMockWeatherData(startDate: string, endDate: string): WeatherForecast[] {
    const forecasts: WeatherForecast[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      forecasts.push({
        date: d.toISOString().split('T')[0],
        temp: {
          min: 22,
          max: 30,
          morning: 24,
          afternoon: 29,
          evening: 26,
        },
        condition: 'Clear',
        description: 'Clear sky',
        humidity: 70,
        windSpeed: 3.5,
        recommendation: 'Good weather for traveling',
      });
    }

    return forecasts;
  }

  /**
   * Tìm các địa điểm du lịch ở Đà Nẵng
   */
  async searchAttractions(category: string, limit: number = 20): Promise<Activity[]> {
    try {
      const DA_NANG_CENTER = { lat: 16.0544, lng: 108.2022 };
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${DA_NANG_CENTER.lat},${DA_NANG_CENTER.lng}&` +
        `radius=20000&type=${category}&key=${this.placesApiKey}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch places');
      }

      const data = await response.json();
      const activities = this.parseActivities(data.results, category);
      
      return activities.slice(0, limit);
    } catch (error) {
      console.error('Search attractions error:', error);
      return this.getMockAttractions(category, limit);
    }
  }

  /**
   * Parse activities từ Google Places
   */
  private parseActivities(results: any[], category: string): Activity[] {
    return results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      type: this.mapCategoryToType(category),
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        address: place.vicinity || '',
        placeId: place.place_id,
      },
      description: place.types?.join(', ') || '',
      estimatedCost: this.estimateCost(category, place.price_level),
      rating: place.rating,
      photos: place.photos?.map((p: any) => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photo_reference}&key=${this.placesApiKey}`
      ),
      openingHours: place.opening_hours?.weekday_text,
      category,
    }));
  }

  /**
   * Generate complete travel plan with Gemini AI
   */
  async generateTravelPlan(request: TravelPlanRequest, userId: string): Promise<TravelPlan> {
    try {
      // 1. Lấy thời tiết
      console.log('📅 Fetching weather forecast...');
      const weather = await this.getWeatherForecast(request.startDate, request.endDate);

      // 2. Lấy các địa điểm phù hợp
      console.log('🗺️ Searching for attractions...');
      const attractions = await this.getAllRecommendedPlaces(request);

      // 3. Try AI generation first
      try {
        console.log('🤖 Generating plan with AI...');
        const prompt = this.buildGeminiPrompt(request, weather, attractions);
        const aiResponse = await this.callGeminiAPI(prompt);

        // If AI returned null (quota exceeded), use fallback
        if (!aiResponse) {
          console.warn('⚠️ AI generation unavailable, using fallback plan');
          return this.createFallbackPlan(request, weather, userId);
        }

        // 5. Parse response và tạo travel plan
        console.log('✅ Parsing AI response...');
        const plan = await this.parseTravelPlan(aiResponse, request, weather, userId);
        return plan;
        
      } catch (aiError: any) {
        // If AI fails, fall back to basic plan
        console.warn('⚠️ AI generation failed, using fallback plan:', aiError.message);
        return this.createFallbackPlan(request, weather, userId);
      }

    } catch (error) {
      console.error('Generate travel plan error:', error);
      throw error;
    }
  }

  /**
   * Get all places matching the request
   */
  private async getAllRecommendedPlaces(request: TravelPlanRequest): Promise<Activity[]> {
    const categories = this.determineCategories(request);
    const allPlaces: Activity[] = [];

    for (const category of categories) {
      const places = await this.searchAttractions(category, 10);
      allPlaces.push(...places);
    }

    // Thêm các địa điểm nổi tiếng của Đà Nẵng
    allPlaces.push(...this.getFamousDaNangPlaces());

    return allPlaces;
  }

  /**
   * Các địa điểm nổi tiếng Đà Nẵng (từ database)
   */
  private getFamousDaNangPlaces(): Activity[] {
    const places: Activity[] = [];
    
    // Get all categories from the new structure
    const categories = [
      'entertainment', 'beauty_health', 'nature_beaches', 'nightlife', 
      'cafes_checkin', 'spiritual_cultural', 'landmarks_bridges', 
      'street_food_hidden_gems', 'shopping_markets', 'cafes_chill', 
      'nature_camping', 'homestay_budget', 'theme_parks_resorts', 
      'hoi_an_ancient_town', 'cinematic_checkin_spots'
    ];
    
    // Convert all places from JSON to Activity format
    categories.forEach((category) => {
      const categoryPlaces = (danangPlacesData as any)[category];
      if (categoryPlaces && Array.isArray(categoryPlaces)) {
        categoryPlaces.forEach((place: any) => {
          places.push({
            id: place.id,
            name: place.name,
            type: place.type || category,
            location: place.location,
            description: place.description,
            estimatedCost: place.estimatedCost || 0,
            rating: place.rating,
            category: place.category || category,
            tips: place.tips,
            openingHours: place.openingHours,
            duration: place.experience_duration || place.duration || 60,
            bestTime: place.bestTime,
            suitable: place.suitable || [],
            phone: place.phone || '',
            website: place.website || '',
            articleLink: place.articleLink || '',
            'tik-tok': place['tik-tok'] || '',
            'social-link': place['social-link'] || '',
            googleMapsLink: place.location ? `https://www.google.com/maps?q=${place.location.lat},${place.location.lng}` : ''
          });
        });
      }
    });

    return places;
  }

  /**
   * Format detailed place information for Gemini prompt
   */
  private formatDetailedPlacesInfo(): string {
    let info = '';
    
    const categories = [
      'entertainment', 'beauty_health', 'nature_beaches', 'nightlife', 
      'cafes_checkin', 'spiritual_cultural', 'landmarks_bridges', 
      'street_food_hidden_gems', 'shopping_markets', 'cafes_chill', 
      'nature_camping', 'homestay_budget', 'theme_parks_resorts', 
      'hoi_an_ancient_town', 'cinematic_checkin_spots'
    ];

    categories.forEach((category) => {
      const categoryPlaces = (danangPlacesData as any)[category];
      if (categoryPlaces && Array.isArray(categoryPlaces) && categoryPlaces.length > 0) {
        const emoji = CATEGORY_EMOJIS[category] || '📍';
        const categoryName = category.replace(/_/g, ' ').toUpperCase();
        info += `${emoji} **${categoryName}:**\n\n`;
        
        categoryPlaces.forEach((place: any, index: number) => {
          info += `${index + 1}. **${place.name}** (ID: ${place.id})\n`;
          info += `   - Type: ${place.category || place.type}\n`;
          info += `   - Address: ${place.location.address}\n`;
          info += `   - Coordinates: ${place.location.lat}, ${place.location.lng}\n`;
          info += `   - Description: ${place.description}\n`;
          info += `   - Cost: ${place.estimatedCost.toLocaleString()} VND/person\n`;
          
          if (place.experience_duration) {
            info += `   - Thời gian tham quan: ${place.experience_duration} phút\n`;
          }
          
          info += `   - Giờ mở cửa: ${place.openingHours || '24/24'}\n`;
          
          if (place.phone) {
            info += `   - Điện thoại: ${place.phone}\n`;
          }
          
          if (place.website) {
            info += `   - Website/Fanpage: ${place.website}\n`;
          }
          
          if (place.articleLink) {
            info += `   - Bài viết: ${place.articleLink}\n`;
          }
          
          if (place.cuisine) {
            info += `   - Ẩm thực: ${place.cuisine}\n`;
          }
          
          if (place.dishes && place.dishes.length > 0) {
            info += `   - Món nổi bật: ${place.dishes.join(', ')}\n`;
          }
          
          if (place.priceRange) {
            info += `   - Khoảng giá: ${place.priceRange}\n`;
          }
          
          if (place.amenities && place.amenities.length > 0) {
            info += `   - Tiện nghi: ${place.amenities.join(', ')}\n`;
          }
          
          if (place.suitable && place.suitable.length > 0) {
            info += `   - Phù hợp: ${place.suitable.join(', ')}\n`;
          }
          
          if (place.rating) {
            info += `   - Rating: ${place.rating}/5.0\n`;
          }
          
          if (place.tips && place.tips.length > 0) {
            info += `   - Tips: ${place.tips.join('; ')}\n`;
          }
          
          if (place.reviews && place.reviews.length > 0) {
            info += `   - Reviews: ${place.reviews.map((r: any) => `"${r.comment}"`).join('; ')}\n`;
          }
          
          info += '\n';
        });
        
        info += '\n';
      }
    });
    
    return info;
  }

  /**
   * Xác định categories cần tìm dựa vào request
   */
  private determineCategories(request: TravelPlanRequest): string[] {
    const categories = ['tourist_attraction', 'restaurant', 'cafe'];

    // travelStyle is now an array, check if it includes specific styles
    if (request.travelStyle?.includes('adventure')) {
      categories.push('park', 'amusement_park');
    }

    if (request.travelStyle?.includes('relaxation')) {
      categories.push('spa', 'beach');
    }

    if (request.travelStyle?.includes('food')) {
      categories.push('bakery', 'food');
    }

    if (request.travelStyle?.includes('cultural')) {
      categories.push('museum', 'art_gallery', 'church');
    }

    if (request.travelStyle?.includes('nature')) {
      categories.push('park', 'beach', 'natural_feature');
    }

    if (request.travelStyle?.includes('nightlife')) {
      categories.push('night_club', 'bar');
    }

    if (request.travelStyle?.includes('shopping')) {
      categories.push('shopping_mall', 'store');
    }

    return categories;
  }

  /**
   * Extract keywords từ conversation và notes
   */
  private extractKeywords(request: TravelPlanRequest): {
    wakeUpTime: string;
    sleepTime: string;
    restTime: string;
    preferences: string[];
    avoidances: string[];
    budgetLevel: 'budget' | 'mid-range' | 'luxury';
    groupType: 'family' | 'couple' | 'friends' | 'solo' | 'business';
  } {
    const userNotes = (request as any).notes || {};
    const allNotes = Object.values(userNotes).filter(n => n).join('. ').toLowerCase();
    const specialRequirements = (request.specialRequirements || '').toLowerCase();
    const combinedText = [allNotes, specialRequirements].filter(n => n).join('. ');

    // Extract wake up time
    let wakeUpTime = '08:00'; // Default
    if (combinedText.includes('dậy sớm') || combinedText.includes('early') || combinedText.includes('bình minh')) {
      wakeUpTime = '06:00';
    } else if (combinedText.includes('ngủ nướng') || combinedText.includes('late') || combinedText.includes('muộn')) {
      wakeUpTime = '09:00';
    }

    // Extract sleep time
    let sleepTime = '23:00'; // Default
    if (combinedText.includes('ngủ sớm') || combinedText.includes('early sleep') || combinedText.includes('về sớm')) {
      sleepTime = '22:00';
    } else if (combinedText.includes('thức khuya') || combinedText.includes('late night') || combinedText.includes('nightlife')) {
      sleepTime = '00:00';
    }

    // Extract rest time
    let restTime = '13:00-14:00'; // Default
    if (combinedText.includes('nghỉ trưa') || combinedText.includes('siesta')) {
      restTime = '12:00-14:00';
    } else if (combinedText.includes('không nghỉ') || combinedText.includes('no rest')) {
      restTime = 'none';
    }

    // Extract preferences
    const preferences: string[] = [];
    for (const [key, keywords] of Object.entries(PREFERENCE_KEYWORDS)) {
      if (keywords.some(kw => combinedText.includes(kw))) {
        preferences.push(key);
      }
    }

    // Extract avoidances
    const avoidances: string[] = [];
    for (const [key, keywords] of Object.entries(AVOIDANCE_KEYWORDS)) {
      if (keywords.some(kw => combinedText.includes(kw))) {
        avoidances.push(key);
      }
    }

    // Determine budget level
    const totalPeople = request.numberOfPeople.adults + request.numberOfPeople.children;
    const dailyBudget = request.budget.max / Math.ceil(
      (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1
    );
    const budgetPerPerson = dailyBudget / totalPeople;
    let budgetLevel: 'budget' | 'mid-range' | 'luxury' = 'mid-range';
    if (budgetPerPerson < 500000) {
      budgetLevel = 'budget';
    } else if (budgetPerPerson > 2000000) {
      budgetLevel = 'luxury';
    }

    // Determine group type
    let groupType: 'family' | 'couple' | 'friends' | 'solo' | 'business' = 'friends';
    if (request.numberOfPeople.children > 0) {
      groupType = 'family';
    } else if (request.numberOfPeople.adults === 2) {
      groupType = 'couple';
    } else if (request.numberOfPeople.adults === 1) {
      groupType = 'solo';
    }
    if (combinedText.includes('công tác') || combinedText.includes('business')) {
      groupType = 'business';
    }

    return {
      wakeUpTime,
      sleepTime,
      restTime,
      preferences,
      avoidances,
      budgetLevel,
      groupType,
    };
  }

  /**
   * Phân vùng địa lý - nhóm các địa điểm gần nhau
   */
  private clusterPlacesByZone(places: Activity[]): Map<string, Activity[]> {
    const zones = new Map<string, Activity[]>();

    places.forEach(place => {
      let minDistance = Infinity;
      let closestZone = 'center';

      for (const [zoneKey, center] of Object.entries(ZONE_CENTERS)) {
        const distance = calculateDistance(
          place.location.lat,
          place.location.lng,
          center.lat,
          center.lng
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestZone = zoneKey;
        }
      }

      if (minDistance <= 15) {
        if (!zones.has(closestZone)) {
          zones.set(closestZone, []);
        }
        zones.get(closestZone)!.push(place);
      }
    });

    return zones;
  }

  /**
   * Build prompt cho Gemini AI
   */
  private buildGeminiPrompt(
    request: TravelPlanRequest,
    weather: WeatherForecast[],
    attractions: Activity[]
  ): string {
    const days = Math.ceil(
      (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Extract keywords từ conversation và notes
    const keywords = this.extractKeywords(request);

    // Get detailed place information from database
    const detailedPlaces = this.formatDetailedPlacesInfo();

    const timePrefsText = (request as any).timePreferences 
      ? (request as any).timePreferences.map((slot: string) => TIME_SLOT_MAP[slot] || slot).join('\n  ')
      : 'No specific priority';

    // Extract user restrictions from notes
    const userNotes = (request as any).notes || {};
    const allNotes = Object.values(userNotes).filter(n => n).join('. ');
    const specialRequirements = request.specialRequirements || '';
    const combinedNotes = [allNotes, specialRequirements].filter(n => n).join('. ');

    return `Bạn là AI Travel Planner chuyên nghiệp cho Đà Nẵng với 10 năm kinh nghiệm. Bạn cần PHÂN TÍCH SÂU yêu cầu của khách hàng và tạo kế hoạch TÙY BIẾN, KHÔNG ĐƯỢC sao chép kế hoạch mẫu.

**🎯 QUY TRÌNH LÀM VIỆC CỦA BẠN (BẮT BUỘC THỰC HIỆN TỪNG BƯỚC):**

**BƯỚC 1: PHÂN TÍCH CHÂN DUNG KHÁCH HÀNG (Customer Profiling)**
Trước khi tạo kế hoạch, hãy TỰ HỎI BẢN THÂN:
- Khách hàng này là ai? (độ tuổi, nhóm đối tượng từ "suitable" trong database)
- Họ thích gì? (phân tích từ travelStyle + foodPreferences + timePreferences)
- Họ KHÔNG thích gì? (allergies + restrictions + notes)
- Họ có con nhỏ không? Có người già không? → Ảnh hưởng đến lựa chọn địa điểm
- Ngân sách của họ thuộc phân khúc nào? (budget/mid-range/luxury)

**📊 KEYWORDS ĐÃ TRÍCH XUẤT TỪ CONVERSATION:**
- Giờ thức giấc: ${keywords.wakeUpTime}
- Giờ đi ngủ: ${keywords.sleepTime}
- Thời gian nghỉ ngơi: ${keywords.restTime}
- Preferences: ${keywords.preferences.length > 0 ? keywords.preferences.join(', ') : 'No special preferences'}
- Avoidances: ${keywords.avoidances.length > 0 ? keywords.avoidances.join(', ') : 'None'}
- Phân khúc ngân sách: ${keywords.budgetLevel}
- Loại nhóm: ${keywords.groupType}

**BƯỚC 2: TÌM KIẾM THÔNG MINH (Smart Search)**
Từ DATABASE, hãy:
1. Lọc ra các địa điểm có "suitable" KHỚP với nhóm khách (family/couple/friends/youth)
2. Lọc theo ngân sách: estimatedCost × số người ≤ ngân sách hàng ngày
3. Lọc theo phong cách: 
   - "adventure" → chọn từ categories: nature_beaches, nature_camping, activities_experience
   - "foodie" → chọn từ: street_food_hidden_gems, cafes_chill
   - "cultural" → chọn từ: spiritual_cultural, hoi_an_ancient_town
   - "relax" → chọn từ: theme_parks_resorts, beauty_health, homestay_budget
4. ĐỐI CHIẾU với khung giờ ưa thích:
   - Nếu chọn "early_morning" → tìm địa điểm có openingHours bắt đầu từ 5-6h (bãi biển, chợ sáng)
   - Nếu chọn "night" → PHẢI có hoạt động từ nightlife/nightlife_bars_clubs

**BƯỚC 3: GOM CỤM ĐỊA LÝ THÔNG MINH**
- Dùng location.lat và location.lng để tính khoảng cách
- Nhóm các địa điểm gần nhau (≤5km) vào cùng 1 ngày
- MỖI NGÀY = 1 KHU VỰC DUY NHẤT

**NHIỆM VỤ:** Tạo kế hoạch du lịch ${days} ngày chi tiết từ SÁNG SỚM đến KHUYA (5:00 - 23:00), hợp lý, tối ưu chi phí và thời gian.

**📋 THÔNG TIN CHUYẾN ĐI:**
- Thời gian: ${request.startDate} đến ${request.endDate} (${days} ngày)
- Số người: ${request.numberOfPeople.adults} người lớn, ${request.numberOfPeople.children} trẻ em
- Ngân sách: ${request.budget.min.toLocaleString()} - ${request.budget.max.toLocaleString()} VNĐ
- Phong cách: **${request.travelStyle}** → Hãy PHÂN TÍCH xem phong cách này cần loại địa điểm nào từ database
- Phương tiện di chuyển: ${request.transportation}
- Loại chỗ ở: ${request.accommodation}
- Khung giờ ưa thích:
  ${timePrefsText}
  **→ HÃY ĐỐI CHIẾU với openingHours trong database để chọn địa điểm phù hợp**
- Food preferences: ${request.foodPreferences.join(', ') || 'None'} 
  **→ Search database for dishes with matching cuisine/dishes**
- Allergies/Restrictions: ${[...request.allergies, ...request.restrictions].join(', ') || 'None'}
  **→ REMOVE places that are not suitable**

**⚠️ SPECIAL NOTES FROM USER:**
${combinedNotes || 'No special notes'}

**DỰ BÁO THỜI TIẾT:**
${weather.map(w => `- ${w.date}: ${w.condition} ${w.description}, ${w.temp.min}°C - ${w.temp.max}°C, ${w.recommendation}`).join('\n')}

**🗺️ QUY TẮC GOM CỤM ĐỊA LÝ (CRITICAL):**
Đà Nẵng chia làm 4 KHU VỰC chính:
1. **KHU BÃI BIỂN** (Mỹ Khê, Non Nước, Phạm Văn Đồng): Bãi biển, resort, nhà hàng hải sản
2. **KHU NÚI** (Bà Nà Hills, Sơn Trà): Núi, đỉnh cao, chùa Linh Ứng
3. **KHU TRUNG TÂM** (Cầu Rồng, Chợ Hàn, Phố cổ, Hàn Market): Cầu, shopping, street food
4. **HỘI AN** (Phố cổ Hội An, Cù Lao Chàm): 30km về phía Nam

**⚠️ NGUYÊN TẮC BẮT BUỘC:**
- MỖI NGÀY = 1 KHU VỰC duy nhất
- TẤT CẢ hoạt động trong ngày (ăn sáng, tham quan, ăn trưa, cafe, ăn tối) phải ở CÙNG KHU VỰC
- KHÔNG được nhảy giữa các khu vực trong 1 ngày
- Example: If choosing "Beach Area" → all points in the day must be near My Khe Beach
- Khoảng cách giữa các điểm trong ngày: ≤ 5km

**📍 DAY ALLOCATION (example: 3 days 2 nights):**
- Day 1: Beach Area (check-in resort, beach, seafood, cafe with beach view)
- Day 2: Mountain Area (Bà Nà Hills full day OR Son Tra + Linh Ung Pagoda)
- Day 3: City Center (Dragon Bridge, Han Market, breakfast bun cha ca, shopping) → checkout

**DATABASE ĐỊA ĐIỂM ĐÀ NẴNG (Sử dụng ưu tiên các địa điểm này):**

${detailedPlaces}

**YÊU CẦU TẠO KẾ HOẠCH (CRITICAL - ĐỌC KỸ):**

1. **CẤU TRÚC MỘT NGÀY HOÀN CHỈNH** (theo triết lý "Golden Skeleton" với giờ giấc cá nhân hóa):
   
   **NGÀY 1 (Nhẹ nhàng & Làm quen):**
   - **${keywords.wakeUpTime}**: Thức giấc, vệ sinh cá nhân
   - **${addMinutes(keywords.wakeUpTime, 30)}-${addMinutes(keywords.wakeUpTime, 90)}**: Ăn sáng món đặc sản gần nơi ở
   - **${addMinutes(keywords.wakeUpTime, 90)}-12:00**: Tham quan nhẹ nhàng (landmarks, check-in)
   - **12:00-14:00**: Ăn trưa + ${keywords.restTime === 'none' ? 'nghỉ ngơi ngắn' : 'nghỉ ngơi ' + keywords.restTime}
   - **15:00-17:30**: Tham quan điểm phụ/cafe view đẹp
   - **18:00-20:00**: Ăn tối món đặc sản
   - **20:00-${subtractMinutes(keywords.sleepTime, 60)}**: Hoạt động ban đêm (phố đi bộ, chợ đêm, bar nhẹ nhàng)
   - **${subtractMinutes(keywords.sleepTime, 30)}-${keywords.sleepTime}**: Về nghỉ ngơi, chuẩn bị đi ngủ
   - **${keywords.sleepTime}+**: Đi ngủ
   
   **NGÀY 2 (Trọng tâm & Khám phá - NGÀY QUAN TRỌNG NHẤT):**
   - **${keywords.wakeUpTime === '06:00' ? '06:00-07:00' : keywords.wakeUpTime + '-07:00'}**: ${keywords.wakeUpTime === '06:00' ? 'Đón bình minh' : 'Thức giấc sớm'}
   - **08:00-09:00**: Ăn sáng thịnh soạn
   - **09:00-12:00**: Điểm tham quan XA NHẤT hoặc TỐN SỨC NHẤT (Bà Nà Hills, Sơn Trà)
   - **12:00-14:00**: Ăn trưa + ${keywords.restTime === 'none' ? 'nghỉ ngơi ngắn' : 'ngủ trưa ' + keywords.restTime} (QUAN TRỌNG)
   - **15:00-17:30**: Các điểm phụ, ngắm hoàng hôn
   - **18:00-20:00**: Bữa ăn tối THỊNH SOẠN NHẤT chuyến đi
   - **20:00-${subtractMinutes(keywords.sleepTime, 30)}**: Hoạt động ban đêm (bar, nightclub, sky bar, show diễn)
   - **${subtractMinutes(keywords.sleepTime, 30)}-${keywords.sleepTime}**: Về nghỉ ngơi
   - **${keywords.sleepTime}+**: Đi ngủ
   
   **NGÀY 3 (Thư thả & Mua sắm):**
   - **${keywords.wakeUpTime === '09:00' ? '09:00' : addMinutes(keywords.wakeUpTime, 60)}-${addMinutes(keywords.wakeUpTime, 120)}**: Ngủ nướng + ăn sáng thong thả
   - **10:00-12:00**: Mua quà lưu niệm, đặc sản
   - **12:00-14:00**: Ăn trưa + check-out
   - **14:00-18:00**: Di chuyển về nhà

2. **⚠️ BẮT BUỘC CÓ HOẠT ĐỘNG BAN ĐÊM (20:00-23:00)**
   - Nếu khách chọn "night" trong timePreferences → PHẢI có ít nhất 2 hoạt động nightlife
   - Nếu KHÔNG chọn "night" → Vẫn phải có ít nhất 1 hoạt động tối nhẹ nhàng (phố đi bộ, chợ đêm)
   - Các lựa chọn từ database:
     * nightlife categories: sky36, on-the-radio, te-bar
     * Chợ đêm: helio-center, son-tra-night-market
     * Show diễn: ky-uc-hoi-an (20:00)
     * Phố đi bộ: Cầu Rồng (xem phun lửa 21:00)

3. Mỗi ngày bao gồm:
   - **Timeline từ 06:00/08:00 → 22:00/23:00** (đủ 15-17 tiếng hoạt động)
   - Chọn 5-7 điểm đến từ database phù hợp với: phong cách du lịch, thời tiết, openingHours, timePreferences
   - **3 bữa ăn chính + 1-2 bữa phụ** (cafe, ăn vặt, ăn khuya)
   - Thời gian nghỉ ngơi: 1-2 tiếng sau bữa trưa
   - **CHI PHÍ: Lấy estimatedCost từ database × SỐ NGƯỜI (${request.numberOfPeople.adults} người lớn + ${request.numberOfPeople.children} trẻ em)**
   
3. Lưu ý:
   - **CALCULATE COST ACCURATELY:**
     * Cost per activity = estimatedCost × total number of people (adults + children)
     * Example: Che 30k/person × 2 people = 60k
     * Example: Admission ticket 100k/person × 4 people = 400k
     * Children may get 50% discount depending on the place
   - **ƯU TIÊN GỢI Ý CÁC ĐỊA ĐIỂM PHÙ HỢP VỚI KHUNG GIỜ ƯA THÍCH:**
     * Nếu người dùng chọn "Sáng sớm" (5:00-7:00): Gợi ý Đèo Hải Vân (đón bình minh), chợ Hàn, bãi biển sớm
     * Nếu chọn "Buổi sáng" (8:00-11:00): Bảo tàng, đền chùa, tour tham quan
     * Nếu chọn "Buổi chiều" (15:00-17:00): Bãi biển, công viên, cafe view đẹp
     * Nếu chọn "Buổi tối" (18:00-21:00): Phố đi bộ, nhà hàng, chợ đêm
     * Nếu chọn "Ban đêm" (22:00+): Quán bar, nightclub, sky bar
   - Ưu tiên các địa điểm gần nhau (dùng location coordinates)
   - Kiểm tra openingHours trước khi xếp lịch - **ĐỪNG XẾP LỊCH NGOÀI GIỜ MỞ CỬA**
   - Kiểm tra bestTime (morning/afternoon/evening) để xếp giờ phù hợp
   - Tránh hoạt động ngoài trời khi weather không phù hợp
   - Sử dụng tips từ database cho mỗi địa điểm
   - Đảm bảo suitable (phù hợp với nhóm: family/couple/friends)
   - Tổng chi phí không vượt budget
   
4. Cho mỗi activity, PHẢI bao gồm:
   - name: Lấy chính xác từ database
   - location: Copy y chang từ database (lat, lng, address)
   - **estimatedCost: Lấy từ database × SỐ NGƯỜI (${request.numberOfPeople.adults + request.numberOfPeople.children} người)**
   - **googleMapsLink: Tạo link Google Maps từ coordinates: "https://www.google.com/maps?q={lat},{lng}"**
   - **phone: Số điện thoại (nếu có trong database)**
   - **website: Link website hoặc fanpage Facebook nếu có**
   - **articleLink: Link bài báo giới thiệu về địa điểm (nếu có)**
   - **tik-tok: Link TikTok video review (nếu có trong database)**
   - **social-link: Link website chính thức hoặc social media (nếu có trong database)**
   - duration: Lấy từ database hoặc tính theo bestTime
   - tips: Copy tips từ database
   - openingHours: Copy từ database

5. **TÍNH THỜI GIAN DI CHUYỂN THỰC TẾ:**
   - Dùng công thức Haversine để tính khoảng cách giữa 2 tọa độ
   - Thời gian di chuyển = khoảng cách (km) / vận tốc trung bình
     * Xe máy trong thành phố: ~25 km/h → 10km = 24 phút
     * Ô tô trong thành phố: ~30 km/h → 10km = 20 phút
     * Đi xa (đèo, núi): ~40 km/h → 30km = 45 phút
   - **Lưu ý tắc đường giờ cao điểm (7-9h sáng, 5-7h chiều): Thêm 30-50% thời gian**
   - **Example: From My Khe to Ba Na Hills (30km) = 45 minutes by car**

6. **🚖 CALCULATE GRAB COST:**
   - **GrabBike**: 10,000 - 13,000 VND/km (average: 11,500 VND/km)
     * Example: 5km = 57,500 VND
     * Example: 15km = 172,500 VND
   - **GrabCar 4-seater**: 22,000 VND (first 2km) + 12,000 VND/km (from 3rd km)
     * Example: 5km = 22,000 + (3 × 12,000) = 58,000 VND
     * Example: 15km = 22,000 + (13 × 12,000) = 178,000 VND
   - **Phương tiện di chuyển người dùng chọn: ${request.transportation}**
   - PHẢI thêm "transportCost" vào mỗi schedule item

7. **⚠️ XỬ LÝ GHI CHÚ ĐẶC BIỆT:**
   - Nếu ghi chú có "không ăn cay" / "no spicy" → TRÁNH món cay, gợi ý món nhẹ
   - Nếu có "sợ độ cao" / "fear of heights" → KHÔNG chọn Bà Nà Hills, cáp treo, view cao
   - Nếu có "ăn chay" / "vegetarian" → CHỈ chọn quán có món chay
   - Nếu có "đi với trẻ nhỏ" → Chọn địa điểm suitable: family-friendly
   - Nếu có "honeymoon" / "tuần trăng mật" → Ưu tiên địa điểm lãng mạn (beach, sunset, rooftop bar)
   - **BẮT BUỘC: Tạo phần EXPLANATION ở đầu kế hoạch giải thích cách xử lý ghi chú**

8. **📝 PHẦN GIẢI THÍCH (EXPLANATION) - BẮT BUỘC:**
   PHẢI thêm vào đầu response JSON một field "explanation" với format:
   "explanation": "Dựa vào thông tin bạn cung cấp, tôi đã tạo kế hoạch này với những lý do cụ thể:
   
   **VỀ GIỜ GIẤC:**
   - Giờ thức giấc: ${keywords.wakeUpTime} - ${keywords.wakeUpTime === '06:00' ? 'Bạn thích dậy sớm để đón bình minh' : keywords.wakeUpTime === '09:00' ? 'Bạn thích ngủ nướng và bắt đầu ngày muộn hơn' : 'Giờ thức giấc tiêu chuẩn'}
   - Giờ đi ngủ: ${keywords.sleepTime} - ${keywords.sleepTime === '22:00' ? 'Bạn thích nghỉ ngơi sớm' : keywords.sleepTime === '00:00' ? 'Bạn thích thức khuya và tận hưởng nightlife' : 'Giờ ngủ tiêu chuẩn'}
   - Thời gian nghỉ: ${keywords.restTime === 'none' ? 'Bạn không cần nghỉ trưa, nên tôi sắp xếp hoạt động liên tục' : 'Bạn cần nghỉ trưa ' + keywords.restTime + ', nên tôi đã dành thời gian này để nghỉ ngơi'}
   
   **VỀ LỰA CHỌN ĐỊA ĐIỂM:**
   ${keywords.preferences.map(p => `- Bạn thích ${p}, nên tôi đã chọn các địa điểm liên quan đến ${p} từ database`).join('\n   ')}
   ${keywords.avoidances.map(a => `- Bạn tránh ${a}, nên tôi đã LOẠI BỎ tất cả địa điểm có ${a} khỏi kế hoạch`).join('\n   ')}
   
   **VỀ PHÂN VÙNG ĐỊA LÝ:**
   - Ngày 1: Tôi chọn khu vực [TÊN KHU] vì [LÝ DO] - tất cả địa điểm trong ngày cách nhau ≤5km
   - Ngày 2: Tôi chọn khu vực [TÊN KHU] vì [LÝ DO] - tất cả địa điểm trong ngày cách nhau ≤5km
   - Ngày 3: Tôi chọn khu vực [TÊN KHU] vì [LÝ DO] - tất cả địa điểm trong ngày cách nhau ≤5km
   
   **VỀ NGÂN SÁCH:**
   - Phân khúc: ${keywords.budgetLevel} (${request.budget.min.toLocaleString()} - ${request.budget.max.toLocaleString()} VNĐ)
   - Tôi đã chọn các địa điểm có estimatedCost phù hợp với ngân sách ${keywords.budgetLevel} của bạn
   - Tổng chi phí mỗi ngày được tính: estimatedCost × ${request.numberOfPeople.adults + request.numberOfPeople.children} người
   
   **VỀ NHÓM KHÁCH:**
   - Loại nhóm: ${keywords.groupType}
   - Tôi đã chọn các địa điểm có "suitable" phù hợp với ${keywords.groupType} từ database
   
   Kế hoạch đảm bảo tất cả hoạt động trong cùng ngày ở gần nhau (≤5km) để tối ưu thời gian di chuyển và chi phí Grab."
   
9. For each schedule item, MUST include:
   - **travelTime**: Travel time from previous location (minutes) - CALCULATE ACCURATELY
   - **travelDistance**: Actual distance (km)
   - **transportCost**: Grab cost (VND) - CALCULATE BY VEHICLE TYPE AND DISTANCE
   - **previousLocation**: Coordinates of previous location for reference

**FORMAT TRẢ VỀ (JSON):**
Return EXACTLY in the following JSON format, do not add any other text:

{
  "explanation": "[PHẦN GIẢI THÍCH NHƯ ĐÃ HƯỚNG DẪN Ở TRÊN]",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "schedule": [
        {
          "time": "08:00",
          "duration": 120,
          "activity": {
            "id": "bana-hills",
            "name": "Bà Nà Hills",
            "type": "attraction",
            "location": {
              "lat": 15.9969,
              "lng": 107.9971,
              "address": "Hòa Ninh, Hòa Vang, Đà Nẵng"
            },
            "description": "Khu du lịch nghỉ dưỡng cao cấp trên núi",
            "estimatedCost": 3000000,
            "googleMapsLink": "https://www.google.com/maps?q=15.9969,107.9971",
            "phone": "+84 236 3791 999",
            "website": "https://www.facebook.com/BanahillsDanangVietnam",
            "articleLink": "https://banahills.sunworld.vn/tin-tuc/",
            "tik-tok": "https://www.tiktok.com/@example/video/123",
            "social-link": "https://banahills.sunworld.vn/",
            "openingHours": "07:00-22:00",
            "tips": ["Đi sớm để tránh đông", "Mang áo ấm"]
          },
          "notes": "I chose this place because [EXPLANATION BASED ON KEYWORDS]: ${keywords.preferences.includes('mountain') ? 'You like mountains' : ''} ${keywords.budgetLevel === 'luxury' ? 'Suitable for luxury budget' : ''}. Cost calculated for ${request.numberOfPeople.adults + request.numberOfPeople.children} people.",
          "travelTime": 45,
          "travelDistance": 30.5,
          "previousLocation": { "lat": 16.0544, "lng": 108.2022 }
        }
      ],
      "mealPlan": {
        "breakfast": { 
          "id": "mi-quang-ba-mua",
          "name": "Mì Quảng Bà Mua", 
          "location": { "lat": 16.0697, "lng": 108.2239, "address": "..." },
          "googleMapsLink": "https://www.google.com/maps?q=16.0697,108.2239",
          "phone": "+84 905 123 456",
          "estimatedCost": 35000,
          "dishes": ["Mì Quảng gà"]
        },
        "lunch": { "name": "Tên quán từ database", "estimatedCost": 100000 },
        "dinner": { "name": "Tên quán từ database", "estimatedCost": 150000 }
      },
      "estimatedCost": 500000,
      "notes": ["Note 1", "Note 2"]
    }
  ],
  "totalEstimatedCost": {
    "accommodation": 1000000,
    "food": 1500000,
    "transportation": 500000,
    "activities": 2000000,
    "total": 5000000
  }
}

Please create the most detailed and realistic plan!`;
  }

  /**
   * Gọi Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<any> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API error:', errorData);
        
        // Check if quota exceeded
        if (errorData.error?.code === 429) {
          console.warn('⚠️ Gemini API quota exceeded. Using fallback plan generator.');
          return null; // Signal to use fallback
        }
        
        throw new Error(`Gemini API failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Gemini API call error:', error);
      
      // If network error or quota, return null to trigger fallback
      if (error.message?.includes('quota') || error.message?.includes('429')) {
        console.warn('⚠️ Using fallback plan generator due to API limits.');
        return null;
      }
      
      throw new Error(`Gemini API failed: ${error.message}`);
    }
  }

  /**
   * Parse response từ Gemini và tạo TravelPlan
   */
  private async parseTravelPlan(
    aiResponse: any,
    request: TravelPlanRequest,
    weather: WeatherForecast[],
    userId: string
  ): Promise<TravelPlan> {
    try {
      const text = aiResponse.candidates[0].content.parts[0].text;
      
      // Extract JSON from response (might have markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Create fallback weather if data is unavailable
      const fallbackWeather: WeatherForecast = {
        date: new Date().toISOString().split('T')[0],
        temp: { min: 22, max: 30, morning: 24, afternoon: 29, evening: 26 },
        condition: 'Not Available',
        description: 'Weather forecast unavailable',
        humidity: 70,
        windSpeed: 3.5,
        recommendation: 'Weather forecast is not available for this date. The date may be too far in the future.',
      };

      // Map weather to each day and add explanation to notes if available
      const days: DayPlan[] = parsed.days.map((day: any, index: number) => {
        const dayPlan: DayPlan = {
          ...day,
          weather: weather[index] || weather[0] || fallbackWeather,
        };

        // Add explanation to day notes if available
        if (parsed.explanation && dayPlan.notes) {
          dayPlan.notes = [
            parsed.explanation,
            ...(Array.isArray(dayPlan.notes) ? dayPlan.notes : [dayPlan.notes])
          ];
        } else if (parsed.explanation) {
          dayPlan.notes = [parsed.explanation];
        }

        return dayPlan;
      });

      // Create plan with explanation
      const plan: TravelPlan = {
        userId,
        request,
        days,
        totalEstimatedCost: parsed.totalEstimatedCost,
        weatherForecast: weather,
        status: 'draft',
        shared: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store explanation in a custom field if needed (for display purposes)
      if (parsed.explanation) {
        (plan as any).explanation = parsed.explanation;
      }

      return plan;
    } catch (error) {
      console.error('Parse error:', error);
      // Return a basic plan if parsing fails
      return this.createFallbackPlan(request, weather, userId);
    }
  }

  /**
   * Tạo plan cơ bản khi AI fail
   */
  private createFallbackPlan(
    request: TravelPlanRequest,
    weather: WeatherForecast[],
    userId: string
  ): TravelPlan {
    console.log('🔄 Creating fallback plan with database locations...');
    const days: DayPlan[] = [];
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    let dayCount = 1;

    // Extract keywords
    const keywords = this.extractKeywords(request);

    // Calculate total number of people
    const totalPeople = request.numberOfPeople.adults + request.numberOfPeople.children;

    // Get all places from database
    const allPlaces = this.getFamousDaNangPlaces();
    
    // Filter places based on budget (consider total people)
    const maxDailyCost = request.budget.max / ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1);
    const affordablePlaces = allPlaces.filter(p => {
      const totalCost = (p.estimatedCost || 0) * totalPeople;
      return totalCost < maxDailyCost * 0.4;
    });

    // Cluster places by geographic zones
    const zones = this.clusterPlacesByZone(affordablePlaces);
    const zoneKeys = Array.from(zones.keys());
    
    // Separate by type within each zone
    const attractionsByZone = new Map<string, Activity[]>();
    const restaurantsByZone = new Map<string, Activity[]>();
    const cafesByZone = new Map<string, Activity[]>();
    
    zoneKeys.forEach(zoneKey => {
      const zonePlaces = zones.get(zoneKey) || [];
      attractionsByZone.set(zoneKey, zonePlaces.filter(p => 
        p.type === 'attraction' || 
        p.type === 'activity' ||
        (p.category && (p.category.includes('entertainment') || p.category.includes('nature') || p.category.includes('landmark')))
      ));
      restaurantsByZone.set(zoneKey, zonePlaces.filter(p => 
        p.type === 'restaurant' ||
        (p.category && (p.category.includes('food') || p.category.includes('restaurant') || p.category.includes('street_food')))
      ));
      cafesByZone.set(zoneKey, zonePlaces.filter(p => 
        p.type === 'cafe' ||
        (p.category && p.category.includes('cafe'))
      ));
    });

    // Shuffle arrays to create random plans each time
    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Assign zones to days (round-robin)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const currentDate = d.toISOString().split('T')[0];
      
      // Create fallback weather if data is unavailable
      const fallbackWeather: WeatherForecast = {
        date: currentDate,
        temp: { min: 22, max: 30, morning: 24, afternoon: 29, evening: 26 },
        condition: 'Not Available',
        description: 'Weather forecast unavailable',
        humidity: 70,
        windSpeed: 3.5,
        recommendation: 'Weather forecast is not available for this date. The date may be too far in the future or weather data could not be retrieved at this time.',
      };
      
      const dayWeather = weather[dayCount - 1] || weather[0] || fallbackWeather;
      
      // Select zone for this day (round-robin)
      const zoneIndex = (dayCount - 1) % zoneKeys.length;
      const selectedZone = zoneKeys[zoneIndex];
      const zoneName = ZONE_NAMES[selectedZone] || selectedZone;
      
      // Get places from selected zone
      const zoneAttractions = shuffleArray(attractionsByZone.get(selectedZone) || []);
      const zoneRestaurants = shuffleArray(restaurantsByZone.get(selectedZone) || []);
      const zoneCafes = shuffleArray(cafesByZone.get(selectedZone) || []);
      
      // Select 2-3 attractions, 3 restaurants, 1-2 cafes from the same zone
      const dayAttractions = zoneAttractions.slice(0, 3);
      const dayRestaurants = zoneRestaurants.slice(0, 3);
      const dayCafes = zoneCafes.slice(0, 2);
      
      const schedule: ActivitySchedule[] = [];
      // Use personalized wake-up time
      let currentTime = keywords.wakeUpTime;
      let dayCost = 0;
      
      // Use first attraction or restaurant location as starting point
      const startLocation = dayAttractions[0]?.location || 
                           dayRestaurants[0]?.location || 
                           { lat: 16.0544, lng: 108.2022 };
      let previousLocation = startLocation;
      
      // Add wake-up activity
      schedule.push({
        time: currentTime,
        duration: 30,
        activity: {
          id: 'wake-up',
          name: 'Thức giấc',
          type: 'rest',
          location: startLocation,
          description: 'Thức giấc và chuẩn bị cho ngày mới',
          estimatedCost: 0,
          googleMapsLink: `https://www.google.com/maps?q=${startLocation.lat},${startLocation.lng}`,
        },
        notes: `Thức giấc lúc ${currentTime} - ${keywords.wakeUpTime === '06:00' ? 'Dậy sớm để tận hưởng ngày dài' : keywords.wakeUpTime === '09:00' ? 'Ngủ nướng và bắt đầu ngày thong thả' : 'Bắt đầu ngày mới'}`,
        travelTime: 0,
        travelDistance: 0,
        transportCost: 0,
      });
      currentTime = addMinutes(currentTime, 30);
      
      // Breakfast
      if (dayRestaurants[0]) {
        const costPerPerson = dayRestaurants[0].estimatedCost || 0;
        const totalCost = costPerPerson * totalPeople;
        
        // Calculate travel time from previous location
        const distance = calculateDistance(
          previousLocation.lat,
          previousLocation.lng,
          dayRestaurants[0].location.lat,
          dayRestaurants[0].location.lng
        );
        const travelTime = calculateTravelTime(distance, request.transportation, currentTime);
        
        // Add Google Maps link
        const activity = {
          ...dayRestaurants[0],
          estimatedCost: totalCost,
          googleMapsLink: `https://www.google.com/maps?q=${dayRestaurants[0].location.lat},${dayRestaurants[0].location.lng}`
        };
        
        schedule.push({
          time: currentTime,
          duration: 60,
          activity: activity,
          notes: `Ăn sáng - Chi phí cho ${totalPeople} người (${costPerPerson.toLocaleString()}đ/người)`,
          travelTime: travelTime,
          travelDistance: distance,
          transportCost: calculateGrabCost(distance, request.transportation)
        });
        dayCost += totalCost;
        previousLocation = dayRestaurants[0].location;
        currentTime = addMinutes(currentTime, 60 + travelTime);
      }
      
      // Morning activity
      if (dayAttractions[0]) {
        const costPerPerson = dayAttractions[0].estimatedCost || 0;
        const totalCost = costPerPerson * totalPeople;
        
        const distance = calculateDistance(
          previousLocation.lat,
          previousLocation.lng,
          dayAttractions[0].location.lat,
          dayAttractions[0].location.lng
        );
        const travelTime = calculateTravelTime(distance, request.transportation, currentTime);
        
        const activity = {
          ...dayAttractions[0],
          estimatedCost: totalCost,
          googleMapsLink: `https://www.google.com/maps?q=${dayAttractions[0].location.lat},${dayAttractions[0].location.lng}`
        };
        
        schedule.push({
          time: currentTime,
          duration: dayAttractions[0].duration || 120,
          activity: activity,
          notes: `Điểm tham quan buổi sáng - ${totalPeople} người (${costPerPerson.toLocaleString()}đ/người)`,
          travelTime: travelTime,
          travelDistance: distance,
          transportCost: calculateGrabCost(distance, request.transportation)
        });
        dayCost += totalCost;
        previousLocation = dayAttractions[0].location;
        currentTime = addMinutes(currentTime, (dayAttractions[0].duration || 120) + travelTime);
      }
      
      // Lunch
      if (dayRestaurants[1]) {
        const costPerPerson = dayRestaurants[1].estimatedCost || 0;
        const totalCost = costPerPerson * totalPeople;
        
        const distance = calculateDistance(
          previousLocation.lat,
          previousLocation.lng,
          dayRestaurants[1].location.lat,
          dayRestaurants[1].location.lng
        );
        const travelTime = calculateTravelTime(distance, request.transportation, currentTime);
        
        const activity = {
          ...dayRestaurants[1],
          estimatedCost: totalCost,
          googleMapsLink: `https://www.google.com/maps?q=${dayRestaurants[1].location.lat},${dayRestaurants[1].location.lng}`
        };
        
        schedule.push({
          time: currentTime,
          duration: 90,
          activity: activity,
          notes: `Ăn trưa - ${totalPeople} người (${costPerPerson.toLocaleString()}đ/người)`,
          travelTime: travelTime,
          travelDistance: distance,
          transportCost: calculateGrabCost(distance, request.transportation)
        });
        dayCost += totalCost;
        previousLocation = dayRestaurants[1].location;
        currentTime = addMinutes(currentTime, 90 + travelTime);
        
        // Add rest time if needed
        if (keywords.restTime !== 'none') {
          const [restStart, restEnd] = keywords.restTime.split('-');
          schedule.push({
            time: restStart || '13:00',
            duration: restEnd ? 
              (parseInt(restEnd.split(':')[0]) * 60 + parseInt(restEnd.split(':')[1])) - 
              (parseInt(restStart.split(':')[0]) * 60 + parseInt(restStart.split(':')[1])) : 
              120,
            activity: {
              id: 'rest-time',
              name: 'Nghỉ ngơi',
              type: 'rest',
              location: previousLocation,
              description: 'Thời gian nghỉ ngơi sau bữa trưa',
              estimatedCost: 0,
              googleMapsLink: `https://www.google.com/maps?q=${previousLocation.lat},${previousLocation.lng}`,
            },
            notes: `Nghỉ ngơi ${keywords.restTime} - ${keywords.restTime.includes('14:00') ? 'Ngủ trưa để lấy lại năng lượng' : 'Nghỉ ngơi nhẹ nhàng'}`,
            travelTime: 0,
            travelDistance: 0,
            transportCost: 0,
          });
          currentTime = restEnd || '14:00';
        }
      }
      
      // Afternoon activity
      if (dayAttractions[1]) {
        const costPerPerson = dayAttractions[1].estimatedCost || 0;
        const totalCost = costPerPerson * totalPeople;
        
        const distance = calculateDistance(
          previousLocation.lat,
          previousLocation.lng,
          dayAttractions[1].location.lat,
          dayAttractions[1].location.lng
        );
        const travelTime = calculateTravelTime(distance, request.transportation, currentTime);
        
        const activity = {
          ...dayAttractions[1],
          estimatedCost: totalCost,
          googleMapsLink: `https://www.google.com/maps?q=${dayAttractions[1].location.lat},${dayAttractions[1].location.lng}`
        };
        
        schedule.push({
          time: currentTime,
          duration: dayAttractions[1].duration || 120,
          activity: activity,
          notes: `Điểm tham quan buổi chiều - ${totalPeople} người (${costPerPerson.toLocaleString()}đ/người)`,
          travelTime: travelTime,
          travelDistance: distance,
          transportCost: calculateGrabCost(distance, request.transportation)
        });
        dayCost += totalCost;
        previousLocation = dayAttractions[1].location;
        currentTime = addMinutes(currentTime, (dayAttractions[1].duration || 120) + travelTime);
      }
      
      // Coffee break
      if (dayCafes[0]) {
        const costPerPerson = dayCafes[0].estimatedCost || 0;
        const totalCost = costPerPerson * totalPeople;
        
        const distance = calculateDistance(
          previousLocation.lat,
          previousLocation.lng,
          dayCafes[0].location.lat,
          dayCafes[0].location.lng
        );
        const travelTime = calculateTravelTime(distance, request.transportation, currentTime);
        
        const activity = {
          ...dayCafes[0],
          estimatedCost: totalCost,
          googleMapsLink: `https://www.google.com/maps?q=${dayCafes[0].location.lat},${dayCafes[0].location.lng}`
        };
        
        schedule.push({
          time: currentTime,
          duration: 60,
          activity: activity,
          notes: `Nghỉ ngơi, uống cà phê - ${totalPeople} người (${costPerPerson.toLocaleString()}đ/người)`,
          travelTime: travelTime,
          travelDistance: distance,
          transportCost: calculateGrabCost(distance, request.transportation)
        });
        dayCost += totalCost;
        previousLocation = dayCafes[0].location;
        currentTime = addMinutes(currentTime, 60 + travelTime);
      }
      
      // Dinner
      if (dayRestaurants[2]) {
        const costPerPerson = dayRestaurants[2].estimatedCost || 0;
        const totalCost = costPerPerson * totalPeople;
        
        const distance = calculateDistance(
          previousLocation.lat,
          previousLocation.lng,
          dayRestaurants[2].location.lat,
          dayRestaurants[2].location.lng
        );
        const travelTime = calculateTravelTime(distance, request.transportation, currentTime);
        
        const activity = {
          ...dayRestaurants[2],
          estimatedCost: totalCost,
          googleMapsLink: `https://www.google.com/maps?q=${dayRestaurants[2].location.lat},${dayRestaurants[2].location.lng}`
        };
        
        schedule.push({
          time: currentTime,
          duration: 90,
          activity: activity,
          notes: `Ăn tối - ${totalPeople} người (${costPerPerson.toLocaleString()}đ/người)`,
          travelTime: travelTime,
          travelDistance: distance,
          transportCost: calculateGrabCost(distance, request.transportation)
        });
        dayCost += totalCost;
        previousLocation = dayRestaurants[2].location;
        currentTime = addMinutes(currentTime, 90 + travelTime);
      }
      
      // Evening/Night activity (20:00-22:00)
      const nightActivities = affordablePlaces.filter(p => 
        (p.category && (
          p.category.includes('night') || 
          p.category.includes('bar') || 
          p.category.includes('club') ||
          p.category === 'nightclub' ||
          p.category === 'live_music'
        )) ||
        (p.name && (
          p.name.includes('Bar') || 
          p.name.includes('Chợ Đêm') ||
          p.name.includes('Night Market')
        ))
      );
      
      // Shuffle array inline
      const shuffledNightActivities = [...nightActivities];
      for (let i = shuffledNightActivities.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledNightActivities[i], shuffledNightActivities[j]] = [shuffledNightActivities[j], shuffledNightActivities[i]];
      }
      
      if (shuffledNightActivities[dayCount - 1] && currentTime < '20:00') {
        currentTime = '20:00'; // Đảm bảo hoạt động tối bắt đầu từ 8h tối
        
        const nightPlace = shuffledNightActivities[dayCount - 1];
        const costPerPerson = nightPlace.estimatedCost || 0;
        const totalCost = costPerPerson * totalPeople;
        
        const distance = calculateDistance(
          previousLocation.lat,
          previousLocation.lng,
          nightPlace.location.lat,
          nightPlace.location.lng
        );
        const travelTime = calculateTravelTime(distance, request.transportation, currentTime);
        
        const activity = {
          ...nightPlace,
          estimatedCost: totalCost,
          googleMapsLink: `https://www.google.com/maps?q=${nightPlace.location.lat},${nightPlace.location.lng}`
        };
        
        schedule.push({
          time: currentTime,
          duration: 120,
          activity: activity,
          notes: `Hoạt động ban đêm - ${totalPeople} người (${costPerPerson.toLocaleString()}đ/người)`,
          travelTime: travelTime,
          travelDistance: distance,
          transportCost: calculateGrabCost(distance, request.transportation)
        });
        dayCost += totalCost;
        previousLocation = nightPlace.location;
        currentTime = addMinutes(currentTime, 120 + travelTime);
      }

      // Add sleep time activity
      const sleepTime = keywords.sleepTime;
      schedule.push({
        time: subtractMinutes(sleepTime, 30),
        duration: 30,
        activity: {
          id: 'wind-down',
          name: 'Nghỉ ngơi, chuẩn bị đi ngủ',
          type: 'rest',
          location: previousLocation,
          description: 'Thư giãn và chuẩn bị cho giấc ngủ',
          estimatedCost: 0,
          googleMapsLink: `https://www.google.com/maps?q=${previousLocation.lat},${previousLocation.lng}`,
        },
        notes: `Nghỉ ngơi và đi ngủ lúc ${sleepTime} - ${keywords.sleepTime === '22:00' ? 'Nghỉ sớm để có ngày mai tràn đầy năng lượng' : keywords.sleepTime === '00:00' ? 'Thức khuya để tận hưởng nightlife' : 'Giờ ngủ tiêu chuẩn'}`,
        travelTime: 0,
        travelDistance: 0,
        transportCost: 0,
      });

      // Sort schedule by time
      schedule.sort((a, b) => {
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        const minutesA = timeA[0] * 60 + timeA[1];
        const minutesB = timeB[0] * 60 + timeB[1];
        return minutesA - minutesB;
      });

      // Create explanation
      const explanation = `Based on the information you provided, I have created this plan with specific reasons:

**ABOUT SCHEDULE:**
- Wake-up time: ${keywords.wakeUpTime} - ${keywords.wakeUpTime === '06:00' ? 'You like to wake up early to catch the sunrise' : keywords.wakeUpTime === '09:00' ? 'You like to sleep in and start the day later' : 'Standard wake-up time'}
- Bedtime: ${keywords.sleepTime} - ${keywords.sleepTime === '22:00' ? 'You prefer to rest early' : keywords.sleepTime === '00:00' ? 'You like to stay up late and enjoy nightlife' : 'Standard bedtime'}
- Rest time: ${keywords.restTime === 'none' ? 'You don\'t need a nap, so I arranged continuous activities' : 'You need a ' + keywords.restTime + ' nap, so I have allocated this time for rest'}

**VỀ PHÂN VÙNG ĐỊA LÝ:**
- All places in each day are selected from the same area to optimize travel time
- Distance between points in the day: ≤5km
- Budget: ${keywords.budgetLevel} (${request.budget.min.toLocaleString()} - ${request.budget.max.toLocaleString()} VND)`;

      days.push({
        day: dayCount++,
        date: currentDate,
        weather: dayWeather,
        schedule: schedule,
        mealPlan: {
          breakfast: dayRestaurants[0],
          lunch: dayRestaurants[1],
          dinner: dayRestaurants[2]
        },
        estimatedCost: dayCost,
        notes: [
          explanation,
          `📍 All places in the day are in ${zoneName} - optimized travel distance`,
          '💡 Schedule is optimized according to personal schedule and distance',
          '💰 Cost is calculated accurately: estimatedCost × number of people'
        ],
      });
    }

    const totalDays = days.length;
    const avgDailyCost = days.reduce((sum, d) => sum + d.estimatedCost, 0) / totalDays;
    const accommodationCost = request.budget.max * 0.3;
    const transportationCost = request.budget.max * 0.15;

    return {
      userId,
      request,
      days,
      totalEstimatedCost: {
        accommodation: accommodationCost,
        food: avgDailyCost * totalDays * 0.6,
        transportation: transportationCost,
        activities: avgDailyCost * totalDays * 0.4,
        total: accommodationCost + (avgDailyCost * totalDays) + transportationCost,
      },
      weatherForecast: weather,
      status: 'draft',
      shared: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Helper methods
  private getMostCommon(arr: string[]): string {
    const counts = arr.reduce((acc: any, val: string) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
  }

  private getWeatherRecommendation(condition: string, temp: number): string {
    if (condition.includes('Rain')) {
      return '🌧️ Rain expected - Bring umbrella and prioritize indoor activities';
    }
    if (temp > 35) {
      return '🌡️ Hot weather - Bring hat and sunscreen';
    }
    if (condition === 'Clear' || condition === 'Clouds') {
      return '☀️ Good weather - Ideal for outdoor activities';
    }
    return '✅ Stable weather';
  }

  private mapCategoryToType(category: string): Activity['type'] {
    if (category.includes('restaurant') || category.includes('cafe') || category.includes('food')) {
      return 'restaurant';
    }
    if (category.includes('hotel') || category.includes('lodging')) {
      return 'hotel';
    }
    return 'attraction';
  }

  private estimateCost(category: string, priceLevel?: number): number {
    const baseCosts: Record<string, number> = {
      restaurant: 100000,
      cafe: 50000,
      tourist_attraction: 50000,
      museum: 30000,
      park: 0,
      beach: 0,
    };

    const base = baseCosts[category] || 50000;
    const multiplier = priceLevel || 2;

    return base * (multiplier / 2);
  }

  private getMockAttractions(category: string, limit: number): Activity[] {
    return this.getFamousDaNangPlaces()
      .filter(p => p.category === category)
      .slice(0, limit);
  }

}

// Export singleton instance
export const travelPlannerService = new TravelPlannerService();
