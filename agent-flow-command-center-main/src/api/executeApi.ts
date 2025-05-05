import { supabase } from "@/integrations/supabase/client";

// Get API key from database
export async function getApiKey(userId: string, provider: string, model: string): Promise<string | null> {
  try {
    console.log(`Fetching API key for user ${userId}, provider ${provider}, model ${model}`);
    
    // Query the api_keys table
    const { data, error } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();
    
    if (error) {
      console.error('Error fetching API key:', error);
      return null;
    }
    
    if (!data) {
      console.log('No API key found');
      return null;
    }
    
    return data.api_key;
  } catch (error) {
    console.error('Unexpected error fetching API key:', error);
    return null;
  }
}

// Generic error handler
export function handleApiError(error: any) {
  console.error('API request error:', error);
  const status = error.status || 500;
  const message = error.message || 'Unknown error occurred';
  
  return {
    error: true,
    status,
    message,
    details: error.details || null
  };
}

// Execute OpenAI request
export async function executeOpenAI(userId: string, modelId: string, request: any) {
  try {
    // Get API key from database
    const apiKey = await getApiKey(userId, 'OpenAI', modelId);
    if (!apiKey) {
      return { 
        error: true, 
        status: 404,
        message: `No API key found for OpenAI model: ${modelId}. Please add your API key in the API Keys page.` 
      };
    }
    
    // Make the request to OpenAI API
    console.log(`Making request to OpenAI API for model: ${modelId}`);
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(request)
    });
    
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      return {
        error: true,
        status: openaiResponse.status,
        message: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      };
    }
    
    const data = await openaiResponse.json();
    return data;
  } catch (error) {
    return handleApiError(error);
  }
}

// Execute Anthropic request
export async function executeAnthropic(userId: string, modelId: string, request: any) {
  try {
    // Get API key from database
    const apiKey = await getApiKey(userId, 'Anthropic', modelId);
    if (!apiKey) {
      return { 
        error: true, 
        status: 404,
        message: `No API key found for Anthropic model: ${modelId}. Please add your API key in the API Keys page.` 
      };
    }
    
    console.log(`Making request to Anthropic Edge Function for model: ${modelId}`);
    
    const { data, error } = await supabase.functions.invoke('anthropic', {
      body: {
        model: modelId,
        messages: request.messages,
        system: request.system,
        temperature: request.temperature,
        max_tokens: request.max_tokens
      }
    })

    if (error) {
      console.error('Edge function error:', error);
      return {
        error: true,
        status: error.status || 500,
        message: `Edge function error: ${error.message || 'Unknown error'}`,
        details: error
      };
    }

    // Format response to match our standard format
    const formattedResponse = {
      choices: [{
        message: {
          content: data.content[0].text,
          role: 'assistant'
        }
      }],
      usage: data.usage || {}
    };
    
    return formattedResponse;
  } catch (error) {
    return handleApiError(error);
  }
}

