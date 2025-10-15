import Groq from "groq-sdk";
import { getJson } from "serpapi";


type SerpApiResult = {
  organic_results?: {
    snippet?: string;
  }[];
};

type ClientMessagePart = {
  type: string;
  text?: string;
};

type ClientMessage = {
  role: "user" | "assistant";
  parts: ClientMessagePart[];
};

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: {
    id: string;
    function: {
      name: string;
      arguments: string;
    };
  }[];
};


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });



// -------- Web Search Tool -------- //
const webSearch = async ({ query }: { query: string }): Promise<string> => {
  console.log("Calling Web Search for:", query);
  return new Promise((resolve, reject) => {
    getJson(
      {
        engine: "google",
        q: query,
        api_key: process.env.SERP_API_KEY,
      },
      (json: SerpApiResult) => {
        try {
          const result = json.organic_results;
          if (!result || result.length === 0) {
            resolve("No search results found.");
            return;
          }

          const finalResults = result
            .slice(0, 5)
            .map((r) => r.snippet || "")
            .join("\n\n");

          resolve(finalResults);
        } catch (error) {
          console.error("Web search error:", error);
          reject(error);
        }
      }
    );
  });
};



// -------- API Route -------- //
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clientMessages: ClientMessage[] = body.messages || [];

    const conversationMessages: ChatMessage[] = clientMessages
      .map((msg) => {
        if (msg.role === "user") {
          const content = msg.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text || "")
            .join("");
          return { role: "user", content };
        } else if (msg.role === "assistant") {
          const content =
            msg.parts
              ?.filter((part) => part.type === "text")
              .map((part) => part.text || "")
              .join("") || "";
          return { role: "assistant", content };
        }
        return null;
      })
      .filter((m): m is ChatMessage => m !== null);

    const systemMessage: ChatMessage = {
      role: "system",
      content: `You are a smart, efficient and friendly personal assistant.
      Give clear, accurate, and to-the-point answers without adding extra information. 
      If something isn’t clear, politely ask for clarification. 
      Current date and time: ${new Date().toUTCString()}`,
    };

    const messages: ChatMessage[] = [systemMessage, ...conversationMessages];

    // ---- Main Tool-Calling Loop ---- //
    while (true) {
      console.log("Making API call...");

      const chatCompletion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        temperature: 0,
        // eslint-disable-next-line
        messages: messages as any,
        tools: [
          {
            type: "function",
            function: {
              name: "webSearch",
              description: `Use this tool to search the web for up-to-date or missing information when the model’s internal knowledge is insufficient,
              outdated, or uncertain. Ideal for real-time data, current events, niche topics, or specific factual queries.`,
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "A clear and concise search query describing what information to look for on the web.",
                  },
                },
                required: ["query"],
              },
            },
          },
        ],
        tool_choice: "auto",
      });

      const assistantMessage = chatCompletion.choices[0]?.message;

      console.log("Assistant message:", assistantMessage);

      if (assistantMessage) {
        messages.push({
          role: assistantMessage.role as ChatMessage["role"],
          content: assistantMessage.content || "",
          ...(assistantMessage.tool_calls && {
            tool_calls: assistantMessage.tool_calls as ChatMessage["tool_calls"],
          }),
        });
      }

      const toolCalls = assistantMessage?.tool_calls;

      // ---- If no tool calls, return final answer ---- //
      if (!toolCalls || toolCalls.length === 0) {
        const content = assistantMessage?.content || "";
        console.log("Final content:", content);

        return Response.json({
          role: "assistant",
          content: content,
          reasoning: (assistantMessage)?.reasoning || "",
        });
      }

      // ---- Handle Tool Calls ---- //
      console.log("Handling tool calls...");
      for (const tool of toolCalls) {
        if (tool.function.name === "webSearch") {
          const args = JSON.parse(tool.function.arguments) as { query: string };
          console.log("Searching for:", args.query);

          const toolResult = await webSearch(args);
          console.log("Search result length:", toolResult.length);

          messages.push({
            tool_call_id: tool.id,
            role: "tool",
            name: tool.function.name,
            content: toolResult,
          });
        }
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("API error:", error);
      return Response.json(
        { error: error.message || "An error occurred" },
        { status: 500 }
      );
    }
    console.error("Unknown error:", error);
    return Response.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}