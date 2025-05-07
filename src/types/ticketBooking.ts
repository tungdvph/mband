// /types/ticketBooking.ts
import { Types } from 'mongoose';
import { Schedule } from './schedule';
import { User } from './user';

export interface BookedItemDetailClient {
    scheduleId: string;
    eventName: string;
    date?: Date | string;
    ticketCount: number;
    priceAtBooking: number;
    _id?: string;
}

export interface TicketBooking {
    _id: string;
    userId?: Pick<User, '_id' | 'fullName' | 'email'> | null;
    customerDetails: {
        fullName: string;
        email: string;
        phoneNumber: string;
        notes?: string;
    };
    scheduleId?: Pick<Schedule, '_id' | 'eventName' | 'date' | 'price'> | null;
    bookingType: 'single' | 'combo';
    bookedItems: BookedItemDetailClient[];
    ticketCount: number;
    totalPrice: number;
    priceBeforeDiscount?: number;
    appliedPromotion?: {
        description: string;
        discountPercentage: number;
    } | null;
    status: 'pending' | 'confirmed' | 'cancelled' | 'delivered'; // <--- THÊM 'delivered'
    paymentDetails?: {
        paymentMethod?: string;
        transactionId?: string;
        paidAt?: Date | string;
    };
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface TicketBookingStatusUpdateData {
    status: 'pending' | 'confirmed' | 'cancelled' | 'delivered'; // <--- THÊM 'delivered'
}