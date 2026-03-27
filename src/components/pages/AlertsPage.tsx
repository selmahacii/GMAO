'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Thermometer,
  Activity,
  Package,
  Calendar,
  Filter,
  X,
  Check,
  Eye,
} from 'lucide-react';

interface Alert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  triggeredAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  asset?: { name: string; assetTag: string };
  sensor?: { sensorName: string; sensorType: string };
  workOrder?: { woNumber: string; title: string };
  acknowledgedBy?: { fullName: string };
}

const severityConfig: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  critical: { label: 'Critique', color: 'text-red-600', icon: AlertCircle, bg: 'bg-red-50 dark:bg-red-900/20' },
  warning: { label: 'Avertissement', color: 'text-yellow-600', icon: AlertTriangle, bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  info: { label: 'Information', color: 'text-blue-600', icon: Info, bg: 'bg-blue-50 dark:bg-blue-900/20' },
};

const typeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  sensor_threshold: { label: 'Seuil capteur', icon: Thermometer },
  pm_overdue: { label: 'MP en retard', icon: Calendar },
  sla_breach: { label: 'SLA dépassé', icon: Clock },
  stock_critical: { label: 'Stock critique', icon: Package },
  anomaly_detected: { label: 'Anomalie détectée', icon: Activity },
};

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams();
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const res = await fetch(`/api/alerts?${params.toString()}`);
      const data = await res.json();
      setAlerts(data.alerts || []);
      setUnreadCount(data.unreadCount || 0);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severityFilter, typeFilter]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId, action: 'acknowledge' }),
      });
      fetchAlerts();
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId, action: 'resolve' }),
      });
      fetchAlerts();
    } catch (err) {
      console.error('Failed to resolve:', err);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const config = severityConfig[severity] || severityConfig.info;
    const Icon = config.icon;
    return (
      <Badge className={`${config.bg} ${config.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const config = typeConfig[type] || { label: type, icon: Bell };
    const Icon = config.icon;
    return (
      <Badge variant="outline">
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.resolvedAt).length;
  const warningCount = alerts.filter(a => a.severity === 'warning' && !a.resolvedAt).length;
  const unacknowledgedCount = alerts.filter(a => !a.acknowledgedAt).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Alertes
          </h1>
          <p className="text-gray-500">{unreadCount} alertes non traitées</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { /* Acknowledge all */ }}>
            <Check className="mr-2 h-4 w-4" />
            Tout acquitter
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Critiques</p>
                <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avertissements</p>
                <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Non acquittées</p>
                <p className="text-2xl font-bold text-blue-600">{unacknowledgedCount}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sévérité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
            <SelectItem value="warning">Avertissement</SelectItem>
            <SelectItem value="info">Information</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type d'alerte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="sensor_threshold">Seuil capteur</SelectItem>
            <SelectItem value="pm_overdue">MP en retard</SelectItem>
            <SelectItem value="sla_breach">SLA dépassé</SelectItem>
            <SelectItem value="stock_critical">Stock critique</SelectItem>
            <SelectItem value="anomaly_detected">Anomalie détectée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sévérité</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Équipement</TableHead>
                <TableHead>Déclenchée</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.slice(0, 30).map((alert) => (
                <TableRow key={alert.id} className={
                  !alert.acknowledgedAt ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }>
                  <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                  <TableCell>{getTypeBadge(alert.alertType)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-xs text-gray-500">{alert.message}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {alert.asset && (
                      <div className="text-sm">
                        <p>{alert.asset.name}</p>
                        <p className="text-gray-500">{alert.asset.assetTag}</p>
                      </div>
                    )}
                    {alert.sensor && (
                      <p className="text-xs text-gray-500">{alert.sensor.sensorName}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(alert.triggeredAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    {alert.resolvedAt ? (
                      <Badge className="bg-green-100 text-green-800">Résolue</Badge>
                    ) : alert.acknowledgedAt ? (
                      <Badge className="bg-yellow-100 text-yellow-800">Acquittée</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Nouvelle</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {!alert.acknowledgedAt && (
                        <Button size="sm" variant="ghost" onClick={() => handleAcknowledge(alert.id)}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {!alert.resolvedAt && (
                        <Button size="sm" variant="ghost" onClick={() => handleResolve(alert.id)}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
