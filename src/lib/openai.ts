export interface KeywordResponse {
  primary: string;
  secondary: string[];
}

export interface AIError {
  error: string;
  details?: string;
}

async function handleAIResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json() as AIError;
    throw new Error(errorData.details || errorData.error || 'AI request failed');
  }
  return response.json();
}

export async function generateKeywords(title: string, description: string): Promise<KeywordResponse> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'generateKeywords',
      title,
      description,
    }),
  });

  return handleAIResponse<KeywordResponse>(response);
}

export async function generateDescription(title: string, primaryKeyword: string): Promise<string> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'generateDescription',
      title,
      primaryKeyword,
    }),
  });

  const data = await handleAIResponse<{ description: string }>(response);
  return data.description;
}

export async function generateArticleIdeas(
  brand: string,
  topic: string,
  articleType?: string,
  customSuggestion?: string,
  brandIdentity?: {
    tone?: string;
    style?: string;
    audience?: string;
    keywords?: string[];
    guardrails?: string[];
    brandIdentity?: string;
  }
): Promise<string[]> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'generateArticleIdeas',
      brand,
      topic,
      articleType,
      customSuggestion,
      brandIdentity
    }),
  });

  const data = await handleAIResponse<{ ideas: string[] }>(response);
  return data.ideas;
} 