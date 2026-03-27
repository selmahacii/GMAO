'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Download,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AnalyticsPage() {
  const [period, setPeriod] = useState('12m');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for charts
  const availabilityData = [
    { month: 'Jan', value: 92.5 },
    { month: 'Fév', value: 93.2 },
    { month: 'Mar', value: 91.8 },
    { month: 'Avr', value: 94.1 },
    { month: 'Mai', value: 93.8 },
    { month: 'Juin', value: 94.5 },
    { month: 'Juil', value: 93.2 },
    { month: 'Août', value: 94.8 },
    { month: 'Sep', value: 95.1 },
    { month: 'Oct', value: 94.3 },
    { month: 'Nov', value: 94.9 },
    { month: 'Déc', value: 94.2 },
  ];

  const mtbfData = [
    { month: 'Jan', value: 2800 },
    { month: 'Fév', value: 2950 },
    { month: 'Mar', value: 3100 },
    { month: 'Avr', value: 3050 },
    { month: 'Mai', value: 3200 },
    { month: 'Juin', value: 3150 },
    { month: 'Juil', value: 3300 },
    { month: 'Août', value: 3250 },
    { month: 'Sep', value: 3400 },
    { month: 'Oct', value: 3350 },
    { month: 'Nov', value: 3450 },
    { month: 'Déc', value: 3240 },
  ];

  const costData = [
    { month: 'Jan', parts: 45000, labor: 32000, external: 15000 },
    { month: 'Fév', parts: 38000, labor: 30000, external: 12000 },
    { month: 'Mar', parts: 52000, labor: 35000, external: 18000 },
    { month: 'Avr', parts: 41000, labor: 28000, external: 14000 },
    { month: 'Mai', parts: 48000, labor: 33000, external: 16000 },
    { month: 'Juin', parts: 35000, labor: 29000, external: 11000 },
  ];

  const failureData = [
    { category: 'Mécanique', count: 145 },
    { category: 'Électrique', count: 98 },
    { category: 'Usure', count: 76 },
    { category: 'Erreur humaine', count: 34 },
    { category: 'Externe', count: 23 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytiques & KPIs</h1>
          <p className="text-gray-500">Indicateurs de performance maintenance</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 mois</SelectItem>
              <SelectItem value="3m">3 mois</SelectItem>
              <SelectItem value="6m">6 mois</SelectItem>
              <SelectItem value="12m">12 mois</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="availability">Disponibilité</TabsTrigger>
          <TabsTrigger value="costs">Coûts</TabsTrigger>
          <TabsTrigger value="failures">Pannes</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Disponibilité moyenne</p>
                    <p className="text-2xl font-bold">94.2%</p>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>+1.3% vs N-1</span>
                    </div>
                  </div>
                  <Activity className="h-8 w-8 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">MTBF moyen</p>
                    <p className="text-2xl font-bold">3,240h</p>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>+18% vs N-1</span>
                    </div>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Coût annuel</p>
                    <p className="text-2xl font-bold">2.4M€</p>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <TrendingDown className="h-4 w-4" />
                      <span>-8% vs N-1</span>
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Conformité PM</p>
                    <p className="text-2xl font-bold">87%</p>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>+5% vs N-1</span>
                    </div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-emerald-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution de la Disponibilité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={availabilityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[85, 100]} />
                      <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Disponibilité']} />
                      <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Évolution du MTBF</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mtbfData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(v: number) => [`${v}h`, 'MTBF']} />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="availability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyse de la Disponibilité</CardTitle>
              <CardDescription>Tendances et distribution par équipement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={availabilityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[85, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Disponibilité %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Répartition des Coûts</CardTitle>
              <CardDescription>Par catégorie: pièces, main d'œuvre, externe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => `${(v / 1000).toFixed(0)}k€`} />
                    <Legend />
                    <Bar dataKey="parts" name="Pièces" fill="#10b981" />
                    <Bar dataKey="labor" name="Main d'œuvre" fill="#3b82f6" />
                    <Bar dataKey="external" name="Externe" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failures" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution des Causes de Pannes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={failureData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        nameKey="category"
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      >
                        {failureData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Causes de Pannes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {failureData.map((item, index) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.category}</span>
                        <span className="text-gray-500">{item.count} occurrences</span>
                      </div>
                      <Progress value={(item.count / failureData[0].count) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance des Techniciens</CardTitle>
              <CardDescription>OTs clôturés, temps moyen d'intervention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analyse de performance</p>
                <p className="text-sm">Données détaillées par technicien</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
