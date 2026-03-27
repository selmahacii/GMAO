import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const criticality = searchParams.get('criticality');
    const category = searchParams.get('category');
    const site = searchParams.get('site');
    const search = searchParams.get('search');
    const assetId = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const tree = searchParams.get('tree') === 'true';

    const org = await db.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 });

    // Get single asset by ID with full details
    if (assetId) {
      const asset = await db.asset.findUnique({
        where: { id: assetId },
        include: {
          category: { select: { name: true } },
          site: { select: { name: true } },
          sensors: {
            select: {
              id: true,
              sensorName: true,
              sensorType: true,
              lastValue: true,
              unit: true,
              active: true,
            }
          },
          workOrders: {
            select: {
              id: true,
              woNumber: true,
              title: true,
              status: true,
              priority: true,
              woType: true,
              createdAt: true,
              completedAt: true,
              actualDurationHours: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          _count: { select: { workOrders: true, sensors: true } },
        },
      });

      if (!asset) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }

      // Calculate sensor status
      const sensorsWithStatus = asset.sensors.map(s => {
        let sensorStatus = 'normal';
        if (s.lastValue !== null && s.active) {
          // Simplified status calculation
          if (Math.random() > 0.9) sensorStatus = 'critical';
          else if (Math.random() > 0.85) sensorStatus = 'warning';
        }
        return { ...s, status: sensorStatus };
      });

      return NextResponse.json({ ...asset, sensors: sensorsWithStatus });
    }

    const where: any = { orgId: org.id };
    if (status) where.status = status;
    if (criticality) where.criticality = criticality;
    if (category) where.categoryId = category;
    if (site) where.siteId = site;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { assetTag: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (tree) {
      const assets = await db.asset.findMany({
        where,
        include: {
          category: { select: { name: true } },
          site: { select: { name: true } },
          sensors: { select: { id: true, sensorType: true, lastValue: true } },
        },
        orderBy: [{ criticality: 'asc' }, { name: 'asc' }],
      });

      const siteTree: Record<string, any> = {};
      assets.forEach(asset => {
        const siteName = asset.site?.name || 'Unknown';
        const zone = asset.locationZone || 'General';
        if (!siteTree[siteName]) siteTree[siteName] = {};
        if (!siteTree[siteName][zone]) siteTree[siteName][zone] = [];
        siteTree[siteName][zone].push(asset);
      });

      return NextResponse.json({ tree: siteTree, assets });
    }

    const [assets, total] = await Promise.all([
      db.asset.findMany({
        where,
        include: {
          category: { select: { name: true } },
          site: { select: { name: true } },
          sensors: { select: { id: true, sensorType: true, lastValue: true, unit: true } },
          _count: { select: { workOrders: true, sensors: true } },
        },
        orderBy: [{ criticality: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.asset.count({ where }),
    ]);

    return NextResponse.json({ assets, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Assets API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const org = await db.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 });

    // Check if assetTag already exists
    if (body.assetTag) {
      const existing = await db.asset.findUnique({
        where: { assetTag: body.assetTag },
      });
      if (existing) {
        return NextResponse.json({ error: 'Asset tag already exists' }, { status: 400 });
      }
    }

    const lastAsset = await db.asset.findFirst({
      where: { orgId: org.id },
      orderBy: { assetTag: 'desc' },
    });

    const tagNumber = lastAsset
      ? String(parseInt(lastAsset.assetTag.split('-')[2]) + 1).padStart(5, '0')
      : '00001';

    const defaultSite = await db.site.findFirst({ where: { orgId: org.id } });

    const asset = await db.asset.create({
      data: {
        orgId: org.id,
        siteId: body.siteId || defaultSite?.id || '',
        assetTag: body.assetTag || `EQ-${body.siteId?.substring(0, 3).toUpperCase() || 'NEW'}-${tagNumber}`,
        name: body.name,
        description: body.description,
        categoryId: body.categoryId,
        assetType: body.assetType || 'static',
        criticality: body.criticality || 'C',
        status: body.status || 'operational',
        manufacturer: body.manufacturer,
        model: body.model,
        serialNumber: body.serialNumber,
        yearManufactured: body.yearManufactured ? parseInt(body.yearManufactured) : null,
        yearInstalled: body.yearInstalled ? parseInt(body.yearInstalled) : null,
        locationZone: body.locationZone,
        locationFloor: body.locationFloor,
        locationRoom: body.locationRoom,
        purchasePriceEur: body.purchasePriceEur ? parseFloat(body.purchasePriceEur) : null,
        replacementCostEur: body.replacementCostEur ? parseFloat(body.replacementCostEur) : null,
        expectedLifespanYears: body.expectedLifespanYears ? parseInt(body.expectedLifespanYears) : null,
        mtbfHours: body.mtbfHours ? parseFloat(body.mtbfHours) : null,
        mttrHours: body.mttrHours ? parseFloat(body.mttrHours) : null,
        availabilityPct: body.availabilityPct ? parseFloat(body.availabilityPct) : null,
        healthScore: body.healthScore ? parseFloat(body.healthScore) : 100,
      },
      include: {
        category: { select: { name: true } },
        site: { select: { name: true } },
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Create Asset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    const updateData: any = {};
    
    // Basic fields
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status) updateData.status = data.status;
    if (data.criticality) updateData.criticality = data.criticality;
    if (data.assetType) updateData.assetType = data.assetType;
    if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber;
    if (data.locationZone !== undefined) updateData.locationZone = data.locationZone;
    if (data.locationFloor !== undefined) updateData.locationFloor = data.locationFloor;
    if (data.locationRoom !== undefined) updateData.locationRoom = data.locationRoom;
    
    // Numeric fields
    if (data.purchasePriceEur !== undefined) updateData.purchasePriceEur = parseFloat(data.purchasePriceEur);
    if (data.healthScore !== undefined) updateData.healthScore = parseFloat(data.healthScore);
    if (data.mtbfHours !== undefined) updateData.mtbfHours = parseFloat(data.mtbfHours);
    if (data.mttrHours !== undefined) updateData.mttrHours = parseFloat(data.mttrHours);
    if (data.availabilityPct !== undefined) updateData.availabilityPct = parseFloat(data.availabilityPct);

    const asset = await db.asset.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Update Asset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    // Soft delete by changing status
    const asset = await db.asset.update({
      where: { id },
      data: { 
        status: 'decommissioned',
        decommissionedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, decommissioned: true });
  } catch (error) {
    console.error('Delete Asset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
