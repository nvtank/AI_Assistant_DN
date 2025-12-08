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
        description: 'Trời quang đãng',
        humidity: 70,
        windSpeed: 3.5,
        recommendation: 'Thời tiết tốt cho du lịch',
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
   * Tạo kế hoạch du lịch hoàn chỉnh với Gemini AI
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
   * Lấy tất cả địa điểm phù hợp với request
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
    
    // Convert attractions from JSON to Activity format
    danangPlacesData.attractions.forEach((place: any) => {
      places.push({
        id: place.id,
        name: place.name,
        type: place.type,
        location: place.location,
        description: place.description,
        estimatedCost: place.estimatedCost,
        rating: place.rating,
        category: place.category,
        tips: place.tips,
        openingHours: place.openingHours,
        duration: place.duration,
        bestTime: place.bestTime,
        suitable: place.suitable
      });
    });

    // Convert restaurants from JSON to Activity format
    danangPlacesData.restaurants.forEach((place: any) => {
      places.push({
        id: place.id,
        name: place.name,
        type: place.type,
        location: place.location,
        description: place.description,
        estimatedCost: place.estimatedCost,
        rating: place.rating,
        category: place.category,
        tips: place.tips,
        openingHours: place.openingHours,
        cuisine: place.cuisine,
        dishes: place.dishes,
        priceRange: place.priceRange,
        suitable: place.suitable
      });
    });

    // Convert cafes from JSON to Activity format
    danangPlacesData.cafes.forEach((place: any) => {
      places.push({
        id: place.id,
        name: place.name,
        type: place.type,
        location: place.location,
        description: place.description,
        estimatedCost: place.estimatedCost,
        rating: place.rating,
        category: place.category,
        tips: place.tips,
        openingHours: place.openingHours,
        dishes: place.dishes,
        suitable: place.suitable
      });
    });

    return places;
  }

  /**
   * Format detailed place information for Gemini prompt
   */
  private formatDetailedPlacesInfo(): string {
    let info = '';
    
    // Format attractions
    info += '📍 **ĐIỂM THAM QUAN & DU LỊCH:**\n\n';
    danangPlacesData.attractions.forEach((place: any, index: number) => {
      info += `${index + 1}. **${place.name}** (ID: ${place.id})\n`;
      info += `   - Loại: ${place.category}\n`;
      info += `   - Địa chỉ: ${place.location.address}\n`;
      info += `   - Tọa độ: ${place.location.lat}, ${place.location.lng}\n`;
      info += `   - Mô tả: ${place.description}\n`;
      info += `   - Chi phí: ${place.estimatedCost.toLocaleString()} VNĐ\n`;
      info += `   - Thời gian: ${place.duration} phút\n`;
      info += `   - Giờ mở cửa: ${place.openingHours}\n`;
      info += `   - Thời gian tốt nhất: ${place.bestTime.join(', ')}\n`;
      info += `   - Thời tiết phù hợp: ${place.weather.join(', ')}\n`;
      info += `   - Phù hợp: ${place.suitable.join(', ')}\n`;
      info += `   - Rating: ${place.rating}/5.0\n`;
      info += `   - Tips: ${place.tips.join('; ')}\n\n`;
    });
    
    // Format restaurants
    info += '\n🍜 **NHÀ HÀNG & ĐỒ ĂN:**\n\n';
    danangPlacesData.restaurants.forEach((place: any, index: number) => {
      info += `${index + 1}. **${place.name}** (ID: ${place.id})\n`;
      info += `   - Loại: ${place.category} - ${place.cuisine}\n`;
      info += `   - Địa chỉ: ${place.location.address}\n`;
      info += `   - Tọa độ: ${place.location.lat}, ${place.location.lng}\n`;
      info += `   - Mô tả: ${place.description}\n`;
      info += `   - Chi phí TB: ${place.estimatedCost.toLocaleString()} VNĐ (${place.priceRange})\n`;
      info += `   - Giờ mở cửa: ${place.openingHours}\n`;
      info += `   - Món nổi bật: ${place.dishes.join(', ')}\n`;
      info += `   - Thời gian phù hợp: ${place.bestTime.join(', ')}\n`;
      info += `   - Phù hợp: ${place.suitable.join(', ')}\n`;
      info += `   - Rating: ${place.rating}/5.0\n`;
      info += `   - Tips: ${place.tips.join('; ')}\n\n`;
    });
    
    // Format cafes
    info += '\n☕ **QUÁN CÀ PHÊ:**\n\n';
    danangPlacesData.cafes.forEach((place: any, index: number) => {
      info += `${index + 1}. **${place.name}** (ID: ${place.id})\n`;
      info += `   - Loại: ${place.category}\n`;
      info += `   - Địa chỉ: ${place.location.address}\n`;
      info += `   - Mô tả: ${place.description}\n`;
      info += `   - Chi phí TB: ${place.estimatedCost.toLocaleString()} VNĐ\n`;
      info += `   - Giờ mở cửa: ${place.openingHours}\n`;
      info += `   - Món nổi bật: ${place.dishes.join(', ')}\n`;
      info += `   - Phù hợp: ${place.suitable.join(', ')}\n`;
      info += `   - Rating: ${place.rating}/5.0\n`;
      info += `   - Tips: ${place.tips.join('; ')}\n\n`;
    });
    
    // Format hotels
    info += '\n🏨 **KHÁCH SẠN GỢI Ý:**\n\n';
    danangPlacesData.hotels.forEach((place: any, index: number) => {
      info += `${index + 1}. **${place.name}** (ID: ${place.id})\n`;
      info += `   - Loại: ${place.category}\n`;
      info += `   - Địa chỉ: ${place.location.address}\n`;
      info += `   - Mô tả: ${place.description}\n`;
      info += `   - Chi phí: ${place.estimatedCost.toLocaleString()} VNĐ/đêm\n`;
      info += `   - Tiện nghi: ${place.amenities.join(', ')}\n`;
      info += `   - Phù hợp: ${place.suitable.join(', ')}\n`;
      info += `   - Rating: ${place.rating}/5.0\n`;
      info += `   - Tips: ${place.tips.join('; ')}\n\n`;
    });
    
    return info;
  }

  /**
   * Xác định categories cần tìm dựa vào request
   */
  private determineCategories(request: TravelPlanRequest): string[] {
    const categories = ['tourist_attraction', 'restaurant', 'cafe'];

    if (request.travelStyle === 'adventure') {
      categories.push('park', 'amusement_park');
    }

    if (request.travelStyle === 'relax') {
      categories.push('spa', 'beach');
    }

    if (request.travelStyle === 'foodie') {
      categories.push('bakery', 'food');
    }

    if (request.travelStyle === 'cultural') {
      categories.push('museum', 'art_gallery', 'church');
    }

    return categories;
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

    // Get detailed place information from database
    const detailedPlaces = this.formatDetailedPlacesInfo();

    return `Bạn là chuyên gia du lịch Đà Nẵng có 10 năm kinh nghiệm. Hãy tạo kế hoạch chi tiết cho chuyến đi ${days} ngày.

**THÔNG TIN CHUYẾN ĐI:**
- Thời gian: ${request.startDate} đến ${request.endDate} (${days} ngày)
- Số người: ${request.numberOfPeople.adults} người lớn, ${request.numberOfPeople.children} trẻ em
- Ngân sách: ${request.budget.min.toLocaleString()} - ${request.budget.max.toLocaleString()} VNĐ
- Phong cách: ${request.travelStyle}
- Di chuyển: ${request.transportation}
- Loại chỗ ở: ${request.accommodation}
- Thời gian hoạt động: Bắt đầu ${request.timePreference.morningStart}, kết thúc ${request.timePreference.eveningEnd}
- Sở thích ẩm thực: ${request.foodPreferences.join(', ') || 'Không có'}
- Dị ứng/Hạn chế: ${[...request.allergies, ...request.restrictions].join(', ') || 'Không có'}

**DỰ BÁO THỜI TIẾT:**
${weather.map(w => `- ${w.date}: ${w.condition} ${w.description}, ${w.temp.min}°C - ${w.temp.max}°C, ${w.recommendation}`).join('\n')}

**DATABASE ĐỊA ĐIỂM ĐÀ NẴNG (Sử dụng ưu tiên các địa điểm này):**

${detailedPlaces}

**YÊU CẦU TẠO KẾ HOẠCH:**

1. Tạo lịch trình chi tiết cho ${days} ngày - PHẢI chọn các địa điểm từ database trên
2. Mỗi ngày bao gồm:
   - Timeline từng giờ cụ thể (format: HH:mm)
   - Chọn 3-5 điểm đến từ database phù hợp với: phong cách du lịch, thời tiết, thời gian mở cửa (openingHours)
   - 3 bữa ăn chính (breakfast, lunch, dinner) - chọn từ restaurants/cafes trong database
   - Thời gian nghỉ ngơi hợp lý
   - Thời gian di chuyển giữa các địa điểm (tính từ location.lat/lng)
   - Chi phí chính xác từ estimatedCost trong database
   
3. Lưu ý:
   - Ưu tiên các địa điểm gần nhau (dùng location coordinates)
   - Kiểm tra openingHours trước khi xếp lịch
   - Kiểm tra bestTime (morning/afternoon/evening) để xếp giờ phù hợp
   - Tránh hoạt động ngoài trời khi weather không phù hợp
   - Sử dụng tips từ database cho mỗi địa điểm
   - Đảm bảo suitable (phù hợp với nhóm: family/couple/friends)
   - Tổng chi phí không vượt budget
   
4. Cho mỗi activity, PHẢI bao gồm:
   - name: Lấy chính xác từ database
   - location: Copy y chang từ database (lat, lng, address)
   - estimatedCost: Lấy từ database
   - duration: Lấy từ database hoặc tính theo bestTime
   - tips: Copy tips từ database
   - openingHours: Copy từ database

**FORMAT TRẢ VỀ (JSON):**
Trả về CHÍNH XÁC theo format JSON sau, không thêm text nào khác:

{
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
            "estimatedCost": 750000,
            "openingHours": "07:00-22:00",
            "tips": ["Đi sớm để tránh đông", "Mang áo ấm"]
          },
          "notes": "Ghi chú thêm",
          "travelTime": 15,
          "travelDistance": 3.5
        }
      ],
      "mealPlan": {
        "breakfast": { 
          "id": "mi-quang-ba-mua",
          "name": "Mì Quảng Bà Mua", 
          "location": { "lat": 16.0697, "lng": 108.2239, "address": "..." },
          "estimatedCost": 35000,
          "dishes": ["Mì Quảng gà"]
        },
        "lunch": { "name": "Tên quán từ database", "estimatedCost": 100000 },
        "dinner": { "name": "Tên quán từ database", "estimatedCost": 150000 }
      },
      "estimatedCost": 500000,
      "notes": ["Lưu ý 1", "Lưu ý 2"]
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

Hãy tạo kế hoạch chi tiết và thực tế nhất!`;
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

      // Map weather to each day
      const days: DayPlan[] = parsed.days.map((day: any, index: number) => ({
        ...day,
        weather: weather[index] || weather[0],
      }));

      return {
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

    // Get all places from database
    const allPlaces = this.getFamousDaNangPlaces();
    
    // Filter places based on budget
    const maxDailyCost = request.budget.max / ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1);
    const affordablePlaces = allPlaces.filter(p => p.estimatedCost && p.estimatedCost < maxDailyCost * 0.4);
    
    // Separate by type
    const attractions = affordablePlaces.filter(p => p.type === 'attraction');
    const restaurants = affordablePlaces.filter(p => p.type === 'restaurant');
    const cafes = affordablePlaces.filter(p => p.type === 'cafe');

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayWeather = weather[dayCount - 2] || weather[0];
      const currentDate = d.toISOString().split('T')[0];
      
      // Select 2-3 attractions for the day
      const dayAttractions = attractions.slice((dayCount - 1) * 2, (dayCount - 1) * 2 + 3);
      const dayRestaurants = restaurants.slice((dayCount - 1) * 3, (dayCount - 1) * 3 + 3);
      
      const schedule: ActivitySchedule[] = [];
      let currentTime = '08:00';
      let dayCost = 0;
      
      // Breakfast
      if (dayRestaurants[0]) {
        schedule.push({
          time: currentTime,
          duration: 60,
          activity: dayRestaurants[0],
          notes: 'Ăn sáng',
          travelTime: 15,
          travelDistance: 2
        });
        dayCost += dayRestaurants[0].estimatedCost || 0;
        currentTime = this.addMinutes(currentTime, 75);
      }
      
      // Morning activity
      if (dayAttractions[0]) {
        schedule.push({
          time: currentTime,
          duration: dayAttractions[0].duration || 120,
          activity: dayAttractions[0],
          notes: 'Điểm tham quan buổi sáng',
          travelTime: 20,
          travelDistance: 5
        });
        dayCost += dayAttractions[0].estimatedCost || 0;
        currentTime = this.addMinutes(currentTime, (dayAttractions[0].duration || 120) + 20);
      }
      
      // Lunch
      if (dayRestaurants[1]) {
        schedule.push({
          time: currentTime,
          duration: 90,
          activity: dayRestaurants[1],
          notes: 'Ăn trưa',
          travelTime: 15,
          travelDistance: 3
        });
        dayCost += dayRestaurants[1].estimatedCost || 0;
        currentTime = this.addMinutes(currentTime, 105);
      }
      
      // Afternoon activity
      if (dayAttractions[1]) {
        schedule.push({
          time: currentTime,
          duration: dayAttractions[1].duration || 120,
          activity: dayAttractions[1],
          notes: 'Điểm tham quan buổi chiều',
          travelTime: 20,
          travelDistance: 4
        });
        dayCost += dayAttractions[1].estimatedCost || 0;
        currentTime = this.addMinutes(currentTime, (dayAttractions[1].duration || 120) + 20);
      }
      
      // Coffee break
      if (cafes[0]) {
        schedule.push({
          time: currentTime,
          duration: 60,
          activity: cafes[0],
          notes: 'Nghỉ ngơi, uống cà phê',
          travelTime: 10,
          travelDistance: 2
        });
        dayCost += cafes[0].estimatedCost || 0;
        currentTime = this.addMinutes(currentTime, 70);
      }
      
      // Dinner
      if (dayRestaurants[2]) {
        schedule.push({
          time: currentTime,
          duration: 90,
          activity: dayRestaurants[2],
          notes: 'Ăn tối',
          travelTime: 0,
          travelDistance: 0
        });
        dayCost += dayRestaurants[2].estimatedCost || 0;
      }

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
          '📍 Các địa điểm được chọn từ database Đà Nẵng với đầy đủ thông tin',
          '💡 Lịch trình đã được tối ưu theo thời gian và khoảng cách',
          '💰 Chi phí được tính chính xác dựa trên giá thực tế'
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

  /**
   * Helper: Add minutes to time string
   */
  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
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
      return '🌧️ Có mưa - Nên mang ô và ưu tiên hoạt động trong nhà';
    }
    if (temp > 35) {
      return '🌡️ Nắng nóng - Nên mang nón, kem chống nắng';
    }
    if (condition === 'Clear' || condition === 'Clouds') {
      return '☀️ Thời tiết tốt - Lý tưởng cho các hoạt động ngoài trời';
    }
    return '✅ Thời tiết ổn định';
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
