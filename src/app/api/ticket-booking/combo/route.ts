// src/app/api/ticket-booking/combo/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TicketBooking, { ITicketBooking, BookedItemDetail } from '@/lib/models/TicketBooking';
import Schedule, { ISchedule } from '@/lib/models/Schedule';
import { getServerSession } from "next-auth/next";
import { publicAuthOptions } from "@/lib/publicAuth";
import { PROMOTION_RULES } from '@/config/promotions';
import { PromotionRule } from '@/types/cart';
import mongoose, { Types, HydratedDocument } from 'mongoose';

interface PromotionEvaluationItem {
    scheduleId: string;
    ticketCount: number;
    priceAtBooking: number;
}

const calculatePromotion = (itemsToEvaluate: PromotionEvaluationItem[]): PromotionRule | null => {
    const uniqueItemCount = itemsToEvaluate.length;
    const sortedRules = [...PROMOTION_RULES].sort((a, b) => b.minItems - a.minItems);
    for (const rule of sortedRules) {
        if (uniqueItemCount >= rule.minItems) {
            return rule;
        }
    }
    return null;
};

// Kiểu dữ liệu để tạo TicketBooking, loại bỏ các trường Mongoose và userId (sẽ được thêm riêng)
type BaseTicketBookingCreationData = Omit<ITicketBooking, '_id' | 'createdAt' | 'updatedAt' | 'userId' | keyof mongoose.Document>;

interface TicketBookingCreationData extends BaseTicketBookingCreationData {
    userId?: Types.ObjectId | null;
}

export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const session = await getServerSession(publicAuthOptions);
        const body = await request.json();
        const { customerDetails, bookedItems } = body;

        // --- VALIDATION ---
        if (!customerDetails || !customerDetails.fullName || !customerDetails.email || !customerDetails.phoneNumber) {
            return NextResponse.json({ message: 'Thiếu thông tin khách hàng bắt buộc (Họ tên, Email, SĐT).' }, { status: 400 });
        }
        if (!/^\S+@\S+\.\S+/.test(customerDetails.email)) {
            return NextResponse.json({ message: 'Định dạng email không hợp lệ.' }, { status: 400 });
        }
        if (!/^\d{10,}$/.test(customerDetails.phoneNumber.replace(/\s+/g, ''))) {
            return NextResponse.json({ message: 'Số điện thoại không hợp lệ (cần ít nhất 10 chữ số).' }, { status: 400 });
        }
        if (!Array.isArray(bookedItems) || bookedItems.length === 0) {
            return NextResponse.json({ message: 'Cần có ít nhất một sự kiện trong đơn đặt vé.' }, { status: 400 });
        }

        let serverCalculatedSubtotal = 0;
        let serverTotalTicketCount = 0;
        const validatedBookedItemsForDB: BookedItemDetail[] = [];
        const itemsForPromotionEvaluation: PromotionEvaluationItem[] = [];

        for (const item of bookedItems) {
            if (!item.scheduleId || typeof item.ticketCount !== 'number' || typeof item.priceAtBooking === 'undefined' || !item.eventName) {
                return NextResponse.json({ message: `Dữ liệu không hợp lệ cho một mục trong đơn đặt vé: ${JSON.stringify(item)}` }, { status: 400 });
            }

            // Sử dụng HydratedDocument để có kiểu _id chính xác
            const schedule: HydratedDocument<ISchedule> | null = await Schedule.findById(item.scheduleId as string);

            if (!schedule) {
                return NextResponse.json({ message: `Sự kiện với ID ${item.scheduleId} (${item.eventName}) không tồn tại.` }, { status: 404 });
            }
            // schedule._id bây giờ sẽ có kiểu Types.ObjectId nếu ISchedule được định nghĩa đúng

            const currentPrice = schedule.price ?? 0;
            const ticketCountNum = Number(item.ticketCount);

            validatedBookedItemsForDB.push({
                scheduleId: schedule._id, // schedule._id giờ là Types.ObjectId
                eventName: schedule.eventName,
                date: schedule.date,
                ticketCount: ticketCountNum,
                priceAtBooking: currentPrice,
            });

            itemsForPromotionEvaluation.push({
                scheduleId: schedule._id.toString(), // Chuyển ObjectId thành string
                ticketCount: ticketCountNum,
                priceAtBooking: currentPrice,
            });

            serverCalculatedSubtotal += (currentPrice * ticketCountNum);
            serverTotalTicketCount += ticketCountNum;
        }

        if (serverTotalTicketCount === 0) {
            return NextResponse.json({ message: 'Tổng số vé phải lớn hơn 0.' }, { status: 400 });
        }

        const serverAppliedPromotion = calculatePromotion(itemsForPromotionEvaluation);
        let serverFinalTotalPrice = serverCalculatedSubtotal;
        if (serverAppliedPromotion) {
            serverFinalTotalPrice -= (serverCalculatedSubtotal * serverAppliedPromotion.discountPercentage) / 100;
        }
        serverFinalTotalPrice = Math.max(0, serverFinalTotalPrice);

        let finalUserId: Types.ObjectId | null | undefined = undefined;
        if (session?.user?.id) {
            if (Types.ObjectId.isValid(session.user.id)) {
                finalUserId = new Types.ObjectId(session.user.id);
            } else {
                console.warn(`UserID từ session không hợp lệ: ${session.user.id}`);
            }
        }

        const newBookingData: TicketBookingCreationData = {
            customerDetails,
            bookingType: 'combo',
            bookedItems: validatedBookedItemsForDB,
            ticketCount: serverTotalTicketCount,
            totalPrice: serverFinalTotalPrice,
            priceBeforeDiscount: serverCalculatedSubtotal,
            appliedPromotion: serverAppliedPromotion ? {
                description: serverAppliedPromotion.description,
                discountPercentage: serverAppliedPromotion.discountPercentage,
            } : null,
            status: 'pending',
            scheduleId: null,
            userId: finalUserId,
        };

        const createdBooking = await TicketBooking.create(newBookingData);
        return NextResponse.json(createdBooking, { status: 201 });

    } catch (error: any) {
        console.error('Lỗi khi tạo combo booking:', error);
        let errorMessage = 'Lỗi máy chủ khi tạo đặt vé combo.';
        if (error.name === 'ValidationError') {
            errorMessage = 'Dữ liệu không hợp lệ: ';
            for (const field in error.errors) {
                errorMessage += `${error.errors[field].message} `;
            }
            return NextResponse.json({ message: errorMessage.trim() }, { status: 400 });
        }
        return NextResponse.json({ message: errorMessage, error: error.message }, { status: 500 });
    }
}
