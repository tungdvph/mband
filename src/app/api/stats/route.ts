// src/app/api/stats/route.ts

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';    // Đảm bảo đường dẫn này đúng
import User from '@/lib/models/User';                // Đảm bảo đường dẫn này đúng
// import Booking from '@/lib/models/Booking';       // <<--- XÓA DÒNG NÀY HOẶC COMMENT LẠI
import TicketBooking from '@/lib/models/TicketBooking'; // <<+++ THÊM DÒNG NÀY: Import model TicketBooking
import Song from '@/lib/models/Music';               // Lưu ý: Import Model 'Music' nhưng đặt tên là 'Song'


export async function GET() {
    try {
        // Log trước khi kết nối
        console.log('[API /api/stats] Đang cố gắng kết nối tới DB...');
        await connectToDatabase();
        // Log sau khi kết nối thành công
        console.log('[API /api/stats] Đã kết nối DB. Bắt đầu đếm documents...');

        // Log ngay trước khi thực hiện các lệnh đếm
        console.log('[API /api/stats] Đang thực thi Promise.all cho các lệnh countDocuments...');
        // Sử dụng TicketBooking.countDocuments()
        const [userCount, bookingCount, songCount] = await Promise.all([
            User.countDocuments(),
            TicketBooking.countDocuments(), // <<--- SỬA Ở ĐÂY: Dùng TicketBooking để đếm
            // Nhớ rằng: Biến 'Song' ở đây là Model 'Music', sẽ đếm collection 'musics'
            Song.countDocuments(),
        ]);

        // Log quan trọng: In ra các giá trị đếm nhận được từ database
        console.log(`[API /api/stats] Kết quả đếm nhận được - Users: ${userCount}, Bookings (from TicketBooking): ${bookingCount}, Songs (collection 'musics'): ${songCount}`);

        // Chuẩn bị đối tượng JSON để trả về
        // Frontend của bạn trong AdminDashboardPage đang tìm key `ticketBookingCount` hoặc `ticketBookings` hoặc `bookings`.
        // Trả về `ticketBookings` sẽ khớp với một trong các key đó.
        const stats = {
            users: userCount,
            ticketBookings: bookingCount, // <<--- SỬA KEY (hoặc giữ 'bookings' nếu frontend đã quen)
            // Frontend đang mong đợi key là 'songs', nên ta dùng giá trị songCount (từ collection 'musics') ở đây
            songs: songCount,
        };

        // Log đối tượng chuẩn bị trả về cho client
        console.log('[API /api/stats] Chuẩn bị trả về response:', stats);
        // Trả về response thành công (mặc định status 200)
        return NextResponse.json(stats);

    } catch (error) {
        // Log chi tiết lỗi nếu có
        console.error('[API /api/stats] Đã xảy ra lỗi trong quá trình xử lý GET:', error);
        // Cố gắng lấy thông điệp lỗi cụ thể hơn
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Trả về response lỗi 500
        return NextResponse.json({ error: `Lỗi khi lấy thống kê: ${errorMessage}` }, { status: 500 });
    }
}