import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/technicians - Get all technicians with performance data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const performance = searchParams.get('performance') === 'true';
    const period = searchParams.get('period') || 'month'; // week, month, quarter, year

    const org = await db.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 });

    // Get all technicians
    const technicians = await db.user.findMany({
      where: { 
        orgId: org.id,
        role: { in: ['technician', 'technician_lead', 'supervisor', 'manager'] }
      },
      include: {
        laborEntries: {
          include: {
            workOrder: {
              select: { 
                status: true, 
                woType: true, 
                createdAt: true,
                completedAt: true,
                actualDurationHours: true,
                estimatedDurationHours: true,
                priority: true,
              }
            }
          }
        },
        _count: {
          select: {
            workOrdersAssigned: true,
            laborEntries: true,
          }
        }
      },
      orderBy: { fullName: 'asc' }
    });

    if (performance) {
      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(now.getMonth() - 1);
      }

      // Calculate performance metrics for each technician
      const techniciansWithPerformance = technicians.map(tech => {
        // Filter labor entries for the period
        const periodEntries = tech.laborEntries.filter(entry => 
          new Date(entry.createdAt) >= startDate
        );

        // Get work orders completed in period
        const completedWOs = periodEntries.filter(e => 
          e.workOrder?.status === 'completed' || e.workOrder?.status === 'validated'
        );

        // Calculate total hours worked
        const totalHours = periodEntries.reduce((sum, e) => sum + (e.hours || 0), 0);

        // Calculate average intervention time
        const durations = completedWOs
          .map(e => e.workOrder?.actualDurationHours)
          .filter((d): d is number => d != null);
        const avgInterventionTime = durations.length > 0 
          ? durations.reduce((a, b) => a + b, 0) / durations.length 
          : 0;

        // Calculate OT performance (completed vs estimated)
        const onTimeCompletions = completedWOs.filter(e => {
          const actual = e.workOrder?.actualDurationHours;
          const estimated = e.workOrder?.estimatedDurationHours;
          return actual != null && estimated != null && actual <= estimated * 1.1;
        }).length;
        const onTimeRate = completedWOs.length > 0 
          ? (onTimeCompletions / completedWOs.length) * 100 
          : 0;

        // Calculate by priority
        const urgentWOs = completedWOs.filter(e => 
          e.workOrder?.priority?.startsWith('P1') || e.workOrder?.priority?.startsWith('P2')
        ).length;

        // Points calculation
        const points = Math.round(
          completedWOs.length * 10 + 
          onTimeCompletions * 5 + 
          urgentWOs * 3 +
          (avgInterventionTime < 2 ? 5 : 0)
        );

        return {
          ...tech,
          performance: {
            period,
            totalWOsCompleted: completedWOs.length,
            totalHoursWorked: totalHours,
            avgInterventionTime: Math.round(avgInterventionTime * 10) / 10,
            onTimeRate: Math.round(onTimeRate),
            urgentWOsCompleted: urgentWOs,
            points,
            efficiency: totalHours > 0 ? Math.round((completedWOs.length / totalHours) * 100) / 100 : 0,
          }
        };
      });

      // Sort by points descending
      techniciansWithPerformance.sort((a, b) => (b.performance?.points || 0) - (a.performance?.points || 0));

      return NextResponse.json({
        technicians: techniciansWithPerformance,
        period,
        startDate,
        endDate: now,
        summary: {
          totalTechnicians: techniciansWithPerformance.length,
          totalWOsCompleted: techniciansWithPerformance.reduce((sum, t) => sum + (t.performance?.totalWOsCompleted || 0), 0),
          avgInterventionTime: Math.round(
            techniciansWithPerformance.reduce((sum, t) => sum + (t.performance?.avgInterventionTime || 0), 0) / 
            Math.max(techniciansWithPerformance.length, 1) * 10
          ) / 10,
        }
      });
    }

    // Return basic technician list
    return NextResponse.json(technicians.map(t => ({
      id: t.id,
      fullName: t.fullName,
      email: t.email,
      role: t.role,
      position: t.position,
      department: t.department,
      section: t.section,
      shift: t.shift,
      skillLevel: t.skillLevel,
      points: t.points,
      active: t.active,
      employeeId: t.employeeId,
      phone: t.phone,
      hourlyRateEur: t.hourlyRateEur,
      workOrdersCount: t._count.workOrdersAssigned,
    })));
  } catch (error) {
    console.error('Technicians API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/technicians - Create new technician
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const org = await db.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 });

    // Check if email already exists
    const existing = await db.user.findUnique({
      where: { email: body.email },
    });

    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const technician = await db.user.create({
      data: {
        orgId: org.id,
        siteId: body.siteId,
        email: body.email,
        password: body.password || 'temp123!', // Should be changed on first login
        fullName: body.fullName,
        role: body.role || 'technician',
        employeeId: body.employeeId,
        position: body.position,
        department: body.department,
        section: body.section,
        shift: body.shift,
        workSchedule: body.workSchedule,
        phone: body.phone,
        hourlyRateEur: body.hourlyRateEur ? parseFloat(body.hourlyRateEur) : null,
        skillLevel: body.skillLevel ? parseInt(body.skillLevel) : 1,
        specializations: JSON.stringify(body.specializations || []),
        certifications: JSON.stringify(body.certifications || []),
        maxWorkingHoursWeek: body.maxWorkingHoursWeek ? parseFloat(body.maxWorkingHoursWeek) : 40,
        active: body.active !== false,
      },
    });

    return NextResponse.json(technician, { status: 201 });
  } catch (error) {
    console.error('Create technician error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/technicians - Update technician
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Technician ID required' }, { status: 400 });
    }

    const updateData: any = {};
    
    // Basic fields
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.section !== undefined) updateData.section = data.section;
    if (data.shift !== undefined) updateData.shift = data.shift;
    if (data.workSchedule !== undefined) updateData.workSchedule = data.workSchedule;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.hourlyRateEur !== undefined) updateData.hourlyRateEur = parseFloat(data.hourlyRateEur);
    if (data.skillLevel !== undefined) updateData.skillLevel = parseInt(data.skillLevel);
    if (data.specializations) updateData.specializations = JSON.stringify(data.specializations);
    if (data.certifications) updateData.certifications = JSON.stringify(data.certifications);
    if (data.maxWorkingHoursWeek !== undefined) updateData.maxWorkingHoursWeek = parseFloat(data.maxWorkingHoursWeek);
    if (data.active !== undefined) updateData.active = data.active;
    if (data.points !== undefined) updateData.points = parseInt(data.points);

    const technician = await db.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(technician);
  } catch (error) {
    console.error('Update technician error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/technicians - Delete/deactivate technician
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Technician ID required' }, { status: 400 });
    }

    // Soft delete by deactivating
    const technician = await db.user.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true, deactivated: true });
  } catch (error) {
    console.error('Delete technician error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
