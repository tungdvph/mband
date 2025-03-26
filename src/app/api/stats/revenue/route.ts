import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';

export async function GET() {
    try {
        await connectToDatabase();
        
        const revenueData = await Booking.aggregate([
            {
                $match: {
                    status: 'confirmed',
                    createdAt: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
                    }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    revenue: { $sum: '$price' }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: {
                        $concat: [
                            { $toString: '$_id.month' },
                            '/',
                            { $toString: '$_id.year' }
                        ]
                    },
                    revenue: 1
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        return NextResponse.json(revenueData);
    } catch (error) {
        console.error('Revenue stats error:', error);
        return NextResponse.json({ error: 'Lỗi khi lấy thống kê doanh thu' }, { status: 500 });
    }
}