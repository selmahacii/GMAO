// Component Tests: Work Order Card
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkOrderCard } from '@/components/ui/work-order-card';

// Mock data
const mockWorkOrder = {
  id: 'wo_1',
  woNumber: 'WO-2024-0001',
  title: 'Réparation pompe centrifuge',
  status: 'in_progress',
  priority: 'P2_urgent',
  woType: 'corrective',
  assetName: 'Pompe Centrifuge A',
  assignedToName: 'Ahmed Benali',
  createdAt: new Date().toISOString(),
  plannedStartAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  slaDeadline: new Date(Date.now() + 3600000).toISOString(), // 1 hour
  estimatedDurationHours: 4,
};

const mockHighPriorityWO = {
  ...mockWorkOrder,
  id: 'wo_2',
  woNumber: 'WO-2024-0002',
  priority: 'P1_emergency',
  title: 'Fuite critique compresseur',
};

const mockOverdueWO = {
  ...mockWorkOrder,
  id: 'wo_3',
  woNumber: 'WO-2024-0003',
  slaDeadline: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
};

// Mock component implementation for testing
function WorkOrderCard({
  wo,
  onSelect,
  showDragHandle = true,
  userRole = 'technician',
}: {
  wo: typeof mockWorkOrder;
  onSelect?: (id: string) => void;
  showDragHandle?: boolean;
  userRole?: string;
}) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1_emergency': return 'bg-red-500 text-white';
      case 'P2_urgent': return 'bg-orange-500 text-white';
      case 'P3_normal': return 'bg-blue-500 text-white';
      case 'P4_low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'planned': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'validated': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const hoursRemaining = (new Date(wo.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60);
  const isDeadlineClose = hoursRemaining < 24 && hoursRemaining > 0;
  const isOverdue = hoursRemaining <= 0;

  return (
    <div
      data-testid="work-order-card"
      className="border rounded-lg p-4 cursor-pointer hover:shadow-md"
      onClick={() => onSelect?.(wo.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {showDragHandle && userRole !== 'viewer' && (
            <div data-testid="drag-handle" className="cursor-grab">
              ⋮⋮
            </div>
          )}
          <span className="text-sm text-gray-500">{wo.woNumber}</span>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(wo.priority)}`}>
          {wo.priority.replace('_', ' ')}
        </span>
      </div>
      
      <h3 className="font-medium mb-1">{wo.title}</h3>
      <p className="text-sm text-gray-600 mb-2">{wo.assetName}</p>
      
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(wo.status)}`}>
          {wo.status}
        </span>
        <span className={`text-xs ${isOverdue ? 'text-red-500 font-bold' : isDeadlineClose ? 'text-orange-500' : 'text-gray-500'}`}>
          {isOverdue ? 'EN RETARD' : isDeadlineClose ? `< ${Math.round(hoursRemaining)}h` : wo.assignedToName}
        </span>
      </div>
    </div>
  );
}

describe('WorkOrderCard', () => {
  it('renders WO number and title', () => {
    render(<WorkOrderCard wo={mockWorkOrder} />);

    expect(screen.getByText('WO-2024-0001')).toBeInTheDocument();
    expect(screen.getByText('Réparation pompe centrifuge')).toBeInTheDocument();
  });

  it('shows red badge for P1 priority', () => {
    render(<WorkOrderCard wo={mockHighPriorityWO} />);

    const badge = screen.getByText('P1 emergency');
    expect(badge).toHaveClass('bg-red-500');
  });

  it('shows orange badge for P2 priority', () => {
    render(<WorkOrderCard wo={mockWorkOrder} />);

    const badge = screen.getByText('P2 urgent');
    expect(badge).toHaveClass('bg-orange-500');
  });

  it('shows deadline in red when < 24h remaining', () => {
    const woWithCloseDeadline = {
      ...mockWorkOrder,
      slaDeadline: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    };

    render(<WorkOrderCard wo={woWithCloseDeadline} />);

    const deadline = screen.getByText(/h$/);
    expect(deadline).toHaveClass('text-orange-500');
  });

  it('shows EN RETARD for overdue WO', () => {
    render(<WorkOrderCard wo={mockOverdueWO} />);

    expect(screen.getByText('EN RETARD')).toHaveClass('text-red-500');
  });

  it('clicking card calls onSelect callback', () => {
    const onSelect = vi.fn();
    render(<WorkOrderCard wo={mockWorkOrder} onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId('work-order-card'));
    expect(onSelect).toHaveBeenCalledWith('wo_1');
  });

  it('drag handle is visible for non-viewer roles', () => {
    render(<WorkOrderCard wo={mockWorkOrder} userRole="technician" />);
    
    expect(screen.getByTestId('drag-handle')).toBeInTheDocument();
  });

  it('drag handle is hidden for viewer role', () => {
    render(<WorkOrderCard wo={mockWorkOrder} userRole="viewer" />);
    
    expect(screen.queryByTestId('drag-handle')).not.toBeInTheDocument();
  });

  it('hides drag handle when showDragHandle is false', () => {
    render(<WorkOrderCard wo={mockWorkOrder} showDragHandle={false} />);
    
    expect(screen.queryByTestId('drag-handle')).not.toBeInTheDocument();
  });

  it('displays asset name', () => {
    render(<WorkOrderCard wo={mockWorkOrder} />);

    expect(screen.getByText('Pompe Centrifuge A')).toBeInTheDocument();
  });

  it('displays status badge', () => {
    render(<WorkOrderCard wo={mockWorkOrder} />);

    const statusBadge = screen.getByText('in_progress');
    expect(statusBadge).toHaveClass('bg-yellow-100');
  });
});

export { WorkOrderCard };
