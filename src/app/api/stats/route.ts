import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb'; // Đảm bảo đường dẫn này đúng
import User from '@/lib/models/User';             // Đảm bảo đường dẫn này đúng
import Booking from '@/lib/models/Booking';       // Đảm bảo đường dẫn này đúng
import Song from '@/lib/models/Music';           // Lưu ý: Import Model 'Music' nhưng đặt tên là 'Song'
import Contact from '@/lib/models/Contact';       // Đảm bảo đường dẫn này đúng

export async function GET() {
    try {
        // Log trước khi kết nối
        console.log('[API /api/stats] Đang cố gắng kết nối tới DB...');
        await connectToDatabase();
        // Log sau khi kết nối thành công
        console.log('[API /api/stats] Đã kết nối DB. Bắt đầu đếm documents...');

        // Log ngay trước khi thực hiện các lệnh đếm
        console.log('[API /api/stats] Đang thực thi Promise.all cho các lệnh countDocuments...');
        const [userCount, bookingCount, songCount, contactCount] = await Promise.all([
            User.countDocuments(),
            Booking.countDocuments(),
            // Nhớ rằng: Biến 'Song' ở đây là Model 'Music', sẽ đếm collection 'musics'
            Song.countDocuments(),
            Contact.countDocuments()
        ]);

        // !!! Log quan trọng: In ra các giá trị đếm nhận được từ database !!!
        console.log(`[API /api/stats] Kết quả đếm nhận được - Users: ${userCount}, Bookings: ${bookingCount}, Songs (collection 'musics'): ${songCount}, Contacts: ${contactCount}`);

        // Chuẩn bị đối tượng JSON để trả về
        const stats = {
            users: userCount,
            bookings: bookingCount,
            // Frontend đang mong đợi key là 'songs', nên ta dùng giá trị songCount (từ collection 'musics') ở đây
            songs: songCount,
            contacts: contactCount
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