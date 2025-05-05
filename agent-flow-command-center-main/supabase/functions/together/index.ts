import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface TogetherRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

// Add type for responseData
interface TogetherResponse {
  choices?: Array<{ message?: { content: string } }>;
  usage?: object;
  error?: { message: string };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the API key from environment variables (set in Supabase)
    const apiKey = Deno.env.get("TOGETHER_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request body
    let requestData: TogetherRequest;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { model, messages, temperature = 0.2, top_p = 0.9, max_tokens = 2048 } = requestData;
    console.log(`Processing request for model: ${model}`);

    // Validate required fields
    if (!model || !messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: model and messages array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine the correct endpoint based on the model
    const endpoint = `https://api.together.xyz/v1/chat/completions`;
    console.log(`Using endpoint: ${endpoint}`);

    // Make request to Together AI API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages,
        temperature,
        top_p,
        max_tokens
      })
    });

    console.log(`API response status: ${response.status}`);

    // Parse the response
    const responseData = (await response.json()) as TogetherResponse;

    if (!response.ok) {
      console.error("Error from Together API:", responseData);
      return new Response(
        JSON.stringify({ 
          error: responseData.error?.message || 'Unknown API error',
          details: responseData 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Transform the response to our standard format
    const result = {
      content: responseData.choices?.[0]?.message?.content || "",
      usage: responseData.usage || {},
      raw: responseData
    };

    console.log("Successfully processed response");

    // Return the response
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    // Log and return error response
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error', stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
