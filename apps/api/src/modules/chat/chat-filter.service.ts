import { Injectable, Logger } from '@nestjs/common';

const BAD_WORDS = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'bastard', 'crap', 'dick',
  'piss', 'slut', 'whore', 'cock', 'cunt', 'douche', 'fag', 'nigger',
  'motherfucker', 'asshole', 'dumbass', 'bullshit', 'goddamn',
];

const HAS_PHONE = /\d{10,}/;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

@Injectable()
export class ChatFilterService {
  private readonly logger = new Logger(ChatFilterService.name);

  hasProfanity(text: string): boolean {
    const lower = text.toLowerCase();
    return BAD_WORDS.some((word) => lower.includes(word));
  }

  filterProfanity(text: string): string {
    let result = text.toLowerCase();
    for (const word of BAD_WORDS) {
      const regex = new RegExp(word, 'gi');
      result = result.replace(regex, '*'.repeat(word.length));
    }
    return result;
  }

  containsPhone(text: string): boolean {
    const stripped = text.replace(/[-.\s()]/g, '');
    return HAS_PHONE.test(stripped);
  }

  containsEmail(text: string): boolean {
    return EMAIL_REGEX.test(text);
  }

  detectSensitiveContent(text: string): { hasPhone: boolean; hasEmail: boolean; hasProfanity: boolean } {
    return {
      hasPhone: this.containsPhone(text),
      hasEmail: this.containsEmail(text),
      hasProfanity: this.hasProfanity(text),
    };
  }

  sanitizeMessage(text: string): string {
    let sanitized = this.filterProfanity(text);
    return sanitized;
  }
}
