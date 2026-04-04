import { TaskCategory, RecurrenceType } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

export interface AIRateLimitError extends Error {
  limitReached?: boolean;
}

const USER_API_KEY_STORAGE_KEY = 'user-gemini-api-key';

function getUserAI() {
  const apiKey = localStorage.getItem(USER_API_KEY_STORAGE_KEY);
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export async function parseVoiceTask(transcript: string): Promise<{
  title: string;
  description: string;
  category: TaskCategory;
  duration: number;
  recurrence: RecurrenceType;
  bandwidthScore: number;
}> {
  const ai = getUserAI();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Parse the following task description into a structured JSON object.
        Transcript: "${transcript}"
        
        Rules:
        - title: Short, concise title.
        - description: Brief context if any.
        - category: One of: "Deep Work", "Shallow Work", "Meetings", "Learning", "Personal", "Admin".
        - duration: Estimated minutes (number).
        - recurrence: One of: "none", "daily", "weekly", "monthly".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING, enum: ["Deep Work", "Shallow Work", "Meetings", "Learning", "Personal", "Admin"] },
              duration: { type: Type.NUMBER },
              recurrence: { type: Type.STRING, enum: ["none", "daily", "weekly", "monthly"] },
            },
            required: ["title", "description", "category", "duration", "recurrence"]
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      return {
        ...result,
        bandwidthScore: estimateBandwidth(result.title, result.description, result.category, result.duration)
      };
    } catch (error) {
      console.error("User AI parse failed", error);
    }
  }

  try {
    const response = await fetch("/api/ai/parse-voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });

    if (response.status === 429) {
      const error: AIRateLimitError = new Error("Rate limit exceeded");
      error.limitReached = true;
      throw error;
    }

    if (!response.ok) throw new Error("Failed to parse voice task");
    return await response.json();
  } catch (error) {
    if ((error as AIRateLimitError).limitReached) throw error;
    
    // Fallback to local heuristics if API fails for other reasons
    console.warn("AI Proxy failed, falling back to local heuristics", error);
    return localHeuristicParse(transcript);
  }
}

export async function getDailyInsights(tasks: any[]): Promise<string> {
  if (!tasks || tasks.length === 0) return "Plan your day to see insights.";

  const ai = getUserAI();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze these tasks and provide a brief (2-3 sentences) cognitive load insight for the day.
        Tasks: ${JSON.stringify(tasks)}`,
      });
      return response.text || "No insights generated.";
    } catch (error) {
      console.error("User AI insights failed", error);
    }
  }

  try {
    const response = await fetch("/api/ai/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks }),
    });

    if (response.status === 429) {
      return "Rate limit reached. Join our waitlist for unlimited AI insights!";
    }

    if (!response.ok) throw new Error("Failed to get insights");
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.warn("AI Proxy failed, falling back to local insights", error);
    return localHeuristicInsights(tasks);
  }
}

export async function getOptimizationSuggestions(tasks: any[]): Promise<string> {
  if (!tasks || tasks.length === 0) return "Add tasks to see optimization suggestions.";

  const ai = getUserAI();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Suggest 3 ways to optimize this schedule for better cognitive performance.
        Tasks: ${JSON.stringify(tasks)}`,
      });
      return response.text || "No suggestions generated.";
    } catch (error) {
      console.error("User AI optimization failed", error);
    }
  }

  try {
    const response = await fetch("/api/ai/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks }),
    });

    if (response.status === 429) {
      return "Rate limit reached. Join our waitlist for unlimited optimization suggestions!";
    }

    if (!response.ok) throw new Error("Failed to get optimization suggestions");
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.warn("AI Proxy failed, falling back to local suggestions", error);
    return localHeuristicSuggestions(tasks);
  }
}

