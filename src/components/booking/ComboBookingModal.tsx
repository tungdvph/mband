// src/components/booking/ComboBookingModal.tsx
'use client';

import React, { useState, FormEvent } from 'react';
import { CartItem, PromotionRule } from '@/types/cart'; // Đảm bảo đường dẫn đúng
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaStickyNote, FaCalendarCheck, FaTicketAlt } from 'react-icons/fa';

interface ComboBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItems: CartItem[];
    subtotal: number;
    discountAmount: number;
    finalTotal: number;
    appliedPromotion: PromotionRule | null;
    onSubmitBooking: (customerDetails: CustomerDetails) => Promise<void>; // Hàm xử lý submit
}

export interface CustomerDetails {
    fullName: string;
    email: string;
    phoneNumber: string;
    notes?: string;
}

const ComboBookingModal: React.FC<ComboBookingModalProps> = ({
    isOpen,
    onClose,
    selectedItems,
    subtotal,
    discountAmount,
    finalTotal,
    appliedPromotion,
    onSubmitBooking,
}) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!fullName || !email || !phoneNumber) {
            setError('Vui lòng điền đầy đủ các trường bắt buộc (Họ tên, Email, Số điện thoại).');
            return;
        }
        // Basic email validation
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Định dạng email không hợp lệ.');
            return;
        }
        // Basic phone validation (simple check for digits, can be improved)
        if (!/^\d{10,}$/.test(phoneNumber.replace(/\s+/g, ''))) {
            setError('Số điện thoại không hợp lệ (cần ít nhất 10 chữ số).');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmitBooking({ fullName, email, phoneNumber, notes });
            // onClose(); // Đóng modal sau khi submit thành công (có thể do component cha xử lý)
        } catch (submissionError: any) {
            setError(submissionError.message || 'Đã xảy ra lỗi khi đặt vé. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header Modal */}
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Xác nhận Đặt Vé Combo</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-200"
                        aria-label="Đóng"
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                {/* Nội dung Modal */}
                <div className="overflow-y-auto pr-2 flex-grow">
                    {/* Thông tin các sự kiện đã chọn */}
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-700 mb-3">Các sự kiện đã chọn:</h3>
                        <div className="space-y-4 max-h-60 overflow-y-auto border rounded-md p-3 bg-gray-50">
                            {selectedItems.map(item => (
                                <div key={item._id} className="p-3 bg-white rounded shadow-sm border border-gray-200">
                                    <p className="font-semibold text-indigo-700">{item.eventName}</p>
                                    <p className="text-sm text-gray-600">
                                        Ngày: {item.date ? new Date(item.date).toLocaleDateString('vi-VN') : 'N/A'}
                                    </p>
                                    <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                                    <p className="text-sm text-gray-600">
                                        Đơn giá: {(item.price ?? 0).toLocaleString('vi-VN')} VND
                                    </p>
                                    <p className="text-sm font-medium text-gray-700">
                                        Thành tiền: {((item.price ?? 0) * item.quantity).toLocaleString('vi-VN')} VND
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tổng kết giá */}
                    <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <h3 className="text-xl font-semibold text-indigo-800 mb-3">Tổng thanh toán:</h3>
                        <div className="space-y-1 text-gray-700">
                            <p className="flex justify-between">
                                <span>Tạm tính:</span>
                                <span className="font-medium">{subtotal.toLocaleString('vi-VN')} VND</span>
                            </p>
                            {appliedPromotion && discountAmount > 0 && (
                                <>
                                    <p className="flex justify-between text-green-600">
                                        <span>Khuyến mãi ({appliedPromotion.description} -{appliedPromotion.discountPercentage}%):</span>
                                        <span className="font-medium">-{discountAmount.toLocaleString('vi-VN')} VND</span>
                                    </p>
                                </>
                            )}
                            <hr className="my-2 border-indigo-200" />
                            <p className="flex justify-between text-2xl font-bold text-indigo-700">
                                <span>Tổng cộng:</span>
                                <span>{finalTotal.toLocaleString('vi-VN')} VND</span>
                            </p>
                        </div>
                    </div>

                    {/* Form thông tin người đặt */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                <FaUser className="inline mr-2 mb-0.5" />Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                <FaEnvelope className="inline mr-2 mb-0.5" />Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                <FaPhone className="inline mr-2 mb-0.5" />Số điện thoại <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                id="phoneNumber"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                <FaStickyNote className="inline mr-2 mb-0.5" />Ghi chú (nếu có)
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </form>
                </div>

                {/* Footer Modal - Nút Submit */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <button
                        type="submit"
                        onClick={handleSubmit} // Gắn handleSubmit vào đây để form có thể submit bằng nút này
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <FaCalendarCheck className="mr-2" /> Xác nhận Đặt Combo
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComboBookingModal;
