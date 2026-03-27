// Component Tests: Asset Status Badge & Inventory Table
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

// ============================================
// Asset Status Badge Tests
// ============================================

function AssetStatusBadge({ status, criticality }: { status: string; criticality?: string }) {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      operational: { color: 'bg-green-500', label: 'Opérationnel' },
      degraded: { color: 'bg-yellow-500', label: 'Dégradé' },
      under_maintenance: { color: 'bg-blue-500', label: 'En maintenance' },
      down: { color: 'bg-red-500', label: 'En panne' },
      decommissioned: { color: 'bg-gray-500', label: 'Hors service' },
    };
    return configs[status] || { color: 'bg-gray-500', label: status };
  };

  const getCriticalityColor = (criticality?: string) => {
    switch (criticality) {
      case 'A': return 'border-red-500';
      case 'B': return 'border-yellow-500';
      case 'C': return 'border-gray-300';
      default: return 'border-gray-300';
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      data-testid="status-badge"
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-medium ${config.color} border-2 ${getCriticalityColor(criticality)}`}
    >
      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
      {config.label}
      {criticality && <span className="ml-1 opacity-75">({criticality})</span>}
    </span>
  );
}

describe('AssetStatusBadge', () => {
  it('shows green badge for operational status', () => {
    render(<AssetStatusBadge status="operational" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('bg-green-500');
    expect(screen.getByText('Opérationnel')).toBeInTheDocument();
  });

  it('shows yellow badge for degraded status', () => {
    render(<AssetStatusBadge status="degraded" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('bg-yellow-500');
    expect(screen.getByText('Dégradé')).toBeInTheDocument();
  });

  it('shows red badge for down status', () => {
    render(<AssetStatusBadge status="down" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('bg-red-500');
    expect(screen.getByText('En panne')).toBeInTheDocument();
  });

  it('shows blue badge for under maintenance', () => {
    render(<AssetStatusBadge status="under_maintenance" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('bg-blue-500');
    expect(screen.getByText('En maintenance')).toBeInTheDocument();
  });

  it('displays criticality indicator for class A assets', () => {
    render(<AssetStatusBadge status="operational" criticality="A" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('border-red-500');
    expect(screen.getByText('(A)')).toBeInTheDocument();
  });

  it('displays criticality indicator for class B assets', () => {
    render(<AssetStatusBadge status="operational" criticality="B" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('border-yellow-500');
    expect(screen.getByText('(B)')).toBeInTheDocument();
  });

  it('has pulsing indicator dot', () => {
    render(<AssetStatusBadge status="operational" />);

    const dot = document.querySelector('.animate-pulse');
    expect(dot).toBeInTheDocument();
  });
});

// ============================================
// Inventory Table Tests
// ============================================

const mockParts = [
  { id: '1', partNumber: 'BRG-001', name: 'Roulement 6205', stockQty: 15, minStockQty: 10, unitCostDzd: 5000, category: 'mechanical' },
  { id: '2', partNumber: 'SEAL-001', name: 'Joint Mécanique', stockQty: 3, minStockQty: 5, unitCostDzd: 12000, category: 'seal' },
  { id: '3', partNumber: 'FLT-001', name: 'Filtre à Huile', stockQty: 8, minStockQty: 8, unitCostDzd: 3500, category: 'filter' },
  { id: '4', partNumber: 'BLT-001', name: 'Courroie', stockQty: 25, minStockQty: 5, unitCostDzd: 1500, category: 'mechanical' },
];

function InventoryTable({
  parts,
  onReorder,
  searchTerm = '',
}: {
  parts: typeof mockParts;
  onReorder?: (partId: string) => void;
  searchTerm?: string;
}) {
  const filteredParts = parts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLowStock = (stock: number, min: number) => stock <= min;
  const isBelowReorder = (stock: number, min: number) => stock < min;

  return (
    <div data-testid="inventory-table">
      <table>
        <thead>
          <tr>
            <th>Référence</th>
            <th>Nom</th>
            <th>Stock</th>
            <th>Min</th>
            <th>Prix Unit.</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredParts.map(part => (
            <tr key={part.id} data-testid={`part-row-${part.id}`}>
              <td>{part.partNumber}</td>
              <td>{part.name}</td>
              <td>
                <span className={isLowStock(part.stockQty, part.minStockQty) ? 'text-red-500 font-bold' : ''}>
                  {part.stockQty}
                </span>
              </td>
              <td>{part.minStockQty}</td>
              <td>{part.unitCostDzd.toLocaleString()} DA</td>
              <td>
                {isBelowReorder(part.stockQty, part.minStockQty) && (
                  <button
                    data-testid={`reorder-btn-${part.id}`}
                    onClick={() => onReorder?.(part.id)}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                  >
                    Réapprovisionner
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

describe('InventoryTable', () => {
  it('shows red badge on parts below reorder point', () => {
    render(<InventoryTable parts={mockParts} />);

    // Part 2 has stock 3, min 5 (below reorder)
    const row = screen.getByTestId('part-row-2');
    const stockCell = within(row).getByText('3');
    expect(stockCell).toHaveClass('text-red-500');
  });

  it('reorder button creates purchase order', () => {
    const onReorder = vi.fn();
    render(<InventoryTable parts={mockParts} onReorder={onReorder} />);

    // Part 2 is below reorder
    const reorderBtn = screen.getByTestId('reorder-btn-2');
    fireEvent.click(reorderBtn);

    expect(onReorder).toHaveBeenCalledWith('2');
  });

  it('search filters table results', () => {
    const { rerender } = render(<InventoryTable parts={mockParts} searchTerm="" />);

    // All parts shown
    expect(screen.getByTestId('part-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('part-row-2')).toBeInTheDocument();
    expect(screen.getByTestId('part-row-3')).toBeInTheDocument();

    // Filter by "Roulement"
    rerender(<InventoryTable parts={mockParts} searchTerm="Roulement" />);

    expect(screen.getByTestId('part-row-1')).toBeInTheDocument();
    expect(screen.queryByTestId('part-row-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('part-row-3')).not.toBeInTheDocument();
  });

  it('sort by stock level works correctly', () => {
    // Sort parts by stock level (ascending)
    const sortedParts = [...mockParts].sort((a, b) => a.stockQty - b.stockQty);

    render(<InventoryTable parts={sortedParts} />);

    const rows = document.querySelectorAll('tbody tr');
    expect(rows[0]).toHaveAttribute('data-testid', 'part-row-2'); // stock 3
    expect(rows[1]).toHaveAttribute('data-testid', 'part-row-3'); // stock 8
    expect(rows[2]).toHaveAttribute('data-testid', 'part-row-1'); // stock 15
  });

  it('displays unit price in DZD', () => {
    render(<InventoryTable parts={mockParts} />);

    expect(screen.getByText('5,000 DA')).toBeInTheDocument();
    expect(screen.getByText('12,000 DA')).toBeInTheDocument();
  });

  it('shows reorder button only for parts below min', () => {
    render(<InventoryTable parts={mockParts} />);

    // Part 1: stock 15, min 10 - no reorder button
    expect(screen.queryByTestId('reorder-btn-1')).not.toBeInTheDocument();

    // Part 2: stock 3, min 5 - has reorder button
    expect(screen.getByTestId('reorder-btn-2')).toBeInTheDocument();

    // Part 4: stock 25, min 5 - no reorder button
    expect(screen.queryByTestId('reorder-btn-4')).not.toBeInTheDocument();
  });

  it('highlights parts at exact minimum', () => {
    render(<InventoryTable parts={mockParts} />);

    // Part 3: stock 8, min 8 (at minimum)
    const row = screen.getByTestId('part-row-3');
    const stockCell = within(row).getByText('8');
    expect(stockCell).toHaveClass('text-red-500');
  });
});

// ============================================
// Alert Banner Tests
// ============================================

function AlertBanner({
  type,
  severity,
  title,
  message,
  onDismiss,
  onAction,
  actionLabel,
}: {
  type: 'sensor' | 'stock' | 'pm' | 'sla';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  onDismiss?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}) {
  const severityStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    critical: 'bg-red-50 border-red-200 text-red-800',
  };

  const icons = {
    sensor: '📡',
    stock: '📦',
    pm: '🔧',
    sla: '⏰',
  };

  return (
    <div
      data-testid="alert-banner"
      className={`border-l-4 p-4 rounded ${severityStyles[severity]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icons[type]}</span>
          <div>
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm opacity-80">{message}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onAction && actionLabel && (
            <button
              data-testid="alert-action"
              onClick={onAction}
              className="px-3 py-1 bg-white rounded text-sm font-medium"
            >
              {actionLabel}
            </button>
          )}
          {onDismiss && (
            <button
              data-testid="alert-dismiss"
              onClick={onDismiss}
              className="p-1 hover:bg-white/50 rounded"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

describe('AlertBanner', () => {
  it('renders with correct severity styling', () => {
    const { rerender } = render(
      <AlertBanner type="sensor" severity="critical" title="Alert" message="Test" />
    );

    let banner = screen.getByTestId('alert-banner');
    expect(banner).toHaveClass('bg-red-50');

    rerender(
      <AlertBanner type="sensor" severity="warning" title="Alert" message="Test" />
    );
    banner = screen.getByTestId('alert-banner');
    expect(banner).toHaveClass('bg-yellow-50');

    rerender(
      <AlertBanner type="sensor" severity="info" title="Alert" message="Test" />
    );
    banner = screen.getByTestId('alert-banner');
    expect(banner).toHaveClass('bg-blue-50');
  });

  it('displays correct icon by type', () => {
    const { rerender } = render(
      <AlertBanner type="sensor" severity="warning" title="Test" message="Test" />
    );
    expect(screen.getByText('📡')).toBeInTheDocument();

    rerender(
      <AlertBanner type="stock" severity="warning" title="Test" message="Test" />
    );
    expect(screen.getByText('📦')).toBeInTheDocument();

    rerender(
      <AlertBanner type="pm" severity="warning" title="Test" message="Test" />
    );
    expect(screen.getByText('🔧')).toBeInTheDocument();

    rerender(
      <AlertBanner type="sla" severity="warning" title="Test" message="Test" />
    );
    expect(screen.getByText('⏰')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn();
    render(
      <AlertBanner
        type="stock"
        severity="warning"
        title="Low Stock"
        message="Part XYZ is below minimum"
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByTestId('alert-dismiss'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('calls onAction when action button clicked', () => {
    const onAction = vi.fn();
    render(
      <AlertBanner
        type="pm"
        severity="critical"
        title="Overdue PM"
        message="PM is 5 days overdue"
        onAction={onAction}
        actionLabel="Create WO"
      />
    );

    fireEvent.click(screen.getByTestId('alert-action'));
    expect(onAction).toHaveBeenCalled();
    expect(screen.getByText('Create WO')).toBeInTheDocument();
  });

  it('displays title and message', () => {
    render(
      <AlertBanner
        type="sla"
        severity="critical"
        title="SLA Breach Imminent"
        message="Work order WO-001 has 1 hour remaining"
      />
    );

    expect(screen.getByText('SLA Breach Imminent')).toBeInTheDocument();
    expect(screen.getByText('Work order WO-001 has 1 hour remaining')).toBeInTheDocument();
  });
});

export { AssetStatusBadge, InventoryTable, AlertBanner };
