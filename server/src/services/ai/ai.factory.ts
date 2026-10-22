import { AIProvider } from './ai.interface';
import { GroqProvider } from './groq.provider';
import { MockAIProvider } from './mock.provider';

export class AIFactory {
  private static instance: AIProvider | null = null;

  public static getProvider(): AIProvider {
    if (this.instance) {
      return this.instance;
    }

    if (process.env.NODE_ENV === 'test' || process.env.USE_MOCK_AI === 'true') {
      this.instance = new MockAIProvider();
      return this.instance;
    }

    if (!process.env.GROQ_API_KEY) {
      throw new Error('AI hint service is not configured.');
    }

    this.instance = new GroqProvider();
    return this.instance;
  }

  // Mostly for testing purposes
  public static resetProvider() {
    this.instance = null;
  }
}
