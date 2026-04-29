const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { portfolio, solPrice, topDiscovery } = await req.json();

    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const portfolioSection = portfolio && portfolio.tokens?.length > 0
      ? `PORTFOLIO HOLDINGS:
Total Value: $${portfolio.totalValueUsd?.toFixed(2)}
SOL Balance: ${portfolio.solBalance?.toFixed(4)} SOL ($${(portfolio.solBalance * (solPrice || 0)).toFixed(2)})
Token Holdings:
${portfolio.tokens.map((t: any) => `  - ${t.symbol}: $${t.valueUsd?.toFixed(2)} (${t.priceChange24h >= 0 ? '+' : ''}${t.priceChange24h?.toFixed(1)}% 24h, Risk: ${t.riskScore || 'N/A'})`).join('\n')}`
      : 'No wallet connected - portfolio data unavailable.';

    const discoverySection = topDiscovery && topDiscovery.length > 0
      ? `TRENDING TOKENS ON SOLANA:
${topDiscovery.slice(0, 8).map((t: any) => `  - ${t.symbol} ($${t.priceUsd?.toFixed(6)}): ${t.priceChange24h >= 0 ? '+' : ''}${t.priceChange24h?.toFixed(1)}% 24h, Vol: $${(t.volume24h / 1e6).toFixed(1)}M, Liq: $${(t.liquidity / 1e6).toFixed(1)}M`).join('\n')}`
      : 'No trending token data available.';

    const prompt = `You are a Solana DeFi market analyst AI called "Pulse AI". Generate a concise daily market brief.

SOL PRICE: $${solPrice || 'Unknown'}

${portfolioSection}

${discoverySection}

Provide your brief in this exact JSON format:
{
  "market_sentiment": "bullish" | "bearish" | "neutral" | "mixed",
  "sol_outlook": "1 sentence on SOL's current state",
  "portfolio_insights": ["insight1", "insight2", "insight3"],
  "top_opportunities": ["opportunity with specific token mention", "opportunity2"],
  "risk_warnings": ["warning1", "warning2"],
  "action_items": ["specific action1", "specific action2"]
}

Be specific, mention actual token names and numbers. Respond ONLY with valid JSON.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
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

    let brief;
    try {
      brief = JSON.parse(content);
    } catch {
      brief = {
        market_sentiment: 'neutral',
        sol_outlook: content.slice(0, 200),
        portfolio_insights: [],
        top_opportunities: [],
        risk_warnings: ['Unable to parse structured brief'],
        action_items: ['Review market conditions manually'],
      };
    }

    return new Response(
      JSON.stringify({ brief }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
