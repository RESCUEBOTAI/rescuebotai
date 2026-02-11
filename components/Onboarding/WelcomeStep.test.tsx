import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WelcomeStep from './WelcomeStep';

describe('WelcomeStep', () => {
  it('should render the title "RESCUEBOT.AI"', () => {
    const mockOnNext = vi.fn();
    render(<WelcomeStep onNext={mockOnNext} />);
    
    const title = screen.getByText('RESCUEBOT.AI');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-blue-400');
    expect(title).toHaveClass('font-mono');
  });

  it('should render the description text', () => {
    const mockOnNext = vi.fn();
    render(<WelcomeStep onNext={mockOnNext} />);
    
    // Check for key phrases from the mission briefing
    expect(screen.getByText(/autonomous rescue robot simulation platform/i)).toBeInTheDocument();
    expect(screen.getByText(/deploy AI-powered robots/i)).toBeInTheDocument();
    expect(screen.getByText(/navigate disaster zones/i)).toBeInTheDocument();
  });

  it('should render the "Launch Mission" button', () => {
    const mockOnNext = vi.fn();
    render(<WelcomeStep onNext={mockOnNext} />);
    
    const button = screen.getByRole('button', { name: /launch mission/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-600');
  });

  it('should call onNext callback when "Launch Mission" button is clicked', async () => {
    const mockOnNext = vi.fn();
    const user = userEvent.setup();
    
    render(<WelcomeStep onNext={mockOnNext} />);
    
    const button = screen.getByRole('button', { name: /launch mission/i });
    await user.click(button);
    
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('should render feature highlights', () => {
    const mockOnNext = vi.fn();
    render(<WelcomeStep onNext={mockOnNext} />);
    
    // Check for the feature highlights section
    expect(screen.getByText(/mission capabilities/i)).toBeInTheDocument();
    
    // Check for specific features
    expect(screen.getByText(/AI-Driven Navigation/i)).toBeInTheDocument();
    expect(screen.getByText(/Resource Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Strategic Planning/i)).toBeInTheDocument();
    expect(screen.getByText(/ROI Analytics/i)).toBeInTheDocument();
  });

  it('should render footer note', () => {
    const mockOnNext = vi.fn();
    render(<WelcomeStep onNext={mockOnNext} />);
    
    expect(screen.getByText(/configure your mission parameters in the next steps/i)).toBeInTheDocument();
  });
});
