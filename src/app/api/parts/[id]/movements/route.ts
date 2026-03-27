import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/parts/[id]/movements - Get part movements
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partId } = await params;
    
    const movements = await db.sparePartMovement.findMany({
      where: { partId },
      include: {
        workOrder: {
          select: { woNumber: true, title: true }
        },
        movedBy: {
          select: { fullName: true }
        }
      },
      orderBy: { movedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ movements });
  } catch (error) {
    console.error('Get movements error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
