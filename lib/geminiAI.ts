// Gemini API Configuration
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';


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
  try {
    // Build context-aware prompt with real-time data
    const contextPrompt = `
You are an intelligent AI travel assistant for Da Nang, Vietnam tourism with access to REAL-TIME Google Places API data.

CURRENT CONTEXT:
- User Location: ${context.userLocation?.address || 'Unknown location'}
- GPS Coordinates: Lat ${context.userLocation?.lat}, Lng ${context.userLocation?.lng}
- Weather Conditions: ${context.weather?.description || 'Unknown'} at ${context.weather?.temp || 'N/A'}°C
- Traffic/Safety: ${context.nearbyIncidents?.length || 0} active incidents nearby${context.nearbyIncidents?.length ? ` (Types: ${context.nearbyIncidents.map((i: any) => i.type).join(', ')})` : ''}
${context.realTimePlaces?.length ? `- Real-time Places Found: ${context.realTimePlaces.length} locations in database
  Featured: ${context.realTimePlaces.slice(0, 5).map((p: any) => `${p.name} (${p.rating || 'N/A'}★, ${p.isIndoor ? 'Indoor' : 'Outdoor'})`).join(', ')}` : '- Real-time places: Not loaded yet'}

YOUR CAPABILITIES:
✅ Search Google Places API for: restaurants, cafes, bars, street food, hair salons, nail salons, spas, massage, gyms, pharmacies, convenience stores, shopping malls, cinemas, parks, attractions
✅ Provide REAL-TIME information: current ratings, reviews count, opening hours, exact addresses, phone numbers
✅ Understand Vietnamese and English queries (translate keywords automatically)
✅ Filter by weather conditions (rain → indoor, sunny → outdoor/beach)
✅ Avoid dangerous areas with traffic incidents
✅ Calculate distances and suggest best transportation method (walk/bike/car)

RESPONSE GUIDELINES:
1. Analyze user's intent (looking for food? services? entertainment?)
2. Check weather: If raining/hot → prioritize indoor/air-conditioned places
3. Safety first: Avoid areas with flooding, potholes, or traffic jams
4. Suggest 3-5 specific places with:
   - Name and rating (★)
   - Distance from user (~XXm or ~XXkm)
   - Why it's good (specialty, ambiance, price range)
   - Indoor/outdoor status
5. Add helpful tips (operating hours, best time to visit, booking advice)
6. Always end with "Book Grab" call-to-action
7. Use emojis appropriately (🍜 food, ☕ cafe, 💇 salon, 💆 spa, etc.)
8. Reply in user's language (Vietnamese if user asks in Vietnamese, English if English)
9. Be conversational, friendly, and practical (like a local friend)

VIETNAMESE KEYWORDS AUTO-TRANSLATION:
- "quán ăn" → restaurant
- "quán cà phê/cafe" → cafe
- "tiệm cắt tóc" → hair salon
- "spa" → spa/massage
- "phòng gym" → gym
- "ăn vặt" → street food/snack
- "siêu thị" → supermarket
- "hiệu thuốc" → pharmacy

USER QUESTION: ${message}

Provide a helpful, actionable response now:`;

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
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
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
      const errorData = await response.json();
      console.error('❌ Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('🔍 Raw Gemini AI response:', data);

    // Extract text from Gemini response
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const text = candidate.content.parts[0].text;
        console.log('✅ Gemini AI response extracted:', text.substring(0, 200) + '...');
        return text;
      }
    }

    throw new Error('Invalid response format from Gemini API');

  } catch (error: any) {
    console.error('❌ Gemini AI error:', error);
    
    // Fallback response
    return `Sorry, I'm having trouble connecting to AI. Please try again later or contact support..
    
Error: ${error.message}`;
  }
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
