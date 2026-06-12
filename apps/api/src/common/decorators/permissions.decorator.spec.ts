import { Permissions, PERMISSIONS_KEY } from './permissions.decorator';

describe('Permissions decorator', () => {
  it('should set metadata with permissions array', () => {
    const decorator = Permissions('read:users', 'write:users');
    expect(decorator).toBeDefined();
    expect(PERMISSIONS_KEY).toBe('permissions');
  });
});
