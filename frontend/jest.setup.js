import '@testing-library/jest-dom'

// Mock next/image since it's not available in the test environment
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />
  },
}))

// Mock framer-motion to avoid animation-related issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
  },
  AnimatePresence: ({ children }) => children,
  useMotionValue: () => ({
    set: jest.fn(),
  }),
  useSpring: () => ({
    set: jest.fn(),
  }),
  useTransform: () => ({
    set: jest.fn(),
  }),
})) 