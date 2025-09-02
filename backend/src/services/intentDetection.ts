import Anthropic from "@anthropic-ai/sdk";

export class IntentDetectionService {
  private claude: Anthropic;

  constructor(apiKey: string) {
    this.claude = new Anthropic({
      apiKey: apiKey,
    });
  }

  async detectSearchIntent(query: string): Promise<"specific" | "general"> {
    try {
      const prompt = `Analyze this coffee shop search query and determine if the user is looking for:

1. A SPECIFIC coffee shop (like "Blue Bottle Coffee", "Joe Coffee Company", "Starbucks on 5th Ave", "that cafe with the red door")
2. GENERAL coffee shops in an area (like "coffee near me", "best cafes", "cheap coffee", "coffee shops open late")

Query: "${query}"

Respond with just one word: "specific" or "general"`;

      const response = await this.claude.messages.create({
        model: "claude-3-5-haiku-latest",
        max_tokens: 10,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const contentBlock = response.content[0];
      if (!contentBlock || contentBlock.type !== 'text') {
        return 'general';
      }
      
      const result = contentBlock.text?.trim().toLowerCase();

      if (result === "specific" || result === "general") {
        return result;
      }

      // Fallback to general if unclear response
      return "general";
    } catch (error) {
      console.error("Intent detection failed:", error);
      // Fallback to general search on API failure
      return "general";
    }
  }

  // Cache frequently searched queries to reduce API calls
  private intentCache = new Map<
    string,
    { intent: "specific" | "general"; timestamp: number }
  >();
  private CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  async detectSearchIntentCached(
    query: string
  ): Promise<"specific" | "general"> {
    const normalizedQuery = query.toLowerCase().trim();
    const cached = this.intentCache.get(normalizedQuery);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.intent;
    }

    const intent = await this.detectSearchIntent(query);
    this.intentCache.set(normalizedQuery, { intent, timestamp: Date.now() });

    return intent;
  }
}
