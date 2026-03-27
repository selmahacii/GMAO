import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/pm - Get PM templates and schedules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'templates' or 'schedules'
    
    const org = await db.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 });

    if (type === 'templates') {
      const templates = await db.pmTemplate.findMany({
        where: { orgId: org.id },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(templates);
    }

    if (type === 'schedules') {
      const schedules = await db.pmSchedule.findMany({
        where: { active: true },
        include: {
          asset: { select: { name: true, assetTag: true, criticality: true } },
          template: true,
        },
        orderBy: { nextDueDate: 'asc' },
      });

      // Calculate status for each schedule
      const now = new Date();
      const schedulesWithStatus = schedules.map(s => {
        const diffDays = Math.floor((new Date(s.nextDueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        let status = 'scheduled';
        if (diffDays < 0) status = 'overdue';
        else if (diffDays <= 3) status = 'urgent';
        else if (diffDays <= 7) status = 'upcoming';
        
        return { ...s, status, diffDays };
      });

      return NextResponse.json(schedulesWithStatus);
    }

    // Return both templates and schedules
    const [templates, schedules] = await Promise.all([
      db.pmTemplate.findMany({
        where: { orgId: org.id },
        orderBy: { name: 'asc' },
      }),
      db.pmSchedule.findMany({
        where: { active: true },
        include: {
          asset: { select: { name: true, assetTag: true, criticality: true } },
          template: true,
        },
        orderBy: { nextDueDate: 'asc' },
      }),
    ]);

    const now = new Date();
    const schedulesWithStatus = schedules.map(s => {
      const diffDays = Math.floor((new Date(s.nextDueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      let status = 'scheduled';
      if (diffDays < 0) status = 'overdue';
      else if (diffDays <= 3) status = 'urgent';
      else if (diffDays <= 7) status = 'upcoming';
      
      return { ...s, status, diffDays };
    });

    return NextResponse.json({ templates, schedules: schedulesWithStatus });
  } catch (error) {
    console.error('PM API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/pm - Create new PM template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const org = await db.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 });

    const template = await db.pmTemplate.create({
      data: {
        orgId: org.id,
        name: body.name,
        description: body.description,
        frequencyType: body.frequencyType || 'calendar',
        intervalDays: body.intervalDays ? parseInt(body.intervalDays) : null,
        intervalMeterValue: body.intervalMeterValue ? parseFloat(body.intervalMeterValue) : null,
        estimatedDurationHours: body.estimatedDurationHours ? parseFloat(body.estimatedDurationHours) : null,
        requiredSkillLevel: body.requiredSkillLevel ? parseInt(body.requiredSkillLevel) : 1,
        checklistItems: JSON.stringify(body.checklistItems || []),
        requiredParts: JSON.stringify(body.requiredParts || []),
        requiredTools: JSON.stringify(body.requiredTools || []),
        safetyInstructions: body.safetyInstructions,
        regulatoryReference: body.regulatoryReference,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Create PM template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/pm - Update PM template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    const template = await db.pmTemplate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        frequencyType: data.frequencyType,
        intervalDays: data.intervalDays ? parseInt(data.intervalDays) : null,
        intervalMeterValue: data.intervalMeterValue ? parseFloat(data.intervalMeterValue) : null,
        estimatedDurationHours: data.estimatedDurationHours ? parseFloat(data.estimatedDurationHours) : null,
        requiredSkillLevel: data.requiredSkillLevel ? parseInt(data.requiredSkillLevel) : 1,
        checklistItems: JSON.stringify(data.checklistItems || []),
        requiredParts: JSON.stringify(data.requiredParts || []),
        requiredTools: JSON.stringify(data.requiredTools || []),
        safetyInstructions: data.safetyInstructions,
        regulatoryReference: data.regulatoryReference,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Update PM template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/pm - Delete PM template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    await db.pmTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete PM template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
