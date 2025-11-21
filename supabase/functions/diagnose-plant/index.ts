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
    const { imageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert agricultural AI assistant specializing in plant disease diagnosis for Indian agriculture. 

CRITICAL INSTRUCTIONS:
- Provide HIGHLY ACCURATE and PRECISE diagnosis based on visual symptoms
- Give DETAILED, ACTIONABLE treatment recommendations
- Consider Indian climate, crop varieties, and local farming practices
- Be specific about disease names, stages, and severity
- Include both organic and chemical treatment options with exact dosages
- Mention preventive measures to avoid recurrence

DIAGNOSIS FORMAT:
1. **Disease Identification**: Exact name and type of disease/pest/deficiency
2. **Severity Level**: Mild/Moderate/Severe with confidence percentage
3. **Affected Parts**: Which parts of the plant are affected
4. **Stage**: Early/Progressive/Advanced stage
5. **Immediate Action**: What to do right now (within 24-48 hours)
6. **Treatment Plan**:
   - Organic solutions (neem oil, bio-pesticides, home remedies)
   - Chemical solutions (exact names, dosages, application method)
   - Application frequency and duration
7. **Prevention**: Steps to prevent future occurrences
8. **Additional Care**: Watering, nutrition, sunlight requirements
9. **Expected Recovery Time**: Realistic timeline for improvement
10. **Warning Signs**: When to seek expert help or discard plants

Be compassionate but scientifically accurate. Indian farmers depend on precise information.`,
          },
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: 'Analyze this plant image carefully. Identify any diseases, pests, nutrient deficiencies, or health issues. Provide a comprehensive diagnosis following the format specified in your system instructions. Be extremely precise and detailed in your recommendations.' 
              },
              { type: 'image_url', image_url: { url: imageUrl } }
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        diagnosis: aiResponse,
        disease: "Analysis provided",
        confidence: 85,
        recommendations: aiResponse,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
