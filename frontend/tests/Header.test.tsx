import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '@/components/header';
import { useSession } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Header', () => {
  it('renders sign in button when not authenticated', () => {
    // Mock unauthenticated session
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<Header />);

    // Check if the sign in button is present
    expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy();
  });
});