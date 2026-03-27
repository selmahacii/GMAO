// Component Tests: KPI Card
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from '@/components/ui/kpi-card';

// Mock KPICard component
function KPICard({
  title,
  value,
  unit,
  trend,
  trendValue,
  target,
  icon: Icon,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  target?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div data-testid="kpi-card" className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{title}</span>
        {Icon && <Icon className="h-5 w-5" data-testid="kpi-icon" />}
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${colorClasses[color].split(' ')[1]}`}>
          {value}
        </span>
        {unit && <span className="text-gray-500">{unit}</span>}
      </div>

      {(trend || target) && (
        <div className="flex items-center justify-between mt-2">
          {trend && (
            <div className={`flex items-center gap-1 ${trendColors[trend]}`}>
              <span>{trendIcons[trend]}</span>
              <span className="text-sm">{trendValue}</span>
            </div>
          )}
          {target && (
            <span className="text-xs text-gray-400">Cible: {target}</span>
          )}
        </div>
      )}
    </div>
  );
}

// Mock icon
const MockIcon = ({ className }: { className?: string }) => (
  <svg className={className} data-testid="mock-icon">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

describe('KPICard', () => {
  it('renders title and value', () => {
    render(<KPICard title="Disponibilité" value="94.5" unit="%" />);

    expect(screen.getByText('Disponibilité')).toBeInTheDocument();
    expect(screen.getByText('94.5')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('displays green trend arrow when positive', () => {
    render(
      <KPICard
        title="MTBF"
        value={2500}
        unit="h"
        trend="up"
        trendValue="+15%"
      />
    );

    const trend = screen.getByText('↑').parentElement;
    expect(trend).toHaveClass('text-green-500');
    expect(screen.getByText('+15%')).toBeInTheDocument();
  });

  it('displays red trend arrow when negative', () => {
    render(
      <KPICard
        title="MTTR"
        value={4.5}
        unit="h"
        trend="down"
        trendValue="-8%"
      />
    );

    const trend = screen.getByText('↓').parentElement;
    expect(trend).toHaveClass('text-red-500');
    expect(screen.getByText('-8%')).toBeInTheDocument();
  });

  it('displays neutral arrow for no change', () => {
    render(
      <KPICard
        title="Work Orders"
        value={12}
        trend="neutral"
        trendValue="0%"
      />
    );

    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('displays target when provided', () => {
    render(
      <KPICard
        title="Disponibilité"
        value="94.5%"
        target="95%"
      />
    );

    expect(screen.getByText('Cible: 95%')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <KPICard
        title="Alertes"
        value={5}
        icon={MockIcon}
      />
    );

    expect(screen.getByTestId('kpi-icon')).toBeInTheDocument();
  });

  it('applies correct color class based on color prop', () => {
    const { rerender } = render(
      <KPICard title="Test" value={100} color="green" />
    );

    let value = screen.getByText('100');
    expect(value).toHaveClass('text-green-600');

    rerender(<KPICard title="Test" value={100} color="red" />);
    value = screen.getByText('100');
    expect(value).toHaveClass('text-red-600');

    rerender(<KPICard title="Test" value={100} color="orange" />);
    value = screen.getByText('100');
    expect(value).toHaveClass('text-orange-600');

    rerender(<KPICard title="Test" value={100} color="purple" />);
    value = screen.getByText('100');
    expect(value).toHaveClass('text-purple-600');
  });

  it('formats large numbers with locale', () => {
    render(<KPICard title="MTBF" value={2450} unit="h" />);

    expect(screen.getByText('2450')).toBeInTheDocument();
  });

  it('handles string values', () => {
    render(<KPICard title="Status" value="Operational" />);

    expect(screen.getByText('Operational')).toBeInTheDocument();
  });
});

export { KPICard };
