const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token || !token.symbol) {
      return new Response(
        JSON.stringify({ error: 'Token data required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are a Solana DeFi risk analyst. Analyze this token and provide a concise trading assessment.

TOKEN DATA:
- Symbol: ${token.symbol}
- Name: ${token.name}
- Price: $${token.priceUsd}
- 24h Change: ${token.priceChange24h}%
- 1h Change: ${token.priceChange1h || 'N/A'}%
- 24h Volume: $${token.volume24h}
- Liquidity: $${token.liquidity}
- FDV: $${token.fdv}
- 24h Transactions: ${token.txns24h} (Buys: ${token.buys24h}, Sells: ${token.sells24h})
- DEX: ${token.dexId}
- Age: ${token.ageHours ? token.ageHours + ' hours' : 'Unknown'}
- Risk Score: ${token.riskScore}/100

Provide your analysis in this exact JSON format:
{
  "signal": "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL" | "AVOID",
  "confidence": 0-100,
  "summary": "2-3 sentence summary",
  "bullish_factors": ["factor1", "factor2"],
  "bearish_factors": ["factor1", "factor2"],
  "risk_assessment": "1 sentence risk note",
  "suggested_action": "What a trader should do right now in 1 sentence"
}

Respond ONLY with valid JSON. No markdown, no code blocks.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Groq error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      analysis = {
        signal: 'HOLD',
        confidence: 50,
        summary: content.slice(0, 300),
        bullish_factors: [],
        bearish_factors: [],
        risk_assessment: 'Unable to parse structured analysis',
        suggested_action: 'Exercise caution and do your own research',
      };
    }

    return new Response(
      JSON.stringify({ analysis, token_symbol: token.symbol }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
