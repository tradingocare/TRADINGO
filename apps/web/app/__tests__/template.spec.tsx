import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import { render } from '@testing-library/react';

const mockTemplateWrapper = ({ children }: { children?: ReactNode }) => (
  <div data-testid="template-wrapper">{children}</div>
);

jest.mock('framer-motion', () => ({
  useReducedMotion: jest.fn(),
  motion: { div: mockTemplateWrapper },
}));

import { useReducedMotion } from 'framer-motion';
import Template from '@/app/template';

const mockUseReducedMotion = jest.mocked(useReducedMotion);

describe('Template — server/client hydration parity', () => {
  beforeEach(() => {
    mockUseReducedMotion.mockReset();
  });

  it.each([true, false, null])(
    'renders the same wrapper element when useReducedMotion returns %s',
    (value) => {
      mockUseReducedMotion.mockReturnValue(value);
      const { container } = render(
        <Template>
          <p>child</p>
        </Template>,
      );
      const wrapper = container.querySelector('[data-testid="template-wrapper"]');
      expect(wrapper).not.toBeNull();
      expect(wrapper?.querySelector('p')?.textContent).toBe('child');
    },
  );
});
