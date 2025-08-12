import { render, screen } from '@testing-library/react';
import App from './App';

test('renders timer controls and labels', () => {
  render(<App />);
  expect(screen.getByRole('group', { name: /Timer controls/i })).toBeInTheDocument();
  expect(screen.getByText(/Focus|Break/)).toBeInTheDocument();
  expect(screen.getByRole('application', { name: /Pomodoro timer/i })).toBeInTheDocument();
});