// Execute Google Gemini request
export async function executeGoogle(userId: string, modelId: string, request: any) {
  try {
    // Get API key from database
    const apiKey = await getApiKey(userId, 'Google Gemini', modelId);
    if (!apiKey) {
      return { 
        error: true, 
        status: 404,
        message: `No API key found for Google Gemini model: ${modelId}. Please add your API key in the API Keys page.` 
      };
    }
    
    // Make the request to Google Gemini API
    console.log(`Making request to Google Gemini API for model: ${modelId}`);
    console.log('Original request format:', JSON.stringify(request, null, 2));
    
    // Construct Google Gemini API URL
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    
    // Format the request for Google Gemini API
    let geminiRequest;
    
    // Check if the format comes directly from GoogleAdapter or needs transformation
    if (request.contents) {
      // Format already matches what GoogleAdapter produces
      console.log('Using direct format from GoogleAdapter');
      geminiRequest = {
        ...request
      };
    } else if (request.messages) {
      // Convert from message format to Google Gemini format
      console.log('Converting from message format to Google Gemini format');
      geminiRequest = {
        contents: request.messages.map((msg: any) => ({
          role: msg.role === 'user' ? 'USER' : msg.role === 'system' ? 'SYSTEM' : 'MODEL',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.max_tokens || 1024,
        }
      };
      
      // Add system instruction if provided separately
      if (request.system) {
        geminiRequest.systemInstruction = {
          parts: [{ text: request.system }]
        };
      }
    } else {
      return {
        error: true,
        status: 400,
        message: 'Invalid request format for Google Gemini API',
        details: { providedFormat: Object.keys(request) }
      };
    }
    
    console.log('Sending request to Google Gemini API:', JSON.stringify(geminiRequest, null, 2));
    
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequest)
    });
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      return {
        error: true,
        status: geminiResponse.status,
        message: `Google Gemini API error: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      };
    }
    
    const data = await geminiResponse.json();
    console.log('Google Gemini API response:', JSON.stringify(data, null, 2));
    
    // Convert Google Gemini response format to standardized format
    const formattedResponse = {
      choices: [{
        message: {
          content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
          role: 'assistant'
        }
      }],
      usage: data.usageMetadata || {}
    };
    
    return formattedResponse;
  } catch (error) {
    return handleApiError(error);
  }
}

// Execute Mistral request
export async function executeMistral(userId: string, modelId: string, request: any) {
  try {
    // Get API key from database
    const apiKey = await getApiKey(userId, 'Mistral', modelId);
    if (!apiKey) {
      return { 
        error: true, 
        status: 404,
        message: `No API key found for Mistral model: ${modelId}. Please add your API key in the API Keys page.` 
      };
    }
    
    // Make the request to Mistral API
    console.log(`Making request to Mistral API for model: ${modelId}`);
    
    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: request.messages,
        max_tokens: request.max_tokens || 1024,
        temperature: request.temperature || 0.7
      })
    });
    
    if (!mistralResponse.ok) {
      const errorData = await mistralResponse.json();
      return {
        error: true,
        status: mistralResponse.status,
        message: `Mistral API error: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      };
    }
    
    const data = await mistralResponse.json();
    return data;
  } catch (error) {
    return handleApiError(error);
  }
}

// Execute Cohere request
export async function executeCohere(userId: string, modelId: string, request: any) {
  try {
    // Get API key from database
    const apiKey = await getApiKey(userId, 'Cohere', modelId);
    if (!apiKey) {
      return { 
        error: true, 
        status: 404,
        message: `No API key found for Cohere model: ${modelId}. Please add your API key in the API Keys page.` 
      };
    }
    
    // Make the request to Cohere API
    console.log(`Making request to Cohere API for model: ${modelId}`);
    
    const cohereResponse = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        message: request.message,
        preamble: request.preamble,
        max_tokens: request.max_tokens || 1024,
        temperature: request.temperature || 0.7
      })
    });
    
    if (!cohereResponse.ok) {
      const errorData = await cohereResponse.json();
      return {
        error: true,
        status: cohereResponse.status,
        message: `Cohere API error: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      };
    }
    
    const data = await cohereResponse.json();
    return data;
  } catch (error) {
    return handleApiError(error);
  }
}

// Execute XAI request
export async function executeXAI(userId: string, modelId: string, request: any) {
  try {
    // Get API key from database
    const apiKey = await getApiKey(userId, 'XAI', modelId);
    if (!apiKey) {
      return { 
        error: true, 
        status: 404,
        message: `No API key found for XAI model: ${modelId}. Please add your API key in the API Keys page.` 
      };
    }
    
    // Make the request to XAI API with the correct base URL
    console.log(`Making request to XAI API for model: ${modelId}`);
    
    const xaiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ...request,
        model: request.model.toLowerCase() // Ensure model name is lowercase
      })
    });
    
    if (!xaiResponse.ok) {
      const errorData = await xaiResponse.json();
      console.error('XAI API error:', errorData);
      return {
        error: true,
        status: xaiResponse.status,
        message: `XAI API error: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      };
    }
    
    const data = await xaiResponse.json();
    return data;
  } catch (error) {
    return handleApiError(error);
  }
}

