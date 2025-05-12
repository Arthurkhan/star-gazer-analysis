
// This file contains the request handlers for different API providers

// Define CORS headers for browser requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Call OpenAI API
export async function callOpenAI(apiKey: string, model: string, systemMessage: string, prompt: string) {
  console.log("Calling OpenAI API...");
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`OpenAI API call failed with status: ${response.status}`, errorData);
    throw new Error(`OpenAI API call failed with status: ${response.status}. Details: ${errorData}`);
  }

  return await response.json();
}

// Call Anthropic API
export async function callAnthropic(apiKey: string, model: string, systemMessage: string, prompt: string) {
  console.log("Calling Anthropic API...");
  
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model,
      system: systemMessage,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`Anthropic API call failed with status: ${response.status}`, errorData);
    throw new Error(`Anthropic API call failed with status: ${response.status}. Details: ${errorData}`);
  }

  return await response.json();
}

// Call Gemini API
export async function callGemini(apiKey: string, model: string, systemMessage: string, prompt: string) {
  console.log("Calling Gemini API...");
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: `${systemMessage}\n\n${prompt}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000,
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`Gemini API call failed with status: ${response.status}`, errorData);
    throw new Error(`Gemini API call failed with status: ${response.status}. Details: ${errorData}`);
  }

  return await response.json();
}
