// This file handles API key validation and retrieval

// Test API key for validity
export async function testApiKey(provider: string, apiKey?: string) {
  // If we're testing a key directly passed from the app
  let keyToTest;
  
  if (apiKey) {
    keyToTest = apiKey;
  } else {
    // Otherwise use the secret from environment
    switch (provider) {
      case "openai":
        keyToTest = Deno.env.get("OPENAI_API_KEY");
        break;
      case "anthropic":
        keyToTest = Deno.env.get("ANTHROPIC_API_KEY");
        break;
      case "gemini":
        keyToTest = Deno.env.get("GEMINI_API_KEY");
        break;
      default:
        throw new Error("Unsupported AI provider");
    }
  }
  
  if (!keyToTest) {
    throw new Error(`API key not found for ${provider}`);
  }
  
  // Make a very simple API call to validate the key
  let valid = false;
  
  if (provider === "openai") {
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${keyToTest}`,
      },
    });
    valid = response.ok;
  }
  else if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      method: "GET",
      headers: {
        "x-api-key": keyToTest,
        "anthropic-version": "2023-06-01"
      },
    });
    valid = response.ok;
  }
  else if (provider === "gemini") {
    // For Gemini, we'll just make a simple API call to check if the key works
    const modelName = "gemini-1.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}?key=${keyToTest}`, {
      method: "GET",
    });
    valid = response.ok;
  }
  
  if (!valid) {
    throw new Error(`Invalid ${provider} API key`);
  }
  
  return true;
}

// Get API key and model for a provider
export function getApiKeyAndModel(provider: string) {
  let apiKey;
  let model;
  
  switch (provider) {
    case "openai":
      apiKey = Deno.env.get("OPENAI_API_KEY");
      model = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
      break;
    case "anthropic":
      apiKey = Deno.env.get("ANTHROPIC_API_KEY");
      model = Deno.env.get("ANTHROPIC_MODEL") || "claude-3-haiku-20240307";
      break;
    case "gemini":
      apiKey = Deno.env.get("GEMINI_API_KEY");
      model = Deno.env.get("GEMINI_MODEL") || "gemini-1.5-flash";
      break;
    default:
      throw new Error("Unsupported AI provider");
  }
  
  if (!apiKey) {
    throw new Error(`API key not found for ${provider}`);
  }
  
  return { apiKey, model };
}
