// Gemini API Configuration
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;


const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';


const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
export function initGeminiAI() {
  if (!GEMINI_API_KEY) {
    console.error('❌ Gemini API key not found');
    return false;
  }
  console.log('✅ Gemini AI is ready');
  return true;
}


export async function callGeminiAI(
  message: string,
  context: {
    userLocation?: any;
    weather?: any;
    nearbyIncidents?: any[];
    realTimePlaces?: any[];
  }
): Promise<string> {
  // Analyze user intent and keywords
  const messageLower = message.toLowerCase();
  const keywords = {
    coffee: ['coffee', 'cafe', 'cà phê', 'café', 'caphe'],
    restaurant: ['restaurant', 'food', 'eat', 'quán ăn', 'nhà hàng', 'ăn'],
    salon: ['salon', 'hair', 'cut', 'cắt tóc', 'tiệm tóc'],
    spa: ['spa', 'massage', 'mát-xa'],
    gym: ['gym', 'fitness', 'phòng tập'],
    bar: ['bar', 'drink', 'beer', 'quán bar'],
    shopping: ['shop', 'mall', 'shopping', 'mua sắm', 'siêu thị'],
    beach: ['beach', 'sea', 'biển'],
    hotel: ['hotel', 'stay', 'khách sạn'],
    pharmacy: ['pharmacy', 'medicine', 'hiệu thuốc', 'thuốc'],
  };

  let placeType = '';

  try {
    console.log('🔍 Gemini AI called with message:', message);
    console.log('📍 Context received:', {
      location: context.userLocation?.address,
      weather: context.weather?.description,
      temp: context.weather?.temp,
      incidents: context.nearbyIncidents?.length
    });
    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => messageLower.includes(word))) {
        placeType = type;
        break;
      }
    }

    // Weather-aware response
    const weatherCondition = context.weather?.main?.toLowerCase() || '';
    const isRaining = weatherCondition.includes('rain') || context.weather?.description?.toLowerCase().includes('rain');
    const isCloudy = weatherCondition.includes('cloud');
    const isSunny = weatherCondition.includes('clear') || weatherCondition.includes('sun');
    const temp = context.weather?.temp || 0;

    // Check if user is asking about weather
    const isWeatherQuery = messageLower.includes('weather') || 
                          messageLower.includes('thời tiết') || 
                          messageLower.includes('trời') ||
                          messageLower.match(/how.*(?:is|'s).*(?:the )?weather/) ||
                          messageLower.includes('nhiệt độ') ||
                          messageLower.includes('temperature');

    let weatherResponse = '';
    if (isWeatherQuery) {
      if (isRaining) {
        weatherResponse = `You're right! It's raining today in Da Nang 🌧️ (${context.weather?.description}, ${temp}°C). I recommend visiting indoor places like cafes, shopping malls, or spas to stay dry and comfortable.\n\n`;
      } else if (temp > 30) {
        weatherResponse = `Yes, it's quite hot today! 🌡️ ${temp}°C with ${context.weather?.description}. Perfect weather to visit air-conditioned cafes, indoor shopping malls, or take a refreshing swim at the beach!\n\n`;
      } else if (isSunny) {
        weatherResponse = `Beautiful sunny day in Da Nang! ☀️ ${temp}°C with ${context.weather?.description}. Great time to explore beaches, outdoor cafes, or visit the famous bridges!\n\n`;
      } else if (isCloudy) {
        weatherResponse = `It's a bit cloudy today ☁️ (${temp}°C, ${context.weather?.description}). Nice weather for walking around and exploring the city!\n\n`;
      } else {
        weatherResponse = `Currently in Da Nang, the weather is ${context.weather?.description} with a temperature of ${temp}°C. `;
      }
    }

    // Build context-aware prompt
    const contextPrompt = `
You are a friendly, natural AI travel assistant for Da Nang, Vietnam.

CURRENT WEATHER DATA (from OpenWeather API):
- Weather: ${context.weather?.description || 'Unknown'}
- Temperature: ${temp}°C
- Main Condition: ${context.weather?.main || 'Unknown'}
- Details: ${isRaining ? '🌧️ Raining' : isSunny ? '☀️ Sunny' : isCloudy ? '☁️ Cloudy' : 'Normal conditions'}
- Humidity: ${context.weather?.humidity || 'N/A'}%
- Wind Speed: ${context.weather?.windSpeed || 'N/A'} m/s

OTHER CONTEXT:
- User Location: ${context.userLocation?.address || 'Da Nang'}
- Safety: ${context.nearbyIncidents?.length || 0} incidents nearby
- User is looking for: ${placeType || 'general information'}

IMPORTANT INSTRUCTIONS:
1. **Weather Responses** - When user asks about weather (like "how is the weather today in da nang"):
   - Respond DIRECTLY with current weather information: description, temperature, conditions
   - Examples:
     * "The weather in Da Nang today is quite nice! ☀️ It's ${context.weather?.description} with a temperature of ${temp}°C. Perfect for outdoor activities!"
     * "Currently in Da Nang, it's ${context.weather?.description} and ${temp}°C. ${isRaining ? 'Bring an umbrella!' : isSunny ? 'Great day to explore!' : 'Nice day for sightseeing!'}"
   - If raining: "You're right! It's raining today 🌧️..." 
   - If hot: "It's really hot today! 🌡️..."
   - If sunny: "Beautiful day today! ☀️..."
   - ALWAYS include actual temperature and description from the context
   - Be conversational and friendly!

2. **Place Recommendations** - MUST MATCH USER INTENT:
   - If user says "coffee" or "cafe" → ONLY recommend coffee shops/cafes
   - If user says "restaurant" or "food" → ONLY recommend restaurants
   - If user says "salon" or "hair" → ONLY recommend hair salons
   - If user says "spa" or "massage" → ONLY recommend spas
   - DO NOT mix categories! If they want coffee, don't suggest restaurants!

3. **Weather-Smart Suggestions**:
   - Raining → Indoor places (malls, cafes with AC, indoor attractions)
   - Hot (>30°C) → Air-conditioned places or beaches
   - Nice weather → Outdoor cafes, beaches, parks

4. **Response Format**:
   - Start with weather acknowledgment if relevant
   - Suggest 3-5 specific places matching EXACT user intent
   - Include: Name, rating (if known), distance, why it's good
   - Add helpful tips
   - End with "Book Grab to get there easily! 🚗"

5. **Language**: Match user's language (Vietnamese or English)

6. **Tone**: Friendly, natural, like chatting with a local friend

USER MESSAGE: "${message}"

${weatherResponse ? 'Start with this weather response: ' + weatherResponse : ''}

Now provide specific recommendations matching user's intent:`;

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: contextPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048, // Increased from 1024 to handle longer responses
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error status:', response.status);
      console.error('❌ Gemini API error response:', errorText);
      
      // Handle rate limit (429) and quota errors
      if (response.status === 429 || response.status === 403) {
        console.warn('⚠️ API quota exceeded or rate limited - using fallback response');
        return getFallbackResponse(message, context, placeType, isRaining);
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('🔍 Raw Gemini AI response:', data);

    // Check for API errors
    if (data.error) {
      console.error('❌ Gemini API returned error:', data.error);
      throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`);
    }

    // Extract text from Gemini response with better error handling
    if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      
      // Check finish reason
      if (candidate.finishReason === 'SAFETY') {
        console.warn('⚠️ Response blocked by safety filters');
        return getFallbackResponse(message, context, placeType, isRaining);
      }
      
      if (candidate.finishReason === 'MAX_TOKENS') {
        console.warn('⚠️ Response truncated due to MAX_TOKENS - using fallback');
        return getFallbackResponse(message, context, placeType, isRaining);
      }
      
      // Try multiple paths to extract text
      let text = null;
      
      // Path 1: candidate.content.parts[0].text (standard structure)
      if (candidate.content?.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
        text = candidate.content.parts[0].text;
      }
      
      // Path 2: candidate.text (alternative structure)
      if (!text && candidate.text) {
        text = candidate.text;
      }
      
      // Path 3: candidate.output (another alternative)
      if (!text && candidate.output) {
        text = candidate.output;
      }
      
      if (text && typeof text === 'string' && text.trim()) {
        console.log('✅ Gemini AI response extracted successfully');
        const finalResponse = weatherResponse + text;
        console.log('📝 Final response:', finalResponse.substring(0, 200) + '...');
        return finalResponse;
      }
      
      // If no text but finish reason is STOP, it might be empty response
      if (candidate.finishReason === 'STOP' && !text) {
        console.warn('⚠️ Empty response from Gemini - using fallback');
        return getFallbackResponse(message, context, placeType, isRaining);
      }
    }

    console.warn('⚠️ Invalid response structure from Gemini API');
    console.warn('Response data:', JSON.stringify(data, null, 2));
    throw new Error('Invalid response format from Gemini API');

  } catch (error: any) {
    console.error('❌ Gemini AI error:', error);
    
    // Check if error is quota-related
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      console.warn('⚠️ API quota exceeded - using fallback response');
      return getFallbackResponse(message, context, placeType, false);
    }
    
    return getFallbackResponse(message, context, '', false);
  }
}

// Fallback response when Gemini fails
function getFallbackResponse(
  message: string, 
  context: any, 
  placeType: string, 
  isRaining: boolean
): string {
  const temp = context.weather?.temp || 0;
  const weather = context.weather?.description || 'pleasant';
  
  // Weather-aware greeting
  let response = '';
  if (isRaining) {
    response = `It's raining today 🌧️ (${weather}, ${temp}°C). `;
  } else if (temp > 30) {
    response = `It's quite hot today 🌡️ (${temp}°C). `;
  } else {
    response = `Nice weather today! ${temp}°C and ${weather}. `;
  }

  // Recommendations based on place type
  if (placeType === 'coffee') {
    response += `\n\nHere are some great coffee shops in Da Nang:\n\n`;
    response += `☕ **Cong Caphe** - Traditional Vietnamese cafe with vintage decor\n`;
    response += `☕ **43 Factory Coffee Roaster** - Specialty coffee, modern atmosphere\n`;
    response += `☕ **K'HỒ COFFEE** - Cozy spot with amazing views\n`;
  } else if (placeType === 'restaurant') {
    response += `\n\nGreat restaurants you should try:\n\n`;
    response += `🍜 **Madame Lan** - Famous for authentic Vietnamese cuisine\n`;
    response += `🍽️ **Waterfront** - International dishes with beach views\n`;
    response += `🥘 **Bà Dương** - Local favorite for traditional food\n`;
  } else if (placeType === 'salon') {
    response += `\n\nPopular hair salons:\n\n`;
    response += `💇 **30Shine** - Modern chain with quality service\n`;
    response += `💇 **Hair Salon Luxury** - Professional styling\n`;
  } else if (placeType === 'spa') {
    response += `\n\nRelaxing spa recommendations:\n\n`;
    response += `💆 **Herbal Spa** - Traditional Vietnamese massage\n`;
    response += `💆 **Brilliant Top Spa** - Full-service spa with great reviews\n`;
  } else {
    response += `\n\nI can help you find:\n`;
    response += `☕ Coffee shops & cafes\n`;
    response += `🍜 Restaurants & street food\n`;
    response += `💇 Hair salons & spas\n`;
    response += `🏖️ Beaches & attractions\n`;
    response += `🏪 Shopping malls & stores\n\n`;
    response += `What would you like to explore?`;
  }

  response += `\n\n🚗 Book Grab to get there easily!`;
  
  return response;
}


export async function testGeminiAI(): Promise<boolean> {
  try {
    const response = await callGeminiAI('Hello, are you working?', {});
    return response.length > 0;
  } catch (error) {
    console.error('❌ Gemini AI test failed:', error);
    return false;
  }
}
