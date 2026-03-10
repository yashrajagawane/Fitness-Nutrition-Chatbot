import { NextResponse } from "next/server";

/*
 VITALIS AI - FITNESS & NUTRITION ENGINE
 Backend Chat API for the Vitalis AI Fitness Coach
*/

export async function POST(req: Request) {
  try {

    const body = await req.json();
    const { message, history } = body;

    // Basic validation
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message must be a valid string." },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message too long." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY");
      return NextResponse.json(
        { error: "AI configuration error." },
        { status: 500 }
      );
    }

    /*
      Use stable Gemini model
    */
    const GEMINI_URL =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Limit conversation memory
    const recentHistory = (history || []).slice(-10);

    const contents = recentHistory.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const payload = {
      contents,

      systemInstruction: {
        role: "system",
        parts: [
          {
            text: `
You are **Vitalis**, an elite AI Fitness Coach and Sports Nutrition Specialist.

EXPERTISE:
• Workout programming (strength, hypertrophy, HIIT)
• Weight loss and fat burning strategies
• Sports nutrition and macros
• Supplement science
• Recovery and lifestyle wellness

STYLE:
• Professional and motivating
• Use bullet points and headings
• Use Markdown tables for workout or diet plans

DOMAIN RESTRICTION:
If the user asks unrelated topics respond:
"As your personal fitness coach, I specialize exclusively in health, training, and nutrition. Let's focus on your physical goals."

SAFETY RULES:
• Never give medical diagnosis
• Recommend consulting professionals for injuries or medical issues

MANDATORY DISCLAIMER:
Append this text at the end of every answer:

---
*Disclaimer: This guidance is for educational purposes and should not replace advice from certified medical or fitness professionals.*
`
          }
        ]
      },

      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      },

      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    // Timeout protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API error:", err);

      return NextResponse.json(
        { error: "AI service failed to respond." },
        { status: 500 }
      );
    }

    const data = await response.json();

    const candidate = data?.candidates?.[0];

    const reply =
      candidate?.content?.parts?.[0]?.text ||
      "I couldn't generate a fitness response at the moment.";

    return NextResponse.json({
      reply,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {

    console.error("Vitalis API error:", error);

    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "The AI coach took too long to respond." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}