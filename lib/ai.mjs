/**
 * Gemini API で受講生のメッセージに対する回答を生成する
 * システムプロンプトはスプシから取得したものを受け取る
 */

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(PROJECT_ROOT, ".env") });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

/**
 * 受講生のメッセージに対する回答を生成する
 * @param {string} userMessage - 受講生のメッセージ
 * @param {string} systemPrompt - スプシから取得したシステムプロンプト
 * @param {Array} knowledge - スプシから取得したQ&Aペア
 * @param {Array} recentMessages - 直近の会話履歴
 */
export async function generateReply(userMessage, systemPrompt, knowledge = [], recentMessages = []) {
  const knowledgeContext = knowledge.length > 0
    ? `\n\n## 参考: ナレッジベース\n${knowledge.slice(-30).map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n---\n")}`
    : "";

  const conversationContext = recentMessages.length > 0
    ? `\n\n## 直近の会話履歴\n${recentMessages.map(m => `${m.role}: ${m.content}`).join("\n")}`
    : "";

  const fullSystemPrompt = systemPrompt + knowledgeContext + conversationContext;

  const interaction = await ai.interactions.create({
    model: MODEL,
    input: userMessage,
    system_instruction: fullSystemPrompt,
  });

  const text = interaction.output_text?.trim();

  if (!text) {
    console.error("[generateReply] 空の応答", JSON.stringify(interaction).slice(0, 500));
    return "うまく回答を作れませんでした…もう一度質問してみてもらえますか？🙏";
  }

  return text;
}
