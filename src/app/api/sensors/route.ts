import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const readings = searchParams.get('readings') === 'true';

    const org = await db.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 });

    const where: any = { orgId: org.id, active: true };
    if (assetId) where.assetId = assetId;
    if (type) where.sensorType = type;

    if (readings) {
      const sensorId = searchParams.get('sensorId');
      if (!sensorId) return NextResponse.json({ error: 'sensorId required for readings' }, { status: 400 });

      const sensorReadings = await db.sensorReading.findMany({
        where: { sensorId },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });
      return NextResponse.json(sensorReadings);
    }

    const sensors = await db.sensor.findMany({
      where,
      include: {
        asset: { select: { name: true, assetTag: true, criticality: true } },
        _count: { select: { readings: true } },
      },
      orderBy: { lastReadingAt: 'desc' },
    });

    const sensorStatus = sensors.map(s => {
      let sensorStatus = 'normal';
      if (s.lastValue !== null) {
        if (s.criticalThresholdLow !== null && s.lastValue < s.criticalThresholdLow) sensorStatus = 'critical';
        else if (s.criticalThresholdHigh !== null && s.lastValue > s.criticalThresholdHigh) sensorStatus = 'critical';
        else if (s.warningThresholdLow !== null && s.lastValue < s.warningThresholdLow) sensorStatus = 'warning';
        else if (s.warningThresholdHigh !== null && s.lastValue > s.warningThresholdHigh) sensorStatus = 'warning';
      }
      return { ...s, status: sensorStatus };
    });

    if (status && status !== 'all') {
      return NextResponse.json(sensorStatus.filter(s => s.status === status));
    }

    return NextResponse.json(sensorStatus);
  } catch (error) {
    console.error('Sensors API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
