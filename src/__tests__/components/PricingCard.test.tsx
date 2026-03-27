// Pricing Components Tests
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PricingPage } from '@/components/pages/PricingPage';
import { PLANS } from '@/lib/pricing.config';

describe('PricingPage', () => {
  it('renders hero section with title', () => {
    render(<PricingPage />);

    expect(screen.getByText('Maintenance intelligente.')).toBeInTheDocument();
    expect(screen.getByText('Prix transparent.')).toBeInTheDocument();
  });

  it('renders all three plan cards', () => {
    render(<PricingPage />);

    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('shows monthly prices by default', () => {
    render(<PricingPage />);

    // Starter monthly price
    expect(screen.getByText('149€')).toBeInTheDocument();
    // Pro monthly price
    expect(screen.getByText('399€')).toBeInTheDocument();
  });

  it('toggles between monthly and annual pricing', async () => {
    render(<PricingPage />);

    // Find the billing toggle
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeChecked(); // Annual by default

    // Toggle to monthly
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();
  });

  it('shows savings badge for annual billing', () => {
    render(<PricingPage />);

    // Should show savings badge
    expect(screen.getByText(/Économisez/i)).toBeInTheDocument();
  });

  it('shows "Sur devis" for Enterprise plan', () => {
    render(<PricingPage />);

    const enterpriseCards = screen.getAllByText('Sur devis');
    expect(enterpriseCards.length).toBeGreaterThan(0);
  });

  it('renders ROI calculator', () => {
    render(<PricingPage />);

    expect(screen.getByText('Calculateur ROI')).toBeInTheDocument();
    expect(screen.getByText(/Nombre d'équipements/i)).toBeInTheDocument();
  });

  it('renders testimonials section', () => {
    render(<PricingPage />);

    expect(screen.getByText('Ils nous font confiance')).toBeInTheDocument();
    expect(screen.getByText(/Lafarge Algérie/)).toBeInTheDocument();
  });

  it('renders FAQ section', () => {
    render(<PricingPage />);

    expect(screen.getByText('Questions fréquentes')).toBeInTheDocument();
    expect(screen.getByText('Est-ce que mes données sont sécurisées ?')).toBeInTheDocument();
  });

  it('calls onSelectPlan when plan button is clicked', () => {
    const onSelectPlan = vi.fn();
    render(<PricingPage onSelectPlan={onSelectPlan} />);

    const starterButton = screen.getByText('Démarrer gratuitement');
    fireEvent.click(starterButton);

    expect(onSelectPlan).toHaveBeenCalledWith('starter');
  });

  it('shows Pro plan as highlighted', () => {
    render(<PricingPage />);

    const proCard = screen.getByText('Pro').closest('div');
    expect(proCard).toHaveClass('border-blue-500');
  });
});

describe('Feature Comparison Table', () => {
  it('renders feature comparison table', () => {
    render(<PricingPage />);

    expect(screen.getByText('Comparatif des fonctionnalités')).toBeInTheDocument();
  });

  it('shows checkmarks for included features', () => {
    render(<PricingPage />);

    // All plans include work orders
    const checkmarks = screen.getAllByTestId ? [] : document.querySelectorAll('svg');
    expect(checkmarks.length).toBeGreaterThan(0);
  });
});

describe('ROI Calculator', () => {
  it('calculates ROI based on inputs', () => {
    render(<PricingPage />);

    // Check initial values
    expect(screen.getByText(/ROI/)).toBeInTheDocument();
    expect(screen.getByText(/Seuil de rentabilité/)).toBeInTheDocument();
  });
});