// Local Heuristics (Fallbacks)
function localHeuristicParse(transcript: string) {
  const lowerTranscript = transcript.toLowerCase();
  let category: TaskCategory = 'Shallow Work';
  if (lowerTranscript.includes('deep work') || lowerTranscript.includes('focus') || lowerTranscript.includes('code') || lowerTranscript.includes('write')) category = 'Deep Work';
  else if (lowerTranscript.includes('meeting') || lowerTranscript.includes('call') || lowerTranscript.includes('sync')) category = 'Meetings';
  else if (lowerTranscript.includes('learn') || lowerTranscript.includes('read') || lowerTranscript.includes('study')) category = 'Learning';
  else if (lowerTranscript.includes('admin') || lowerTranscript.includes('email') || lowerTranscript.includes('organize')) category = 'Admin';
  else if (lowerTranscript.includes('personal') || lowerTranscript.includes('break') || lowerTranscript.includes('lunch')) category = 'Personal';

  let recurrence: RecurrenceType = 'none';
  if (lowerTranscript.includes('every day') || lowerTranscript.includes('daily')) recurrence = 'daily';
  else if (lowerTranscript.includes('every week') || lowerTranscript.includes('weekly')) recurrence = 'weekly';
  else if (lowerTranscript.includes('every month') || lowerTranscript.includes('monthly')) recurrence = 'monthly';

  let duration = 60;
  const minMatch = lowerTranscript.match(/(\d+)\s*(min|minute)/);
  const hourMatch = lowerTranscript.match(/(\d+)\s*(hour|hr)/);
  if (minMatch) duration = parseInt(minMatch[1], 10);
  else if (hourMatch) duration = parseInt(hourMatch[1], 10) * 60;

  let title = transcript
    .replace(/\b(every day|daily|every week|weekly|every month|monthly)\b/gi, '')
    .replace(/\b(\d+)\s*(min|minute|minutes|hour|hours|hr|hrs)\b/gi, '')
    .replace(/\b(for|a|an|the)\b/gi, '')
    .trim();
  
  title = title.charAt(0).toUpperCase() + title.slice(1);
  if (!title) title = "New Task";

  return {
    title,
    description: `Parsed locally: "${transcript}"`,
    category,
    duration,
    recurrence,
    bandwidthScore: estimateBandwidth(title, transcript, category, duration)
  };
}

function localHeuristicInsights(tasks: any[]) {
  const totalBandwidth = tasks.reduce((sum, t) => sum + (t.bandwidthScore || 0), 0);
  let insight = `You have ${tasks.length} tasks scheduled totaling ${totalBandwidth} bandwidth points. `;
  if (totalBandwidth > 35) insight += "This is a heavy cognitive load; ensure you take adequate breaks.";
  else if (totalBandwidth < 15) insight += "Your load is light today, a good opportunity for deep focus.";
  else insight += "Your cognitive load is well-balanced for the day.";
  return insight;
}

function localHeuristicSuggestions(tasks: any[]) {
  const suggestions: string[] = [];
  const totalBandwidth = tasks.reduce((sum, t) => sum + (t.bandwidthScore || 0), 0);
  if (totalBandwidth > 30) suggestions.push("1. Consider moving at least one low-priority task to tomorrow.");
  else suggestions.push("1. Your schedule is balanced. Consider tackling your hardest task first.");
  suggestions.push("2. Group your meetings together to create larger, uninterrupted blocks.");
  suggestions.push("3. You haven't scheduled any personal breaks. Add a 15-minute walk.");
  return suggestions.join('\n\n');
}

export function estimateBandwidth(title: string, description: string, category: TaskCategory, durationMinutes: number): number {
  let baseScore = 5;
  switch (category) {
    case 'Deep Work': baseScore = 8; break;
    case 'Learning': baseScore = 7; break;
    case 'Meetings': baseScore = 5; break;
    case 'Shallow Work': baseScore = 3; break;
    case 'Admin': baseScore = 3; break;
    case 'Personal': baseScore = 1; break;
  }
  if (durationMinutes > 90) baseScore += 2;
  else if (durationMinutes > 60) baseScore += 1;
  else if (durationMinutes < 30) baseScore -= 1;
  const text = (title + " " + description).toLowerCase();
  if (text.includes('complex') || text.includes('hard') || text.includes('architecture')) baseScore += 2;
  if (text.includes('quick') || text.includes('easy') || text.includes('simple')) baseScore -= 1;
  return Math.min(Math.max(baseScore, 1), 10);
}
