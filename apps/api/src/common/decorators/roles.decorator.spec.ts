import { Roles, ROLES_KEY } from './roles.decorator';

describe('Roles decorator', () => {
  it('should set metadata with roles array', () => {
    const decorator = Roles('ADMIN', 'SUPER_ADMIN');
    expect(decorator).toBeDefined();
    expect(ROLES_KEY).toBe('roles');
  });
});
