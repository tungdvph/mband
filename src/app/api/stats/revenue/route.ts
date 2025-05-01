// /app/api/stats/revenue/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TicketBooking from '@/lib/models/TicketBooking'; // <<< THAY ĐỔI: Import đúng model
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { adminAuthOptions } from '@/lib/adminAuth'; // <<< THÊM: Import admin auth options

// Khuyến nghị sử dụng runtime Node.js
export const runtime = 'nodejs';

// Định dạng kết quả trả về
interface MonthlyRevenue {
    month: string; // Định dạng "MM/YYYY"
    revenue: number;
}

export async function GET() {
    try {
        // --- THÊM: Xác thực quyền admin ---
        const session = await getServerSession(adminAuthOptions);
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
        }
        // --- Kết thúc phần xác thực ---

        await connectToDatabase();
        console.log("Fetching revenue data from TicketBooking..."); // Thêm log

        // Lấy ngày bắt đầu là 6 tháng trước từ ngày hiện tại
        // const startDate = new Date();
        // startDate.setMonth(startDate.getMonth() - 6);
        // startDate.setDate(1); // Bắt đầu từ ngày 1 của tháng đó
        // startDate.setHours(0, 0, 0, 0); // Đặt về đầu ngày

        // Hoặc lấy theo năm hiện tại nếu muốn
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1); // Ngày 1 tháng 1 năm nay

        console.log("Calculating revenue from:", startDate); // Thêm log

        const revenueData: MonthlyRevenue[] = await TicketBooking.aggregate([
            {
                $match: {
                    status: 'confirmed', // Chỉ lấy các booking đã xác nhận
                    createdAt: { // Lọc theo ngày tạo trong khoảng thời gian mong muốn
                        $gte: startDate
                        // $lt: new Date() // Có thể thêm giới hạn trên nếu cần
                    },
                    totalPrice: { $exists: true, $type: 'number' } // Đảm bảo totalPrice tồn tại và là số
                }
            },
            {
                $group: {
                    _id: {
                        // Nhóm theo năm và tháng của ngày tạo (createdAt)
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    // Tính tổng totalPrice cho mỗi nhóm tháng/năm
                    revenue: { $sum: '$totalPrice' } // <<< THAY ĐỔI: Tính tổng `totalPrice`
                }
            },
            {
                $project: {
                    _id: 0, // Bỏ _id mặc định của group
                    // Tạo label tháng dạng "MM/YYYY"
                    month: {
                        $concat: [
                            { $toString: '$_id.month' },
                            '/',
                            { $toString: '$_id.year' }
                        ]
                    },
                    revenue: 1 // Giữ lại trường revenue đã tính tổng
                }
            },
            {
                // Sắp xếp kết quả theo năm rồi đến tháng tăng dần
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        console.log("Revenue data fetched:", revenueData); // Thêm log kết quả

        // Đảm bảo trả về mảng ngay cả khi không có dữ liệu
        return NextResponse.json(revenueData ?? []);

    } catch (error: any) {
        console.error('Error fetching revenue stats from TicketBooking:', error);
        // Ghi log chi tiết hơn nếu là lỗi schema
        if (error instanceof mongoose.Error.MissingSchemaError) {
            console.error("--- SCHEMA ERROR ---: Model '" + error.message.split('"')[1] + "' might not be registered correctly. Ensure it's imported in this API route file.");
        }
        return NextResponse.json({ error: 'Lỗi khi lấy thống kê doanh thu từ đặt vé', details: error.message }, { status: 500 });
    }
}