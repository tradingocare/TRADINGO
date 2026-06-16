import { ChatFilterService } from './chat-filter.service';

describe('ChatFilterService', () => {
  let service: ChatFilterService;

  beforeEach(() => {
    service = new ChatFilterService();
  });

  describe('hasProfanity', () => {
    it('should detect profanity', () => {
      expect(service.hasProfanity('this is shit')).toBe(true);
    });

    it('should return false for clean text', () => {
      expect(service.hasProfanity('hello world')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(service.hasProfanity('SHIT')).toBe(true);
    });
  });

  describe('filterProfanity', () => {
    it('should replace profanity with asterisks', () => {
      const result = service.filterProfanity('this is shit');
      expect(result).toBe('this is ****');
    });
  });

  describe('containsPhone', () => {
    it('should detect phone numbers', () => {
      expect(service.containsPhone('call me at 1234567890')).toBe(true);
    });

    it('should detect indian phone numbers', () => {
      expect(service.containsPhone('+919876543210')).toBe(true);
    });

    it('should detect phone with separators', () => {
      expect(service.containsPhone('123-456-7890')).toBe(true);
      expect(service.containsPhone('+91 9876543210')).toBe(true);
    });

    it('should return false for text without phone', () => {
      expect(service.containsPhone('hello world')).toBe(false);
    });
  });

  describe('containsEmail', () => {
    it('should detect email addresses', () => {
      expect(service.containsEmail('email me at test@example.com')).toBe(true);
    });

    it('should return false for text without email', () => {
      expect(service.containsEmail('hello world')).toBe(false);
    });
  });

  describe('detectSensitiveContent', () => {
    it('should detect all sensitive content', () => {
      const result = service.detectSensitiveContent('contact test@example.com or +91 9876543210 this is shit');
      expect(result.hasEmail).toBe(true);
      expect(result.hasPhone).toBe(true);
      expect(result.hasProfanity).toBe(true);
    });
  });
});
