# Weather & Place Suggestions Fix

## 🎯 Vấn đề đã được giải quyết

### 1. AI không nên recommend địa điểm khi hỏi về thời tiết
**Vấn đề cũ**: Khi người dùng hỏi "How is the weather today in Da Nang?", AI vẫn hiển thị danh sách địa điểm gợi ý (cafes, restaurants...).

**Giải pháp**: 
- Thêm logic phân tích intent của câu hỏi trong `AIChatbot.tsx`
- Chỉ hiển thị suggestions khi người dùng **thực sự hỏi về địa điểm**
- Ẩn suggestions khi hỏi về thời tiết, thông tin chung, hoặc các chủ đề khác

**Code đã thêm**:
```typescript
// Only suggest places if user is asking about places/locations
const isAskingAboutPlaces = 
  messageLower.includes('where') ||
  messageLower.includes('recommend') ||
  messageLower.includes('suggest') ||
  messageLower.includes('place') ||
  messageLower.includes('coffee') ||
  messageLower.includes('cafe') ||
  messageLower.includes('restaurant') ||
  messageLower.includes('food') ||
  messageLower.includes('beach') ||
  messageLower.includes('visit') ||
  messageLower.includes('go to') ||
  messageLower.includes('đâu') ||
  messageLower.includes('quán') ||
  messageLower.includes('nhà hàng') ||
  messageLower.includes('địa điểm');

const isAskingWeatherOnly = 
  (messageLower.includes('weather') || 
   messageLower.includes('thời tiết') || 
   messageLower.includes('temperature') ||
   messageLower.includes('nhiệt độ')) &&
  !isAskingAboutPlaces;

if (isAskingAboutPlaces && !isAskingWeatherOnly) {
  suggestPlacesBasedOnContext();
  setShowSuggestions(true);
} else {
  // Hide suggestions for non-place questions
  setSuggestedPlaces([]);
  setShowSuggestions(false);
}
```

### 2. Sửa OpenWeather API để chính xác hơn cho Đà Nẵng

**Vấn đề cũ**: 
- API gọi qua `NEXT_PUBLIC_SOCKET_URL` (server bên ngoài)
- Response structure không nhất quán
- Có thể không chính xác cho Đà Nẵng

**Giải pháp**:
- Gọi trực tiếp local API route: `/api/weather?lat=${lat}&lon=${lon}`
- Local API sử dụng tọa độ chính xác của Đà Nẵng: `16.0544, 108.2022`
- Chuẩn hóa response structure

**Files đã sửa**:

1. **app/page.tsx** - Fetch weather từ local API:
```typescript
const response = await fetch(
  `/api/weather?lat=${location.lat}&lon=${location.lng}`
);
const data = await response.json();

if (data.temp !== undefined) {
  setWeather({
    temp: data.temp,
    feels_like: data.feels_like,
    humidity: data.humidity,
    description: data.description,
    main: data.main,
    wind_speed: data.windSpeed,
  });
}
```

2. **app/api/weather/route.ts** - Trả về structure nhất quán:
```typescript
return NextResponse.json({
  temp: data.main.temp,
  feels_like: data.main.feels_like,
  humidity: data.main.humidity,
  description: data.weather[0].description,
  main: data.weather[0].main,
  windSpeed: data.wind.speed,
});
```

3. **lib/types.ts** - Cập nhật interface:
```typescript
export interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  main: string;
  wind_speed?: number;
  windSpeed?: number;
}
```

## 📍 Tọa độ Đà Nẵng chính xác

Tọa độ mặc định được sử dụng:
- **Latitude**: 16.0544 (trung tâm thành phố Đà Nẵng)
- **Longitude**: 108.2022 (gần cầu Rồng, trung tâm Hải Châu)

Đây là tọa độ chính xác cho trung tâm thành phố Đà Nẵng, đảm bảo dữ liệu thời tiết từ OpenWeather API phù hợp nhất.

## ✅ Kết quả

### Trước khi sửa:
- ❌ Hỏi "How is the weather?" → AI trả lời + hiển thị list cafes/restaurants
- ❌ Weather data có thể không chính xác hoặc bị lỗi structure

### Sau khi sửa:
- ✅ Hỏi "How is the weather today in Da Nang?" → AI chỉ trả lời về thời tiết, KHÔNG hiển thị địa điểm
- ✅ Hỏi "Where can I find good coffee?" → AI trả lời + hiển thị cafes gần đó
- ✅ Weather data chính xác từ OpenWeather API với tọa độ Đà Nẵng
- ✅ Response structure nhất quán và dễ debug

## 🧪 Test Cases

### 1. Weather-only questions (NO place suggestions):
```
- "How is the weather today in Da Nang?"
- "What's the temperature?"
- "Thời tiết hôm nay thế nào?"
- "Nhiệt độ bao nhiêu?"
```

### 2. Place-related questions (WITH suggestions):
```
- "Where can I find good coffee?"
- "Recommend some restaurants"
- "Beach near me"
- "Quán cafe nào ngon?"
- "Địa điểm du lịch"
```

### 3. Mixed questions (SMART detection):
```
- "Where should I go if it's raining?" → Shows places (because "where")
- "Is it hot? Any place to cool down?" → Shows places (because "place")
```

## 📊 API Flow

```
User → Frontend (page.tsx)
         ↓
    /api/weather?lat=16.0544&lon=108.2022
         ↓
    OpenWeather API (api.openweathermap.org)
         ↓
    Return: { temp, description, humidity, windSpeed... }
         ↓
    AI Chatbot (uses weather data in context)
```

## 🔄 Cải tiến tiếp theo (optional)

1. **Caching**: Cache weather data 10 phút (đã có: `revalidate: 600`)
2. **Fallback**: Nếu OpenWeather API fail → sử dụng weather mặc định
3. **Multiple locations**: Hỗ trợ nhiều địa điểm trong Đà Nẵng
4. **Weather history**: Lưu lịch sử thời tiết để so sánh

## 📝 Notes

- OpenWeather API có giới hạn: 1000 calls/day (free tier)
- Weather data được cache 10 phút để giảm API calls
- Tọa độ 16.0544, 108.2022 là trung tâm Đà Nẵng (chính xác nhất cho city-wide weather)
