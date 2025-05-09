import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { publicAuthOptions } from '@/lib/publicAuth';
import { connectToDatabase } from '@/lib/mongodb';
import UserCartItem, { IUserCartItem, CartScheduleInfo } from '@/lib/models/UserCartItem';
import ScheduleModel, { ISchedule, IVenue } from '@/lib/models/Schedule'; // Model Schedule gốc của bạn
import mongoose, { Types } from 'mongoose';
import { CartItem as ClientCartItem } from '@/types/cart'; // Type CartItem dùng ở client

// Helper chuyển đổi DB Item sang Client Item
function dbToClientCartItem(dbItem: IUserCartItem): ClientCartItem {
    const details = dbItem.scheduleDetails; // details là kiểu CartScheduleInfo

    // Tạo đối tượng ClientCartItem với các chuyển đổi kiểu cần thiết
    const clientItem: ClientCartItem = {
        _id: dbItem.scheduleId.toString(), // Sử dụng scheduleId làm _id ở client
        eventName: details.eventName,
        date: typeof details.date === 'string' ? details.date : details.date.toISOString(),
        startTime: details.startTime || '',
        endTime: details.endTime,
        venue: details.venue,
        price: details.price === null ? undefined : details.price,
        quantity: dbItem.quantity,
        description: details.description,
        type: details.type as any,
        status: details.status as any,
        // Chuyển đổi createdAt và updatedAt thành chuỗi ISO để khớp với kiểu 'string' mong đợi
        createdAt: dbItem.createdAt.toISOString(), // << THAY ĐỔI: Chuyển Date thành string
        updatedAt: dbItem.updatedAt.toISOString(), // << THAY ĐỔI: Chuyển Date thành string
    };
    return clientItem;
}

// GET: Lấy giỏ hàng của người dùng
export async function GET(request: Request) {
    try {
        const session = await getServerSession(publicAuthOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const userId = new Types.ObjectId(session.user.id);
        await connectToDatabase();
        const cartItemsDocs = await UserCartItem.find({ userId }).sort({ addedAt: -1 }).lean();

        const clientCartItems: ClientCartItem[] = cartItemsDocs.map(doc => dbToClientCartItem(doc as IUserCartItem));
        return NextResponse.json(clientCartItems);
    } catch (error) {
        console.error('Error fetching cart:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cart';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}

// POST: Thêm sản phẩm vào giỏ hàng (hoặc cập nhật số lượng nếu đã tồn tại)
export async function POST(request: Request) {
    try {
        const session = await getServerSession(publicAuthOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const userId = new Types.ObjectId(session.user.id);

        const scheduleDataFromClient: { _id: string; quantity: number;[key: string]: any } = await request.json();

        if (!scheduleDataFromClient._id || typeof scheduleDataFromClient.quantity !== 'number' || scheduleDataFromClient.quantity < 1) {
            return NextResponse.json({ message: 'Invalid schedule ID or quantity' }, { status: 400 });
        }
        const scheduleId = new Types.ObjectId(scheduleDataFromClient._id);

        await connectToDatabase();

        const originalSchedule = await ScheduleModel.findById(scheduleId).lean<ISchedule>();
        if (!originalSchedule) {
            return NextResponse.json({ message: 'Schedule not found' }, { status: 404 });
        }

        const scheduleDetails: CartScheduleInfo = {
            _id: originalSchedule._id,
            eventName: originalSchedule.eventName,
            date: originalSchedule.date,
            startTime: originalSchedule.startTime,
            endTime: originalSchedule.endTime,
            venue: originalSchedule.venue,
            price: originalSchedule.price,
            description: originalSchedule.description,
            type: originalSchedule.type,
            status: originalSchedule.status,
        };

        let cartItemDoc = await UserCartItem.findOne({ userId, scheduleId });

        if (cartItemDoc) {
            cartItemDoc.quantity += scheduleDataFromClient.quantity;
            cartItemDoc.scheduleDetails = scheduleDetails;
            await cartItemDoc.save();
        } else {
            cartItemDoc = await UserCartItem.create({
                userId,
                scheduleId,
                scheduleDetails,
                quantity: scheduleDataFromClient.quantity,
            });
        }
        return NextResponse.json(dbToClientCartItem(cartItemDoc as IUserCartItem), { status: (cartItemDoc as any).isNew ? 201 : 200 });
    } catch (error) {
        console.error('Error adding to cart:', error);
        if ((error as any).code === 11000) {
            return NextResponse.json({ message: 'Conflict adding item, possibly already exists. Try refreshing.' }, { status: 409 });
        }
        const errorMessage = error instanceof Error ? error.message : 'Failed to add to cart';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}

// DELETE: Xóa toàn bộ giỏ hàng của người dùng
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(publicAuthOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const userId = new Types.ObjectId(session.user.id);
        await connectToDatabase();
        await UserCartItem.deleteMany({ userId });
        return NextResponse.json({ message: 'Cart cleared successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error clearing cart:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to clear cart';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
