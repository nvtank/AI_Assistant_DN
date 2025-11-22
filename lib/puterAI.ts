// Puter AI Integration
// This utility provides integration with Puter.js AI services
// Puter provides FREE AI (GPT, Claude, Gemini) without API keys!

/**
 * Initialize Puter SDK
 * Load from CDN: https://js.puter.com/v2/
 */
export function initPuterAI() {
  // Puter is loaded via script tag in _document.tsx
  // Check if puter is available
  if (typeof window !== 'undefined' && (window as any).puter) {
    console.log('✅ Puter AI is ready');
    return true;
  }
  return false;
}

/**
 * Call Puter AI with context-aware prompt
 */
export async function callPuterAI(
  message: string,
  context: {
    userLocation?: any;
    weather?: any;
    nearbyIncidents?: any[];
    realTimePlaces?: any[]; // NEW: Real-time places from Google API
  }
): Promise<string> {
  try {
    // Check if Puter is available
    if (typeof window === 'undefined' || !(window as any).puter) {
      throw new Error('Puter AI not available');
    }

    const puter = (window as any).puter;

    // Build context-aware prompt with real-time data (English for better AI understanding)
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

    // Call Puter AI (using GPT-5 nano or Claude)
    // Puter provides multiple AI models for free!
    const response = await puter.ai.chat(contextPrompt, {
      model: 'claude', // Options: 'gpt-5-nano', 'claude', 'gemini', etc.
      stream: false,
    });

    console.log('🔍 Raw Puter AI response:', response);

    // Handle different response formats
    // 1. Claude/Anthropic format: { content: [{ text: "..." }], ... }
    if (response && typeof response === 'object' && 'content' in response) {
      const content = response.content;
      if (Array.isArray(content) && content.length > 0) {
        // Extract text from first content block
        const firstBlock = content[0];
        if (firstBlock && typeof firstBlock === 'object' && 'text' in firstBlock) {
          console.log('✅ Extracted text from Claude format');
          return firstBlock.text;
        }
      }
    }

    // 2. Direct message format: { message: "..." }
    if (response && typeof response === 'object' && 'message' in response) {
      console.log('✅ Extracted text from message format');
      return response.message || 'Sorry, I cannot answer this question.';
    }

    // 3. Plain string format
    if (typeof response === 'string') {
      console.log('✅ Direct string response');
      return response;
    }

    // 4. Text property format: { text: "..." }
    if (response && typeof response === 'object' && 'text' in response) {
      console.log('✅ Extracted text from text property');
      return response.text;
    }

    // 5. Fallback: try toString()
    if (response && typeof response.toString === 'function') {
      console.warn('⚠️ Using toString() fallback');
      return response.toString();
    }

    console.error('❌ Unknown response format:', response);
    return 'Sorry, I cannot answer this question.';
  } catch (error) {
    console.error('Puter AI error:', error);
    throw error;
  }
}

/**
 * Stream AI response (for real-time typing effect)
 */
export async function streamPuterAI(
  message: string,
  context: any,
  onChunk: (text: string) => void
): Promise<void> {
  try {
    if (typeof window === 'undefined' || !(window as any).puter) {
      throw new Error('Puter AI not available');
    }

    const puter = (window as any).puter;

    const contextPrompt = `
You are an intelligent AI assistant for the Da Nang tourism application.
Location: ${context.userLocation?.address || 'Unknown'}
Weather: ${context.weather?.description || 'Unknown'}, ${context.weather?.temp || 'N/A'}°C
Incidents: ${context.nearbyIncidents?.length || 0} nearby incidents

Question: ${message}

Reply briefly, friendly, with emojis.
`;

    // Stream response
    const response = await puter.ai.chat(contextPrompt, {
      model: 'claude',
      stream: true,
    });

    // Process stream
    // Puter may return different formats, handle both
    if (typeof response === 'string') {
      onChunk(response);
    } else if (response && typeof response[Symbol.asyncIterator] === 'function') {
      // Response is async iterable (stream)
      for await (const part of response) {
        if (typeof part === 'string') {
          onChunk(part);
        } else if (part?.text) {
          onChunk(part.text);
        } else if (part?.message) {
          onChunk(part.message);
        }
      }
    } else if (response && typeof response === 'object' && 'message' in response) {
      // Single response object
      onChunk(response.message);
    } else if (response && typeof response.toString === 'function') {
      onChunk(response.toString());
    }
  } catch (error) {
    console.error('Puter AI streaming error:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated with Puter
 */
export function isPuterAuthenticated(): boolean {
  if (typeof window === 'undefined' || !(window as any).puter) {
    return false;
  }
  // Puter handles authentication automatically
  // Users can use AI without explicit auth (user-pays model)
  return true;
}
