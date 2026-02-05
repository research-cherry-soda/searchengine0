export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

function mockResults(query: string): SearchResult[] {
  const base = [
    {
      title: `Understanding ${query}`,
      url: `https://example.com/${encodeURIComponent(query)}/guide`,
      snippet: `A beginner-friendly overview of ${query}, key concepts, and common pitfalls.`,
    },
    {
      title: `${query} Best Practices`,
      url: `https://example.com/${encodeURIComponent(query)}/best-practices`,
      snippet: `Battle-tested recommendations for working with ${query} in production.`,
    },
    {
      title: `${query} Tutorials and Examples`,
      url: `https://example.com/${encodeURIComponent(query)}/tutorials`,
      snippet: `Hands-on tutorials with step-by-step examples to learn ${query}.`,
    },
    {
      title: `Advanced ${query} Techniques`,
      url: `https://example.com/${encodeURIComponent(query)}/advanced`,
      snippet: `Deep dives into advanced topics, optimization, and scaling strategies for ${query}.`,
    },
    {
      title: `${query} FAQ`,
      url: `https://example.com/${encodeURIComponent(query)}/faq`,
      snippet: `Frequently asked questions and detailed answers about ${query}.`,
    },
    {
      title: `${query} Tools & Libraries`,
      url: `https://example.com/${encodeURIComponent(query)}/tools`,
      snippet: `A curated list of tools and libraries to accelerate ${query}.`,
    },
    {
      title: `${query} Community Resources`,
      url: `https://example.com/${encodeURIComponent(query)}/community`,
      snippet: `Forums, communities, and places to get help with ${query}.`,
    },
    {
      title: `Comparing ${query} Approaches`,
      url: `https://example.com/${encodeURIComponent(query)}/comparisons`,
      snippet: `Trade-offs between popular approaches and frameworks related to ${query}.`,
    },
    {
      title: `${query} Performance Guide`,
      url: `https://example.com/${encodeURIComponent(query)}/performance`,
      snippet: `Techniques to improve performance and reliability when using ${query}.`,
    },
    {
      title: `Latest ${query} News`,
      url: `https://example.com/${encodeURIComponent(query)}/news`,
      snippet: `Recent updates, releases, and ecosystem highlights around ${query}.`,
    },
  ];
  return base;
}

export async function runAISearch(query: string, env: any): Promise<SearchResult[]> {
  const key = env?.OPENAI_API_KEY;
  if (!key) {
    // No API key configured; return deterministic mock results for local dev.
    return mockResults(query).slice(0, 10);
  }

  try {
    const prompt = `You are a search results generator. For the user query "${query}", return exactly 10 concise results as a JSON array. Each item must contain: title (string), url (string), snippet (string). Do not include markdown or explanations—only raw JSON.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Return only JSON that matches the schema." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      // Fallback to mocks on provider error
      return mockResults(query).slice(0, 10);
    }

    const data = await response.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) return mockResults(query).slice(0, 10);

    // Try to extract JSON block; if already raw JSON, just parse
    const trimmed = content.trim();
    const startIdx = trimmed.indexOf("[");
    const endIdx = trimmed.lastIndexOf("]");
    const jsonText = startIdx !== -1 && endIdx !== -1 ? trimmed.slice(startIdx, endIdx + 1) : trimmed;

    const parsed = JSON.parse(jsonText);
    // Basic validation and normalization
    const results: SearchResult[] = (parsed as any[])
      .slice(0, 10)
      .map((r) => ({
        title: String(r.title ?? "Untitled"),
        url: String(r.url ?? "https://example.com"),
        snippet: String(r.snippet ?? ""),
      }));
    return results;
  } catch {
    return mockResults(query).slice(0, 10);
  }
}
