// /app/api/stats/revenue/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TicketBooking from '@/lib/models/TicketBooking';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { adminAuthOptions } from '@/lib/adminAuth';

export const runtime = 'nodejs';

interface MonthlyRevenueResult {
    month: string; // Sẽ là "Tháng X"
    revenue: number;
}

export async function GET() {
    try {
        const session = await getServerSession(adminAuthOptions);
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
        }

        await connectToDatabase();
        console.log("Fetching revenue data from TicketBooking...");

        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1); // Ngày 1 tháng 1 năm nay

        console.log("Calculating revenue for year:", currentYear, "from:", startDate);

        // Pipeline aggregate
        const revenueData: MonthlyRevenueResult[] = await TicketBooking.aggregate([
            {
                $match: {
                    status: 'confirmed',
                    createdAt: { $gte: startDate }, // Chỉ lấy trong năm hiện tại
                    totalPrice: { $exists: true, $type: 'number' }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' }, // Vẫn group theo năm và tháng
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$totalPrice' }
                }
            },
            {
                // --- THAY ĐỔI Ở ĐÂY ---
                $project: {
                    _id: 0, // Bỏ _id
                    month: { // Chuyển đổi số tháng thành chuỗi "Tháng X"
                        $switch: {
                            branches: [
                                { case: { $eq: ['$_id.month', 1] }, then: 'Tháng 1' },
                                { case: { $eq: ['$_id.month', 2] }, then: 'Tháng 2' },
                                { case: { $eq: ['$_id.month', 3] }, then: 'Tháng 3' },
                                { case: { $eq: ['$_id.month', 4] }, then: 'Tháng 4' },
                                { case: { $eq: ['$_id.month', 5] }, then: 'Tháng 5' },
                                { case: { $eq: ['$_id.month', 6] }, then: 'Tháng 6' },
                                { case: { $eq: ['$_id.month', 7] }, then: 'Tháng 7' },
                                { case: { $eq: ['$_id.month', 8] }, then: 'Tháng 8' },
                                { case: { $eq: ['$_id.month', 9] }, then: 'Tháng 9' },
                                { case: { $eq: ['$_id.month', 10] }, then: 'Tháng 10' },
                                { case: { $eq: ['$_id.month', 11] }, then: 'Tháng 11' },
                                { case: { $eq: ['$_id.month', 12] }, then: 'Tháng 12' },
                            ],
                            default: 'Không xác định' // Trường hợp dự phòng nếu tháng không hợp lệ
                        }
                    },
                    revenue: 1 // Giữ lại trường revenue
                }
                // -----------------------
            },
            {
                // Sắp xếp theo tháng (dựa trên số tháng gốc trước khi chuyển thành chuỗi)
                // Chúng ta cần thêm lại trường tháng số để sort đúng
                $addFields: {
                    monthNumber: '$_id.month' // Tạm thời thêm lại số tháng để sort
                }
            },
            {
                // Bây giờ sort theo số tháng
                $sort: { 'monthNumber': 1 }
            },
            {
                // Bỏ trường monthNumber không cần thiết sau khi sort
                $project: {
                    monthNumber: 0
                }
            }
        ]);

        console.log("Revenue data fetched (formatted):", revenueData);

        return NextResponse.json(revenueData ?? []);

    } catch (error: any) {
        console.error('Error fetching revenue stats from TicketBooking:', error);
        if (error instanceof mongoose.Error.MissingSchemaError) {
            console.error("--- SCHEMA ERROR ---: Model '" + error.message.split('"')[1] + "' might not be registered correctly. Ensure it's imported in this API route file.");
        }
        return NextResponse.json({ error: 'Lỗi khi lấy thống kê doanh thu từ đặt vé', details: error.message }, { status: 500 });
    }
}