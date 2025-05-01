// /app/api/ticket-booking/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb'; // Đảm bảo đường dẫn đúng
import TicketBooking from '@/lib/models/TicketBooking'; // Import model
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { adminAuthOptions } from '@/lib/adminAuth'; // Dùng cho admin cập nhật/xóa
import { TicketBookingStatusUpdateData } from '@/types/ticketBooking'; // Import type nếu cần

// Khuyến nghị sử dụng runtime Node.js
export const runtime = 'nodejs';

// === PUT: Cập nhật trạng thái của một lượt đặt vé (cho admin) ===
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    console.log(`--- [API] PUT /api/ticket-booking/${params.id} (Admin Update Status Attempt) ---`);
    const { id } = params;

    // 1. Kiểm tra ID hợp lệ
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        console.error("   Validation Error: Invalid ticket booking ID format.");
        return NextResponse.json({ error: 'ID đặt vé không hợp lệ' }, { status: 400 });
    }

    try {
        // 2. Xác thực quyền admin
        console.log("   Getting ADMIN session...");
        const session = await getServerSession(adminAuthOptions); // <<< Dùng adminAuthOptions
        if (!session || session.user?.role !== 'admin') {
            console.warn("   Admin authorization failed.");
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
        }
        console.log(`   Admin User ID: ${session.user.id} performing update.`);

        // 3. Kết nối DB
        console.log("   Connecting to DB...");
        await connectToDatabase();
        console.log("   DB Connected.");

        // 4. Parse body request để lấy status mới
        console.log("   Parsing request body (JSON)...");
        const body: TicketBookingStatusUpdateData = await request.json();
        const newStatus = body.status;
        console.log(`   Received new status: ${newStatus}`);

        // 5. Validate status mới
        if (!newStatus || !['pending', 'confirmed', 'cancelled'].includes(newStatus)) {
            console.error(`   Validation Error: Invalid status value received: ${newStatus}`);
            return NextResponse.json({ error: 'Trạng thái cập nhật không hợp lệ' }, { status: 400 });
        }

        // 6. Tìm và cập nhật booking trong DB
        console.log(`   Finding and updating booking with ID: ${id} to status: ${newStatus}...`);
        const updatedBooking = await TicketBooking.findByIdAndUpdate(
            id,
            { status: newStatus },
            { new: true, runValidators: true } // Trả về document mới, chạy validators
        );

        // 7. Kiểm tra kết quả cập nhật
        if (!updatedBooking) {
            console.error(`   Ticket booking with ID ${id} not found for update.`);
            return NextResponse.json({ error: 'Không tìm thấy lượt đặt vé để cập nhật' }, { status: 404 });
        }

        console.log(`   Successfully updated booking ID ${id} to status ${newStatus}`);
        // 8. Trả về dữ liệu booking đã cập nhật
        return NextResponse.json(updatedBooking, { status: 200 });

    } catch (error: any) {
        console.error(`--- [API ERROR] PUT /api/ticket-booking/${id}: ---`, error);
        if (error.name === 'ValidationError') {
            console.error("   Validation Error Details:", error.errors);
            return NextResponse.json({ error: `Lỗi validation: ${error.message}` }, { status: 400 });
        }
        if (error.name === 'CastError' && error.path === '_id') {
            return NextResponse.json({ error: 'Invalid ticket booking ID format' }, { status: 400 });
        }
        // Lỗi server chung
        return NextResponse.json({ error: 'Lỗi phía server khi cập nhật trạng thái', details: error.message }, { status: 500 });
    }
}


// === DELETE: Xóa một lượt đặt vé (cho admin) ===
// (Hàm DELETE bạn đã viết - hãy đảm bảo nó nằm trong file này)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    console.log(`--- [API] DELETE /api/ticket-booking/${params.id} (Admin Delete Attempt) ---`);
    const { id } = params;

    // 1. Kiểm tra ID hợp lệ
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        console.error("   Validation Error: Invalid ticket booking ID format.");
        return NextResponse.json({ error: 'Invalid ticket booking ID format' }, { status: 400 });
    }

    try {
        // 2. Xác thực quyền admin
        console.log("   Getting ADMIN session...");
        const session = await getServerSession(adminAuthOptions);
        if (!session || session.user?.role !== 'admin') {
            console.warn("   Admin authorization failed.");
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
        }
        console.log(`   Admin User ID: ${session.user.id} performing delete.`);

        // 3. Kết nối Database
        console.log("   Connecting to DB...");
        await connectToDatabase();
        console.log("   DB Connected.");

        // 4. Tìm và xóa đặt vé
        console.log(`   Finding and deleting booking with ID: ${id}...`);
        const deletedBooking = await TicketBooking.findByIdAndDelete(id);
        if (!deletedBooking) {
            console.error(`   Ticket booking with ID ${id} not found for deletion.`);
            return NextResponse.json({ error: 'Ticket booking not found' }, { status: 404 });
        }

        console.log(`   Successfully deleted booking with ID: ${id}`);
        // 5. Trả về thông báo thành công
        return NextResponse.json({
            success: true,
            message: 'Ticket booking deleted successfully',
            deletedId: deletedBooking._id
        }, { status: 200 }); // Trả về 200 OK hoặc 204 No Content

    } catch (error: any) {
        console.error(`--- [API ERROR] DELETE /api/ticket-booking/${id}: ---`, error);
        if (error.name === 'CastError' && error.path === '_id') {
            return NextResponse.json({ error: 'Invalid ticket booking ID format' }, { status: 400 });
        }
        return NextResponse.json({
            error: 'Error deleting ticket booking',
            details: error.message
        }, { status: 500 });
    }
}

