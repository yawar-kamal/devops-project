import { render, screen } from '@testing-library/react';
import App from './App';

// Smoke test for CI — full CRUD is covered by backend integration tests.
test('renders app title', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /todo/i })).toBeInTheDocument();
});
