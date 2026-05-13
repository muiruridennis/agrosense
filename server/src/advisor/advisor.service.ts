// src/advisor/advisor.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `You are AgroSense Advisor, an expert AI assistant for farmers in Africa and beyond. You have deep expertise in:

- Crop farming: planting schedules, soil health, pest & disease management, irrigation, fertilization, harvest timing
- Livestock management: cattle, goats, sheep, poultry — health, feeding, breeding, disease prevention
- Weather interpretation: how to adapt farming decisions based on rainfall, temperature, drought, or floods
- Market prices: commodity pricing trends, when to sell, how to negotiate, storage strategies to maximize profit

You give practical, actionable advice tailored to smallholder and commercial farmers. Be concise but thorough. When relevant, mention specific varieties, dosages, timings, or local context for East Africa (Kenya, Tanzania, Uganda, Ethiopia). Use simple language — farmers are your audience, not agronomists.

Always end responses with a short follow-up question or prompt to continue the conversation naturally.`;

@Injectable()
export class AdvisorService {
  private readonly logger = new Logger(AdvisorService.name);
  private readonly groq: Groq;

  constructor(private readonly config: ConfigService) {
    this.groq = new Groq({
      apiKey: this.config.getOrThrow<string>('GROQ_API_KEY'),
    });
  }

  async streamChat(
    messages: { role: 'user' | 'assistant'; content: string }[],
    res: Response,
  ): Promise<void> {
    const stream = await this.groq.chat.completions.create({
      model: 'llama3-70b-8192',
      max_tokens: 1024,
      stream: true,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    });

    for await (const chunk of stream) {
      if (res.destroyed) break;

      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        res.write(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`);
      }

      if (chunk.choices[0]?.finish_reason === 'stop') {
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        break;
      }
    }

    res.end();
  }
}
