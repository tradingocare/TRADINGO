import { ValidationPipe } from './validation.pipe';

describe('ValidationPipe', () => {
  it('should be defined', () => {
    const pipe = new ValidationPipe();
    expect(pipe).toBeDefined();
  });
});
