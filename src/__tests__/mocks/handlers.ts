// MSW API mock handlers
import { http, HttpResponse, delay } from 'msw';
import { mockDashboardData, mockWorkOrders, mockAssets, mockSpareParts, mockAlerts } from './data';

const API_BASE = '/api';

export const handlers = [
  // Dashboard API
  http.get(`${API_BASE}/dashboard`, async () => {
    await delay(100);
    return HttpResponse.json(mockDashboardData);
  }),

  // Work Orders API
  http.get(`${API_BASE}/work-orders`, async () => {
    await delay(100);
    return HttpResponse.json({ workOrders: mockWorkOrders, total: mockWorkOrders.length });
  }),

  http.post(`${API_BASE}/work-orders`, async ({ request }) => {
    await delay(100);
    const body = await request.json();
    const newWO = {
      id: `wo_new_${Date.now()}`,
      woNumber: `WO-${new Date().getFullYear()}-00001`,
      ...body,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(newWO, { status: 201 });
  }),

  http.patch(`${API_BASE}/work-orders/:id`, async ({ params, request }) => {
    await delay(100);
    const body = await request.json();
    const wo = mockWorkOrders.find(w => w.id === params.id);
    if (!wo) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json({ ...wo, ...body });
  }),

  // Assets API
  http.get(`${API_BASE}/assets`, async () => {
    await delay(100);
    return HttpResponse.json({ assets: mockAssets, total: mockAssets.length });
  }),

  http.get(`${API_BASE}/assets/:id`, async ({ params }) => {
    await delay(100);
    const asset = mockAssets.find(a => a.id === params.id);
    if (!asset) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(asset);
  }),

  // Spare Parts API
  http.get(`${API_BASE}/parts`, async () => {
    await delay(100);
    return HttpResponse.json({ parts: mockSpareParts, total: mockSpareParts.length });
  }),

  // Alerts API
  http.get(`${API_BASE}/alerts`, async () => {
    await delay(100);
    return HttpResponse.json({ alerts: mockAlerts, total: mockAlerts.length });
  }),

  // Billing API
  http.get(`${API_BASE}/billing/plans`, async () => {
    await delay(100);
    return HttpResponse.json({
      plans: [
        {
          id: 'starter',
          name: 'Starter',
          priceMonthly: 149,
          priceAnnual: 119,
          highlighted: false,
        },
        {
          id: 'pro',
          name: 'Pro',
          priceMonthly: 399,
          priceAnnual: 319,
          highlighted: true,
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          priceMonthly: null,
          priceAnnual: null,
          highlighted: false,
        },
      ],
    });
  }),

  http.get(`${API_BASE}/billing/subscription`, async () => {
    await delay(100);
    return HttpResponse.json({
      subscription: {
        id: 'sub_test',
        planId: 'pro',
        status: 'active',
        trialEndsAt: null,
      },
      usage: {
        assets: 150,
        users: 10,
        workOrdersThisMonth: 45,
        sensorsActive: 12,
      },
    });
  }),

  http.get(`${API_BASE}/billing/usage`, async () => {
    await delay(100);
    return HttpResponse.json({
      plan: { id: 'pro', name: 'Pro' },
      usage: {
        sites: { used: 2, limit: 5, percentage: 40, exceeded: false },
        assets: { used: 150, limit: 2000, percentage: 8, exceeded: false },
        users: { used: 10, limit: 25, percentage: 40, exceeded: false },
        workOrdersThisMonth: { used: 45, limit: -1, percentage: 0, exceeded: false },
        sensors: { used: 12, limit: 50, percentage: 24, exceeded: false },
      },
      limitsExceeded: [],
      canCreate: {
        site: true,
        asset: true,
        user: true,
        workOrder: true,
        sensor: true,
      },
    });
  }),

  // PM API
  http.get(`${API_BASE}/pm`, async () => {
    await delay(100);
    return HttpResponse.json({ pmSchedules: [], total: 0 });
  }),

  // Sensors API
  http.get(`${API_BASE}/sensors`, async () => {
    await delay(100);
    return HttpResponse.json({ sensors: [], total: 0 });
  }),

  // Technicians API
  http.get(`${API_BASE}/technicians`, async () => {
    await delay(100);
    return HttpResponse.json({ technicians: [], total: 0 });
  }),

  // AI API
  http.post(`${API_BASE}/ai`, async ({ request }) => {
    await delay(500);
    const body = await request.json() as { prompt?: string };
    return HttpResponse.json({
      response: `AI response to: ${body?.prompt || 'your query'}`,
      suggestions: ['Check MTBF trends', 'Review PM compliance', 'Analyze downtime patterns'],
    });
  }),
];
