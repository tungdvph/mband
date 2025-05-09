import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { publicAuthOptions } from '@/lib/publicAuth';
import { connectToDatabase } from '@/lib/mongodb';
import UserCartItem, { IUserCartItem, CartScheduleInfo } from '@/lib/models/UserCartItem';
// ScheduleModel không được sử dụng trực tiếp trong file này, có thể bỏ import nếu không cần
// import ScheduleModel, { ISchedule, IVenue } from '@/lib/models/Schedule';
import mongoose, { Types } from 'mongoose';
import { CartItem as ClientCartItem } from '@/types/cart'; // Type CartItem dùng ở client

interface RouteParams {
    params: { scheduleId: string };
}

// Helper chuyển đổi DB Item sang Client Item
function dbToClientCartItem(dbItem: IUserCartItem): ClientCartItem {
    const details = dbItem.scheduleDetails;

    const clientItem: ClientCartItem = {
        _id: dbItem.scheduleId.toString(),
        eventName: details.eventName,
        // Chuyển đổi date: Nếu là Date object, chuyển sang ISO string.
        date: typeof details.date === 'string' ? details.date : details.date.toISOString(),
        // Chuyển đổi startTime: Nếu undefined, gán chuỗi rỗng.
        startTime: details.startTime || '',
        endTime: details.endTime, // Giả sử ClientCartItem.endTime chấp nhận string | undefined
        venue: details.venue, // Giả sử IVenue trong CartScheduleInfo khớp với kiểu venue của ClientCartItem
        // Chuyển đổi price: Nếu null, gán undefined.
        price: details.price === null ? undefined : details.price,
        quantity: dbItem.quantity,
        description: details.description, // Giả sử ClientCartItem.description chấp nhận string | undefined
        type: details.type as any, // Giữ lại 'as any' nếu ClientCartItem.type không khớp hoàn toàn
        status: details.status as any, // Giữ lại 'as any' nếu ClientCartItem.status không khớp hoàn toàn
        // Thêm và chuyển đổi createdAt, updatedAt sang ISO string
        createdAt: dbItem.createdAt.toISOString(),
        updatedAt: dbItem.updatedAt.toISOString(),
    };
    return clientItem;
}

// PUT: Cập nhật số lượng của một item trong giỏ hàng
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(publicAuthOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const userId = new Types.ObjectId(session.user.id);
        const scheduleId = new Types.ObjectId(params.scheduleId);

        const { quantity } = await request.json();
        if (typeof quantity !== 'number') { // Chỉ cần kiểm tra kiểu, vì quantity <= 0 sẽ xóa
            return NextResponse.json({ message: 'Invalid quantity format' }, { status: 400 });
        }

        await connectToDatabase();

        if (quantity <= 0) {
            // Nếu quantity <= 0, xóa item khỏi giỏ hàng
            const deletedItem = await UserCartItem.findOneAndDelete({ userId, scheduleId });
            if (!deletedItem) {
                return NextResponse.json({ message: 'Item not found in cart to delete' }, { status: 404 });
            }
            return NextResponse.json({ message: 'Item removed due to zero or invalid quantity', removedItemId: params.scheduleId }, { status: 200 });
        } else {
            // Nếu quantity > 0, cập nhật số lượng
            // Lưu ý: Khi cập nhật, chúng ta không cập nhật lại scheduleDetails ở đây.
            // Nếu scheduleDetails cần được làm mới, logic đó nên được xử lý cẩn thận hơn,
            // có thể cần fetch lại thông tin Schedule gốc.
            // Hiện tại, chỉ cập nhật quantity.
            const updatedItemDoc = await UserCartItem.findOneAndUpdate(
                { userId, scheduleId },
                { $set: { quantity } }, // Chỉ cập nhật quantity
                { new: true } // Trả về document đã được cập nhật
            ).lean(); // Sử dụng lean() để lấy plain JS object

            if (!updatedItemDoc) {
                // Nếu không tìm thấy item để cập nhật (ví dụ: item đã bị xóa trước đó)
                // Cân nhắc tạo mới item nếu đó là hành vi mong muốn, hoặc trả lỗi.
                // Hiện tại, trả lỗi 404.
                return NextResponse.json({ message: 'Item not found in cart to update' }, { status: 404 });
            }
            // Ép kiểu updatedItemDoc thành IUserCartItem trước khi truyền vào dbToClientCartItem
            return NextResponse.json(dbToClientCartItem(updatedItemDoc as IUserCartItem));
        }
    } catch (error) {
        console.error('Error updating cart item:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update cart item';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}

// DELETE: Xóa một item cụ thể khỏi giỏ hàng
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(publicAuthOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const userId = new Types.ObjectId(session.user.id);
        const scheduleId = new Types.ObjectId(params.scheduleId);

        await connectToDatabase();
        const deletedItem = await UserCartItem.findOneAndDelete({ userId, scheduleId });

        if (!deletedItem) {
            return NextResponse.json({ message: 'Item not found in cart' }, { status: 404 });
        }
        // Trả về ID của item đã xóa để client có thể cập nhật UI
        return NextResponse.json({ message: 'Item removed successfully', removedItemId: params.scheduleId });
    } catch (error) {
        console.error('Error removing cart item:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove cart item';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
