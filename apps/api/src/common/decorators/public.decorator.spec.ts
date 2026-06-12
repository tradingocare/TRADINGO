import { SetMetadata } from '@nestjs/common';
import { Public, IS_PUBLIC_KEY } from './public.decorator';

describe('Public decorator', () => {
  it('should set metadata with key isPublic and value true', () => {
    const decorator = Public();
    expect(decorator).toBeDefined();
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });
});
