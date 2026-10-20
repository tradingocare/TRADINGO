import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

type MotionCall = { tag: string; props: Record<string, unknown> };

const mockMotionCalls: MotionCall[] = [];
const mockPush = jest.fn();

jest.mock('framer-motion', () => {
  const React = jest.requireActual('react');
  const motionPropNames = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'whileHover',
    'whileTap',
    'whileFocus',
    'whileDrag',
    'whileInView',
    'variants',
    'layout',
    'layoutId',
    'drag',
    'dragConstraints',
    'dragElastic',
    'onTap',
    'onTapStart',
    'onTapCancel',
    'onHoverStart',
    'onHoverEnd',
    'custom',
    'style',
  ]);

  const makeComponent = (tag: string) =>
    React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
      mockMotionCalls.push({ tag, props });
      const domProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props)) {
        if (!motionPropNames.has(key)) {
          domProps[key] = value;
        }
      }
      domProps.ref = ref;
      return React.createElement(tag, domProps);
    });

  const motion = new Proxy(
    {},
    {
      get: (_target, tag) => makeComponent(String(tag)),
    }
  );

  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useReducedMotion: jest.fn(() => true),
  };
});

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('next/link', () => {
  const React = jest.requireActual('react');
  const MockLink = React.forwardRef(
    (
      props: {
        href: string | { pathname?: string };
        children?: React.ReactNode;
        prefetch?: boolean;
        scroll?: boolean;
        replace?: boolean;
        shallow?: boolean;
        passHref?: boolean;
        legacyBehavior?: boolean;
        locale?: string;
        [key: string]: unknown;
      },
      ref: unknown
    ) => {
      const {
        href,
        children,
        prefetch: _prefetch,
        scroll: _scroll,
        replace: _replace,
        shallow: _shallow,
        passHref: _passHref,
        legacyBehavior: _legacyBehavior,
        locale: _locale,
        ...rest
      } = props;
      return React.createElement(
        'a',
        {
          href: typeof href === 'string' ? href : (href?.pathname ?? '#'),
          ref,
          ...rest,
        },
        children
      );
    }
  );
  return { __esModule: true, default: MockLink };
});

jest.mock('lucide-react', () => ({
  Mail: () => React.createElement('span', { 'data-testid': 'icon-mail' }),
  Menu: () => React.createElement('span', { 'data-testid': 'icon-menu' }),
  Phone: () => React.createElement('span', { 'data-testid': 'icon-phone' }),
  X: () => React.createElement('span', { 'data-testid': 'icon-x' }),
}));

jest.mock('@/components/shared/theme-toggle', () => ({
  ThemeToggle: () => React.createElement('button', { 'data-testid': 'theme-toggle' }),
}));

jest.mock('@/components/shared/tradingo-logo', () => ({
  TradingoLogoIcon: () => React.createElement('span', { 'data-testid': 'tradingo-logo' }),
}));

jest.mock('@/components/shared/social-icons', () => ({
  FacebookIcon: () => React.createElement('span', { 'data-testid': 'facebook-icon' }),
  LinkedInIcon: () => React.createElement('span', { 'data-testid': 'linkedin-icon' }),
  InstagramIcon: () => React.createElement('span', { 'data-testid': 'instagram-icon' }),
  YoutubeIcon: () => React.createElement('span', { 'data-testid': 'youtube-icon' }),
}));

import { useReducedMotion } from 'framer-motion';
import { Navbar } from '@/components/shared/navbar';

const mockedUseReducedMotion = jest.mocked(useReducedMotion);

describe('Navbar reduced-motion hydration contract', () => {
  beforeEach(() => {
    mockMotionCalls.length = 0;
    mockPush.mockReset();
    mockedUseReducedMotion.mockReset();
  });

  it.each([true, false])(
    'keeps whileHover/whileTap defined on every interactive nav item when useReducedMotion returns %s',
    (reducedMotion) => {
      mockedUseReducedMotion.mockReturnValue(reducedMotion);

      render(React.createElement(Navbar));

      const tapDrivenItems = mockMotionCalls.filter((call) => 'whileTap' in call.props);

      expect(tapDrivenItems).toHaveLength(9);
      for (const call of tapDrivenItems) {
        expect(call.props.whileHover).toBeDefined();
        expect(call.props.whileTap).toBeDefined();
      }
    }
  );

  it('uses reduce-safe gesture identities instead of removing tap handlers', () => {
    mockedUseReducedMotion.mockReturnValue(true);

    render(React.createElement(Navbar));

    const tapDrivenItems = mockMotionCalls.filter((call) => 'whileTap' in call.props);

    expect(tapDrivenItems.map((call) => call.props.whileTap)).toEqual(
      Array.from({ length: 9 }, () => ({ scale: 1 }))
    );
  });
});
