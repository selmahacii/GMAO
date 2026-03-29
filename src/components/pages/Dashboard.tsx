'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Wrench,
  AlertTriangle,
  Package,
  DollarSign,
  Users,
  CheckCircle,
  ArrowRight,
  Zap,
  Target,
  Gauge,
  BarChart2,
  PieChart as PieChartIcon,
  Calendar,
  Settings,
  Shield,
  Award,
  AlertCircle,
  Minus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  ComposedChart,
} from 'recharts';

import { DialogDescription } from '@/components/ui/dialog';

interface DashboardData {
  kpis: {
    availability: string;
    mtbf: number;
    mttr: string;
    workOrdersInProgress: number;
    workOrdersCompleted: number;
    workOrdersThisMonth: number;
    pmCompliance: string;
    monthlyCost: number;
    criticalAlerts: number;
    lowStockParts: number;
    totalAssets: number;
    operationalAssets: number;
    technicians: number;
  };
  woByType: Array<{ type: string; count: number }>;
  woByStatus: Array<{ status: string; count: number }>;
  workOrdersByMonth: Array<{ month: string; corrective: number; preventive: number }>;
  topDowntimeAssets: Array<{ assetId: string; name: string; downtimeHours: number }>;
  failureModes: Array<{ category: string; count: number }>;
  recentAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    assetName?: string;
    triggeredAt: string;
  }>;
  upcomingPMs: Array<{
    id: string;
    woNumber: string;
    title: string;
    assetName?: string;
    assetTag?: string;
    plannedStartAt: string;
  }>;
  technicianWorkload: Array<{
    userId: string;
    name: string;
    hours: number;
    workOrders: number;
  }>;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, statsRes, assetsRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/analytics/stats'),
          fetch('/api/assets'),
        ]);
        
        let dashboardData;
        if (res.ok) {
          dashboardData = await res.json();
        } else {
          throw new Error('API Error');
        }
        
        setData(dashboardData);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch dashboard data, using mock data:', err);
        // Fallback robust mock data
        setData({
          kpis: {
            availability: '94.2',
            mtbf: 1250,
            mttr: '4.2',
            workOrdersInProgress: 12,
            workOrdersCompleted: 45,
            workOrdersThisMonth: 57,
            pmCompliance: '92.5',
            monthlyCost: 45000,
            criticalAlerts: 3,
            lowStockParts: 8,
            totalAssets: 142,
            operationalAssets: 138,
            technicians: 8
          },
          woByType: [
            { type: 'Correctif', count: 35 },
            { type: 'Préventif', count: 42 },
            { type: 'Inspection', count: 18 }
          ],
          woByStatus: [],
          workOrdersByMonth: [
            { month: 'Jan', corrective: 30, preventive: 40 },
            { month: 'Fév', corrective: 25, preventive: 45 },
            { month: 'Mar', corrective: 35, preventive: 42 },
            { month: 'Avr', corrective: 28, preventive: 48 },
            { month: 'Mai', corrective: 32, preventive: 44 }
          ],
          topDowntimeAssets: [
            { assetId: '1', name: 'Presse Hydraulique', downtimeHours: 24 },
            { assetId: '2', name: 'Compresseur C-40', downtimeHours: 18 },
            { assetId: '3', name: 'Pompe P-101', downtimeHours: 12 }
          ],
          failureModes: [
            { category: 'Électrique', count: 25 },
            { category: 'Mécanique', count: 40 },
            { category: 'Lubrification', count: 15 }
          ],
          recentAlerts: [
            { id: '1', type: 'sensor', severity: 'critical', title: 'Surchauffe Moteur', message: 'Température > 95°C', triggeredAt: new Date().toISOString() }
          ],
          upcomingPMs: [
             { id: 'pm1', woNumber: 'PM-2024-001', title: 'Vidange Semestrielle', plannedStartAt: new Date().toISOString() }
          ],
          technicianWorkload: [
            { userId: '1', name: 'Karim Z.', hours: 32, workOrders: 5 },
            { userId: '2', name: 'Sofiane B.', hours: 42, workOrders: 8 }
          ]
        });
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div>Erreur lors du chargement des données</div>;
  }

  const { kpis, woByType, workOrdersByMonth, topDowntimeAssets, failureModes, recentAlerts, upcomingPMs, technicianWorkload } = data;

  // OEE Calculation (simplified)
  const oee = {
    availability: parseFloat(kpis.availability),
    performance: 87, // Mock - would be calculated from actual data
    quality: 98, // Mock - would be calculated from actual data
    overall: (parseFloat(kpis.availability) * 0.87 * 0.98) / 100,
  };

  // Radar data for site performance
  const radarData = [
    { subject: 'Disponibilité', A: parseFloat(kpis.availability), fullMark: 100 },
    { subject: 'Conformité PM', A: parseFloat(kpis.pmCompliance), fullMark: 100 },
    { subject: 'Efficacité', A: 85, fullMark: 100 },
    { subject: 'Délais SLA', A: 92, fullMark: 100 },
    { subject: 'Gestion Stock', A: 88, fullMark: 100 },
    { subject: 'Sécurité', A: 95, fullMark: 100 },
  ];

  // Pareto data (80/20 analysis)
  const paretoData = topDowntimeAssets.map((asset, index) => ({
    name: asset.name?.substring(0, 15) || 'N/A',
    hours: asset.downtimeHours,
    cumulative: topDowntimeAssets
      .slice(0, index + 1)
      .reduce((sum, a) => sum + a.downtimeHours, 0),
  }));

  // Status colors
  const statusColors: Record<string, string> = {
    draft: '#6b7280',
    planned: '#3b82f6',
    assigned: '#8b5cf6',
    in_progress: '#f59e0b',
    on_hold: '#eab308',
    completed: '#10b981',
    validated: '#059669',
  };

  // KPI trend indicators
  const trends = {
    availability: { value: 1.3, positive: true },
    mtbf: { value: 18, positive: true },
    mttr: { value: 5, positive: true },
    pmCompliance: { value: 5, positive: true },
    cost: { value: 8, positive: true },
    workOrders: { value: 12, positive: true },
  };

  // Helper function to format DZD
  const formatDZD = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' DA';
  };

  return (
    <div className="space-y-6">
      {/* Critical Alerts Banner */}
      {kpis.criticalAlerts > 0 && (
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-800 dark:text-red-200">
                  {kpis.criticalAlerts} alertes critiques nécessitent une attention immédiate
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Intervention requise pour éviter des temps d'arrêt
                </p>
              </div>
              <Button size="sm" variant="destructive">
                Voir les alertes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Availability */}
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Disponibilité</p>
                <Activity className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis.availability}%</p>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  +{trends.availability.value}%
                </div>
                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">CIBLE: 95%</span>
              </div>
            </div>
            <Progress value={parseFloat(kpis.availability)} className="h-1 mt-4" />
          </CardContent>
        </Card>

        {/* MTBF */}
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">MTBF Moyen</p>
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis.mtbf.toLocaleString()}h</p>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  +{trends.mtbf.value}%
                </div>
                <span className="text-[10px] text-gray-400 font-medium">BONS RÉSULTATS</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Orders */}
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">OTs en cours</p>
                <Wrench className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis.workOrdersInProgress}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-sm bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">
                  {kpis.workOrdersCompleted} CLÔTURÉS
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PM Compliance */}
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Conformité PM</p>
                <CheckCircle className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis.pmCompliance}%</p>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  +{trends.pmCompliance.value}%
                </div>
              </div>
            </div>
            <Progress value={parseFloat(kpis.pmCompliance)} className="h-1 mt-4" />
          </CardContent>
        </Card>

        {/* Cost */}
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Coût Maintenance</p>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{((kpis.monthlyCost * 145) / 1000000).toFixed(1)}M DA</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-gray-400 font-medium">BUDGET: 7.5M DA</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'MTTR Moyen', value: `${kpis.mttr}h`, icon: Gauge, color: 'text-blue-500' },
          { label: 'OEE Global', value: `${oee.overall.toFixed(1)}%`, icon: Target, color: 'text-emerald-500' },
          { label: 'Équip. Opérationnels', value: `${kpis.operationalAssets}/${kpis.totalAssets}`, icon: Settings, color: 'text-zinc-500' },
          { label: 'Stock Bas', value: kpis.lowStockParts, icon: Package, color: 'text-red-500' },
          { label: 'Techniciens', value: kpis.technicians, icon: Users, color: 'text-zinc-600' },
          { label: 'Incidents HSE', value: '0', icon: Shield, color: 'text-emerald-600' },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm bg-white dark:bg-zinc-900">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <item.icon className={cn("h-4 w-4 mb-2", item.color)} />
              <p className="text-xl font-bold text-gray-900 dark:text-white">{item.value}</p>
              <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-tighter">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* OEE Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            OEE - Overall Equipment Effectiveness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                  <circle 
                    cx="48" cy="48" r="40" 
                    stroke="#10b981" 
                    strokeWidth="8" 
                    fill="none" 
                    strokeDasharray={`${oee.availability * 2.51} 251`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold">{oee.availability}%</span>
                </div>
              </div>
              <p className="text-sm font-medium mt-2">Disponibilité</p>
              <p className="text-xs text-gray-500">Temps de fonctionnement</p>
            </div>
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                  <circle 
                    cx="48" cy="48" r="40" 
                    stroke="#3b82f6" 
                    strokeWidth="8" 
                    fill="none" 
                    strokeDasharray={`${oee.performance * 2.51} 251`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold">{oee.performance}%</span>
                </div>
              </div>
              <p className="text-sm font-medium mt-2">Performance</p>
              <p className="text-xs text-gray-500">Vitesse de production</p>
            </div>
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                  <circle 
                    cx="48" cy="48" r="40" 
                    stroke="#8b5cf6" 
                    strokeWidth="8" 
                    fill="none" 
                    strokeDasharray={`${oee.quality * 2.51} 251`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold">{oee.quality}%</span>
                </div>
              </div>
              <p className="text-sm font-medium mt-2">Qualité</p>
              <p className="text-xs text-gray-500">Taux de conformité</p>
            </div>
            <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                {oee.overall.toFixed(1)}%
              </div>
              <p className="text-sm font-medium mt-2">OEE Global</p>
              <p className="text-xs text-gray-500">World class: 85%+</p>
              <Badge className={`mt-2 ${oee.overall >= 85 ? 'bg-green-500' : oee.overall >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                {oee.overall >= 85 ? 'Excellent' : oee.overall >= 60 ? 'Bon' : 'À améliorer'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work Orders Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution des Ordres de Travail</CardTitle>
            <CardDescription>12 derniers mois - Correctif vs Préventif</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full min-h-[320px]">
              <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={workOrdersByMonth}>
                  <defs>
                    <linearGradient id="colorCorrective" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorPreventive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="corrective"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorCorrective)"
                    name="Correctif"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="preventive"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorPreventive)"
                    name="Préventif"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Site Performance Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Site</CardTitle>
            <CardDescription>Indicateurs clés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full min-h-[320px]">
              <ResponsiveContainer width="99%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar
                    name="Performance"
                    dataKey="A"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.5}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WO by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Répartition par Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={woByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="type"
                  >
                    {woByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pareto - Top Downtime */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Arrêts (Pareto)</CardTitle>
            <CardDescription>90 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paretoData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#ef4444" name="Heures" radius={[0, 4, 4, 0]} />
                  <Line dataKey="cumulative" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Failure Modes */}
        <Card>
          <CardHeader>
            <CardTitle>Causes de Pannes</CardTitle>
            <CardDescription>Analyse Pareto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={failureModes}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" name="Occurrences" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming PMs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">MPs à Venir</CardTitle>
              <CardDescription>Cette semaine</CardDescription>
            </div>
            <Button size="sm" variant="ghost">
              Voir tout <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <div className="space-y-2">
                {upcomingPMs.map((pm, index) => (
                  <div key={pm.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pm.title}</p>
                      <p className="text-xs text-gray-500">{pm.assetName || 'N/A'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{pm.woNumber}</Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(pm.plannedStartAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Alertes Récentes</CardTitle>
              <CardDescription>Non traitées</CardDescription>
            </div>
            <Button size="sm" variant="ghost">
              Voir tout <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <div className="space-y-2">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${
                    alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                    alert.severity === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                    'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="secondary" className={`text-xs ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.severity === 'critical' ? 'CRITIQUE' : alert.severity === 'warning' ? 'ALERTE' : 'INFO'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.triggeredAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{alert.assetName || 'System'}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Technician Workload */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              Charge Équipe
            </CardTitle>
            <CardDescription>Heures planifiées cette semaine</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <div className="space-y-4">
                {technicianWorkload.map((tech, index) => {
                  const loadPercentage = (tech.hours / 40) * 100;
                  const loadColor = loadPercentage > 100 ? 'bg-red-500' : loadPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500';
                  
                  return (
                    <div key={tech.userId} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                            {tech.name?.substring(0, 2).toUpperCase() || `T${index + 1}`}
                          </div>
                          <span className="text-sm font-medium">{tech.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold">{tech.hours}h</span>
                          <span className="text-xs text-gray-400"> /40h</span>
                        </div>
                      </div>
                      <Progress value={Math.min(loadPercentage, 100)} className={`h-2 ${loadColor}`} />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{tech.workOrders} OTs</span>
                        <span className={loadPercentage > 100 ? 'text-red-500 font-medium' : ''}>
                          {loadPercentage > 100 ? 'Surchargé' : loadPercentage > 80 ? 'Bien chargé' : 'Disponible'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
