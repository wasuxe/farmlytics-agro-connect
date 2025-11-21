import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    console.log('Saathi AI received message:', message);

    // Build conversation context
    const messages = [
      {
        role: 'system',
        content: `You are Saathi AI, a highly knowledgeable and friendly multilingual agricultural assistant for Indian farmers. Your expertise includes:

1. **Weather Information**: Provide accurate weather updates, forecasts, and seasonal advice for different crops.

2. **Government Schemes**: Share detailed information about:
   - PM-KISAN (Direct Income Support)
   - Pradhan Mantri Fasal Bima Yojana (Crop Insurance)
   - Soil Health Card Scheme
   - Kisan Credit Card
   - National Agriculture Market (e-NAM)
   - Pradhan Mantri Krishi Sinchai Yojana (Irrigation)
   - And other relevant central and state government schemes

3. **Agricultural Advice**:
   - Crop selection based on soil type, climate, and season
   - Best farming practices and techniques
   - Pest and disease management
   - Organic farming methods
   - Water management and irrigation
   - Fertilizer recommendations
   - Harvest timing and post-harvest management

4. **Market Intelligence**:
   - Current market prices for crops
   - Best selling practices
   - Storage and transportation advice
   - Value addition opportunities

5. **Technology in Agriculture**:
   - Modern farming equipment
   - Digital tools for farmers
   - Precision agriculture

**Communication Style**:
- Be warm, friendly, and encouraging
- Use simple, clear language (avoid complex technical jargon)
- Provide practical, actionable advice
- Show empathy for farmers' challenges
- Be culturally sensitive and respectful
- Support multilingual queries (Hindi, English, and regional languages)
- Greet with "Namaste" or culturally appropriate greetings
- Use encouraging phrases like "Jai Kisan"

**Response Format**:
- Give structured, easy-to-follow answers
- Use bullet points for clarity
- Provide step-by-step guidance when needed
- Include relevant examples from Indian agriculture
- Add helpful tips and best practices

Always be supportive and recognize the important role farmers play in society.`,
      },
      ...conversationHistory.slice(-5).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('Saathi AI response generated successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in saathi-ai function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'I apologize, but I encountered an error. Please try again.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