// Execute DeepSeek request
export async function executeDeepSeek(userId: string, modelId: string, request: any) {
  try {
    // Get API key from database
    const apiKey = await getApiKey(userId, 'DeepSeek', modelId);
    if (!apiKey) {
      return { 
        error: true, 
        status: 404,
        message: `No API key found for DeepSeek model: ${modelId}. Please add your API key in the API Keys page.` 
      };
    }
    
    // Make the request to DeepSeek API
    console.log(`Making request to DeepSeek API for model: ${modelId}`);
    // Debug: log full request body
    console.log('DeepSeek request payload:', JSON.stringify(request, null, 2));
    
    // Use adapter-built request to ensure correct model and parameters
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(request)
    });
    
    if (!deepseekResponse.ok) {
      const errorData = await deepseekResponse.json();
      return {
        error: true,
        status: deepseekResponse.status,
        message: `DeepSeek API error: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      };
    }
    
    const data = await deepseekResponse.json();
    return data;
  } catch (error) {
    return handleApiError(error);
  }
}

// Execute Perplexity request
export async function executePerplexity(userId: string, modelId: string, request: any) {
  try {
    // Get API key from database
    const apiKey = await getApiKey(userId, 'Perplexity', modelId);
    if (!apiKey) {
      return { 
        error: true, 
        status: 404,
        message: `No API key found for Perplexity model: ${modelId}. Please add your API key in the API Keys page.` 
      };
    }
    
    // Make the request to Perplexity API
    console.log(`Making request to Perplexity API for model: ${modelId}`);
    
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 1000,
        top_p: 0.9,
        return_images: false,
        return_related_questions: false,
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });
    
    if (!perplexityResponse.ok) {
      const errorData = await perplexityResponse.json();
      return {
        error: true,
        status: perplexityResponse.status,
        message: `Perplexity API error: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      };
    }
    
    const data = await perplexityResponse.json();
    
    // Return data in the standardized format but preserving Perplexity-specific fields
    return {
      choices: [{
        message: {
          content: data.choices[0].message.content,
          role: 'assistant'
        },
        finish_reason: data.choices[0].finish_reason || 'stop'
      }],
      usage: data.usage || {},
      citations: data.citations || [],
      raw: data
    };
  } catch (error) {
    return handleApiError(error);
  }
}

// Execute Together AI request
export async function executeTogether(userId: string, modelId: string, request: any) {
  try {
    // Get API key from database
    const apiKey = await getApiKey(userId, 'Together AI', modelId);
    if (!apiKey) {
      return { 
        error: true, 
        status: 404,
        message: `No API key found for Together AI model: ${modelId}. Please add your API key in the API Keys page.` 
      };
    }
    
    // Use Supabase edge functions to avoid CORS issues
    console.log(`Making request to Together AI via edge function for model: ${modelId}`);
    
    const { data, error } = await supabase.functions.invoke('together', {
      body: {
        model: modelId,
        messages: request.messages,
        temperature: request.temperature || 0.2,
        top_p: request.top_p || 0.9,
        max_tokens: request.max_tokens || request.maxTokens || 2048
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      return {
        error: true,
        status: error.status || 500,
        message: `Edge function error: ${error.message || 'Unknown error'}`,
        details: error
      };
    }
    
    // Format the response to match our standard format
    return {
      choices: [{
        message: {
          content: data.content,
          role: 'assistant'
        }
      }],
      usage: data.usage || {},
      raw: data
    };
  } catch (error) {
    return handleApiError(error);
  }
}

// Unified execute function
export async function executeModel(providerName: string, modelId: string, request: any) {
  // Get current user session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { 
      error: true, 
      status: 401,
      message: 'Unauthorized. Please sign in to execute AI models.' 
    };
  }
  
  const userId = session.user.id;
  
  // Execute based on provider
  switch (providerName.toLowerCase()) {
    case 'openai':
      return executeOpenAI(userId, modelId, request);
    case 'anthropic':
      return executeAnthropic(userId, modelId, request);
    case 'google':
    case 'google gemini':
      return executeGoogle(userId, modelId, request);
    case 'mistral':
      return executeMistral(userId, modelId, request);
    case 'cohere':
      return executeCohere(userId, modelId, request);
    case 'xai':
      return executeXAI(userId, modelId, request);
    case 'deepseek':
      return executeDeepSeek(userId, modelId, request);
    case 'perplexity':
      return executePerplexity(userId, modelId, request);
    case 'together ai':
      return executeTogether(userId, modelId, request);
    default:
      return {
        error: true,
        status: 400,
        message: `Unsupported provider: ${providerName}`
      };
  }
}
