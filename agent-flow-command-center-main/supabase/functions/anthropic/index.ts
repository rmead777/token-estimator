
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Valid model names in Anthropic's format
const validModels = [
  'claude-3-7-sonnet-20250219',
  'claude-3-sonnet-20240229',
  'claude-3-opus-20240229',
  'claude-3-haiku-20240307'
];

// Maximum token limits per model
const modelTokenLimits: Record<string, number> = {
  'claude-3-7-sonnet-20250219': 16384,
  'claude-3-opus-20240229': 32768,
  'claude-3-sonnet-20240229': 16384,
  'claude-3-haiku-20240307': 4096
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { model, messages, system, temperature, max_tokens } = await req.json()

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      throw new Error('Anthropic API key not configured')
    }

    // Use model name directly without mapping
    if (!validModels.includes(model)) {
      throw new Error(`Invalid model name: ${model}. Available models are: ${validModels.join(', ')}`)
    }

    console.log('Making request to Anthropic API:', { 
      model,
      system 
    })

    // Filter out any messages with empty content
    const validMessages = messages.filter(msg => msg.content && msg.content.trim() !== '')
    
    // Check if there are any valid messages
    if (validMessages.length === 0) {
      throw new Error('At least one message with non-empty content is required')
    }

    // Apply token limit based on the model
    const modelTokenLimit = modelTokenLimits[model]
    const safeMaxTokens = Math.min(max_tokens || 1024, modelTokenLimit)

    console.log(`Using max_tokens: ${safeMaxTokens} (limit for ${model}: ${modelTokenLimit})`)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        messages: validMessages.map(msg => ({
          role: msg.role === 'system' ? 'assistant' : msg.role,
          content: msg.content
        })),
        system,
        max_tokens: safeMaxTokens,
        temperature: temperature || 0.7
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Anthropic API error:', error)
      throw new Error(`Anthropic API error: ${error.error?.message || JSON.stringify(error)}`)
    }

    const data = await response.json()
    console.log('Anthropic API response:', data)

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

