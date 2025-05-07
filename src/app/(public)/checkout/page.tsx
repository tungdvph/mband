// src/app/api/cart-checkout/route.ts
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { Schedule } from '@/types/schedule';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext'; // Dùng CartContext
import { PromotionRule } from '@/types/cart';

export default function CheckoutPage() {
    const router = useRouter();
    const {
        cartItems,
        selectedItemIdForCheckout,
        getPromotionForCart,
        clearCart // Để xóa giỏ hàng sau khi thành công
    } = useCart();

    // Lấy thông tin sự kiện được chọn từ giỏ hàng
    const selectedSchedule = useMemo(() => {
        if (!selectedItemIdForCheckout) return null;
        return cartItems.find(item => item._id === selectedItemIdForCheckout) || null;
    }, [cartItems, selectedItemIdForCheckout]);

    // Lấy thông tin khuyến mãi áp dụng
    const applicablePromotion: PromotionRule | null = useMemo(() => getPromotionForCart(), [cartItems]);


    const [loading, setLoading] = useState(false); // Chỉ loading lúc submit
    const [error, setError] = useState<string | null>(null);
    // Giữ lại state số lượng vé = 1 vì ta chỉ checkout 1 item đã chọn
    const ticketCount = 1;
    const [paymentMethod, setPaymentMethod] = useState('cod');
    // Các state thông tin người dùng
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [promotionCode, setPromotionCode] = useState(''); // State cho mã KM nhập tay (nếu có)

    // Tính toán giá
    const originalTicketPrice = useMemo(() => selectedSchedule?.price ?? 0, [selectedSchedule]);
    const discountPercentage = useMemo(() => applicablePromotion?.discountPercentage ?? 0, [applicablePromotion]);
    const discountAmount = useMemo(() => (originalTicketPrice * discountPercentage) / 100, [originalTicketPrice, discountPercentage]);
    const finalPrice = useMemo(() => originalTicketPrice - discountAmount, [originalTicketPrice, discountAmount]);

    // Redirect nếu không có item nào được chọn hoặc không tìm thấy item
    useEffect(() => {
        if (!selectedItemIdForCheckout || !selectedSchedule) {
            console.warn("No item selected for checkout or item not found, redirecting to cart.");
            router.replace('/cart'); // Dùng replace để không lưu vào history
        }
    }, [selectedItemIdForCheckout, selectedSchedule, router]);

    const handleCheckoutSubmit = async () => {
        if (!selectedSchedule) return;

        // Validation cơ bản
        if (!fullName || !email || !phoneNumber || (paymentMethod === 'cod' && !address)) {
            alert("Vui lòng điền đầy đủ thông tin bắt buộc.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/cart-checkout', { // Gọi API mới
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectedScheduleId: selectedSchedule._id,
                    ticketCount: ticketCount, // Luôn là 1 trong logic này
                    originalPrice: originalTicketPrice,
                    discountPercentage: discountPercentage, // Gửi % KM đã tính
                    finalPrice: finalPrice, // Gửi giá cuối cùng
                    paymentMethod,
                    // Thông tin người dùng
                    fullName,
                    email,
                    phoneNumber,
                    address: paymentMethod === 'cod' ? address : undefined,
                    // Gửi thêm thông tin về giỏ hàng để backend xác thực KM (ví dụ: số lượng item)
                    cartItemCount: cartItems.length, // Số lượng item trong giỏ lúc checkout
                    appliedPromotionDescription: applicablePromotion?.description, // Mô tả KM đã áp dụng
                    // promotionCode: promotionCode // Gửi mã KM nếu có nhập tay
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to checkout and cannot parse error' }));
                throw new Error(errorData.error || 'Failed to complete checkout');
            }

            // const data = await response.json();
            setBookingSuccess(true);
            clearCart(); // Xóa giỏ hàng sau khi checkout thành công

        } catch (err) {
            console.error('Checkout error:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during checkout');
            alert(err instanceof Error ? err.message : 'An unknown error occurred during checkout');
        } finally {
            setLoading(false);
        }
    };

    // --- Giao diện thành công (tương tự trang đặt vé) ---
    if (bookingSuccess) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
                        <h1 className="text-3xl font-bold mb-4">Đặt vé thành công!</h1>
                        <p className="mb-6 text-gray-600">
                            Cảm ơn bạn đã đặt vé sự kiện "{selectedSchedule?.eventName}". Chúng tôi sẽ liên hệ với bạn sớm (nếu cần).
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link
                                href="/schedule"
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Xem thêm sự kiện
                            </Link>
                            <Link
                                href="/"
                                className="px-6 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Về trang chủ
                            </Link>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    // --- Giao diện chính của trang Checkout ---
    // Redirect nếu selectedSchedule chưa load xong (do useEffect ở trên)
    if (!selectedSchedule) {
        return (
            <Layout><div className="container mx-auto px-4 py-16 text-center">Đang tải thông tin checkout...</div></Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-16">
                {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded mb-4">Lỗi: {error}</p>}

                <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                    <div className="mb-6">
                        <Link href="/cart">
                            <span className="text-red-600 hover:text-red-700">← Quay lại giỏ hàng</span>
                        </Link>
                    </div>

                    <h1 className="text-3xl font-bold mb-4">Xác nhận đặt vé</h1>
                    {/* Thông tin sự kiện được chọn */}
                    <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
                        <h2 className="text-lg font-semibold mb-2">Sự kiện đã chọn: {selectedSchedule.eventName}</h2>
                        <div className='text-sm space-y-1'>
                            <p><strong>Ngày:</strong> {new Date(selectedSchedule.date).toLocaleDateString('vi-VN')}</p>
                            <p><strong>Thời gian:</strong> {selectedSchedule.startTime}{selectedSchedule.endTime ? ` - ${selectedSchedule.endTime}` : ''}</p>
                            <p><strong>Địa điểm:</strong> {selectedSchedule.venue.name} - {selectedSchedule.venue.city}</p>
                            <p><strong>Số lượng:</strong> {ticketCount} vé</p>
                        </div>
                        {/* Thông tin giá và khuyến mãi */}
                        <div className='mt-4 pt-4 border-t'>
                            <p className="text-md">Giá gốc: {originalTicketPrice.toLocaleString('vi-VN')} VND</p>
                            {applicablePromotion && (
                                <>
                                    <p className="text-sm text-green-600">Khuyến mãi ({applicablePromotion.description}): -{discountPercentage}%</p>
                                    <p className="text-sm text-green-600">Tiền giảm: -{discountAmount.toLocaleString('vi-VN')} VND</p>
                                </>
                            )}
                            <p className="text-lg font-bold text-indigo-700 mt-1">
                                Thành tiền: {finalPrice.toLocaleString('vi-VN')} VND
                            </p>
                        </div>
                    </div>


                    {/* --- Phần Thông tin người đặt (Tương tự trang đặt vé) --- */}
                    <h2 className="text-xl font-semibold mb-4 border-t pt-4">Thông tin người đặt</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full input-class" placeholder="Nguyễn Văn A" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full input-class" placeholder="example@domain.com" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full input-class" placeholder="0987654321" required />
                        </div>
                    </div>
                    {/* Style chung cho input */}
                    <style jsx>{`.input-class { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s; } .input-class:focus { border-color: #4F46E5; box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.3); }`}</style>


                    {/* --- Phần Thanh toán (Tương tự trang đặt vé) --- */}
                    <h2 className="text-xl font-semibold mb-4 border-t pt-4">Thanh toán</h2>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phương thức thanh toán</label>
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                            <option value="online">Thanh toán online</option>
                        </select>
                    </div>

                    {paymentMethod === 'cod' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ nhận vé/hàng <span className="text-red-500">*</span></label>
                            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full input-class" placeholder="Số nhà, đường, phường, quận, thành phố" required={paymentMethod === 'cod'} />
                            <p className="text-xs text-gray-500 mt-1">Cần thiết nếu bạn chọn thanh toán khi nhận hàng.</p>
                        </div>
                    )}

                    {paymentMethod === 'online' && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                            <p className="text-sm font-medium">Tính năng đang hoàn thiện.</p>
                            <p className="text-xs mt-1">Chúng tôi sẽ sớm cập nhật. Vui lòng chọn COD hoặc liên hệ để được hỗ trợ.</p>
                        </div>
                    )}

                    {/* --- Nút Xác nhận Checkout --- */}
                    <div className="mt-8 text-center">
                        <button
                            onClick={handleCheckoutSubmit}
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg shadow-md hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-60"
                        >
                            {loading ? 'Đang xử lý...' : 'Hoàn tất đặt vé'}
                        </button>
                    </div>
                </div>

            </div>
        </Layout>
    );
}