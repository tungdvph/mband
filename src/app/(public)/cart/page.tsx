// src/app/(public)/cart/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Nếu muốn hiển thị ảnh sự kiện
import { FaTrashAlt, FaPlus, FaMinus, FaShoppingBag, FaTag } from 'react-icons/fa';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { useSession } from 'next-auth/react'; // Để lấy thông tin user nếu đã đăng nhập
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify'; // Dùng lại toastify
import 'react-toastify/dist/ReactToastify.css';

// Hàm format giá (có thể import từ schedule page hoặc định nghĩa lại)
const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null) return 'N/A';
    if (price === 0) return 'Miễn phí';
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};


export default function CartPage() {
    const {
        items,
        removeFromCart,
        updateQuantity,
        cartCount,
        distinctItemCount,
        totalPrice,
        discount,
        finalPrice,
        clearCart // Lấy hàm clearCart
    } = useCart();
    const { data: session } = useSession(); // Lấy session để điền form nếu có
    const router = useRouter();

    // --- State cho Form Checkout ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cod'); // Mặc định COD
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState(''); // Thêm trường ghi chú nếu muốn

    // Tự động điền thông tin nếu user đã đăng nhập
    useEffect(() => {
        if (session?.user) {
            setFullName(session.user.name ?? '');
            setEmail(session.user.email ?? '');
            // Lấy SĐT hoặc địa chỉ từ user profile nếu có
            // setPhoneNumber(session.user.phoneNumber ?? '');
            // setAddress(session.user.address ?? '');
        }
    }, [session]);

    // --- Hàm xử lý Checkout ---
    const handleCheckout = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // Ngăn form submit mặc định
        setIsSubmitting(true);

        if (!fullName || !email || !phoneNumber || (paymentMethod === 'cod' && !address)) {
            toast.error("Vui lòng điền đầy đủ thông tin bắt buộc (*).");
            setIsSubmitting(false);
            return;
        }

        if (items.length === 0) {
            toast.error("Giỏ hàng của bạn đang trống.");
            setIsSubmitting(false);
            return;
        }

        try {
            // Tạo payload gửi lên API
            const payload = {
                cartItems: items.map(item => ({ // Chỉ gửi thông tin cần thiết
                    scheduleId: item._id,
                    eventName: item.eventName,
                    quantity: item.quantity,
                    price: item.price,
                })),
                customerInfo: {
                    fullName,
                    email,
                    phoneNumber,
                    address: paymentMethod === 'cod' ? address : undefined, // Chỉ gửi địa chỉ nếu COD
                    userId: session?.user?.id, // Gửi ID user nếu đăng nhập
                    notes,
                },
                payment: {
                    method: paymentMethod,
                    totalAmount: totalPrice,
                    discountAmount: discount,
                    finalAmount: finalPrice,
                },
                distinctItemCount: distinctItemCount // Gửi số loại SP để backend có thể kiểm tra lại discount
            };

            // Gọi API endpoint mới cho checkout giỏ hàng
            const response = await fetch('/api/cart-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Đặt hàng thất bại và không thể đọc lỗi chi tiết.' }));
                throw new Error(errorData.error || 'Đặt hàng thất bại.');
            }

            // const result = await response.json(); // Dữ liệu trả về từ API (ví dụ: mã đơn hàng)
            toast.success('Đặt hàng thành công! Cảm ơn bạn.');
            setBookingSuccess(true);
            clearCart(); // Xóa giỏ hàng sau khi thành công

        } catch (err) {
            console.error('Checkout error:', err);
            toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi không mong muốn khi đặt hàng.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render ---

    if (bookingSuccess) {
        return (
            <Layout>
                <ToastContainer />
                <div className="container mx-auto px-4 py-16 text-center">
                    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                        <svg className="mx-auto mb-4 w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <h1 className="text-3xl font-bold mb-4 text-gray-800">Đặt hàng thành công!</h1>
                        <p className="mb-6 text-gray-600">
                            Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xử lý đơn hàng của bạn sớm nhất có thể.
                            {paymentMethod === 'cod' && " Shipper sẽ liên hệ với bạn để giao hàng."}
                            {paymentMethod === 'online' && " Vui lòng kiểm tra email để xem hướng dẫn thanh toán (nếu có)."}
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href="/schedule" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                                Tiếp tục mua sắm
                            </Link>
                            <Link href="/" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                                Về trang chủ
                            </Link>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <ToastContainer />
            <div className="container mx-auto px-4 py-12 md:py-16">
                <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800 flex items-center">
                    <FaShoppingBag className="mr-3 text-indigo-600" /> Giỏ hàng của bạn
                </h1>

                {items.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg shadow">
                        <p className="text-xl text-gray-500 mb-6">Giỏ hàng của bạn đang trống.</p>
                        <Link href="/schedule" className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow hover:from-blue-600 hover:to-indigo-700 transition duration-150">
                            Khám phá sự kiện
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                        {/* Cột danh sách sản phẩm */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-6 border-b pb-3 text-gray-700">Chi tiết giỏ hàng ({cartCount} vé)</h2>
                            <div className="space-y-5">
                                {items.map(item => (
                                    <div key={item._id} className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-5 last:border-b-0">
                                        {/* Thông tin sản phẩm */}
                                        <div className="flex items-center gap-4 flex-grow w-full sm:w-auto">
                                            {/* Có thể thêm ảnh nếu Schedule có trường image */}
                                            {/* <Image src={item.imageUrl || '/placeholder.png'} alt={item.eventName} width={60} height={60} className="rounded" /> */}
                                            <div className="flex-grow">
                                                <Link href={`/schedule/${item._id}`} className="font-semibold text-gray-800 hover:text-indigo-600 text-base line-clamp-2">
                                                    {item.eventName}
                                                </Link>
                                                <p className="text-sm text-gray-500">{formatPrice(item.price)}</p>
                                            </div>
                                        </div>

                                        {/* Điều chỉnh số lượng và Xóa */}
                                        <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto justify-between sm:justify-end">
                                            {/* Số lượng */}
                                            <div className="flex items-center border border-gray-300 rounded">
                                                <button
                                                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                    className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                                    disabled={item.quantity <= 1}
                                                    title="Giảm số lượng"
                                                >
                                                    <FaMinus size={12} />
                                                </button>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const newQuantity = parseInt(e.target.value, 10);
                                                        if (!isNaN(newQuantity) && newQuantity >= 0) { // Cho phép nhập số 0 để xóa
                                                            updateQuantity(item._id, newQuantity);
                                                        } else if (e.target.value === '') {
                                                            // Nếu xóa trắng input, có thể tạm coi là 1 hoặc chờ blur
                                                        }
                                                    }}
                                                    onBlur={(e) => { // Xử lý khi người dùng bỏ focus khỏi input
                                                        const finalQuantity = parseInt(e.target.value, 10);
                                                        if (isNaN(finalQuantity) || finalQuantity <= 0) {
                                                            updateQuantity(item._id, 1); // Nếu không hợp lệ, quay về 1
                                                            // Hoặc gọi removeFromCart nếu muốn xóa khi nhập 0
                                                            // if(finalQuantity === 0) removeFromCart(item._id)
                                                        }
                                                    }}
                                                    className="w-12 text-center border-l border-r border-gray-300 text-sm py-1 focus:outline-none"
                                                    min="1"
                                                />
                                                <button
                                                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                    className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                                    title="Tăng số lượng"
                                                >
                                                    <FaPlus size={12} />
                                                </button>
                                            </div>

                                            {/* Tổng tiền item */}
                                            <span className="font-semibold text-gray-800 w-24 text-right">{formatPrice((item.price ?? 0) * item.quantity)}</span>

                                            {/* Nút xóa */}
                                            <button
                                                onClick={() => removeFromCart(item._id)}
                                                className="text-red-500 hover:text-red-700"
                                                title="Xóa khỏi giỏ hàng"
                                            >
                                                <FaTrashAlt size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cột Tóm tắt đơn hàng và Checkout */}
                        <div className="lg:col-span-1">
                            <form onSubmit={handleCheckout} className="bg-white p-6 rounded-lg shadow-md sticky top-24"> {/* Sticky summary */}
                                <h2 className="text-xl font-semibold mb-5 border-b pb-3 text-gray-700">Tóm tắt đơn hàng</h2>

                                <div className="space-y-3 mb-5 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tạm tính ({distinctItemCount} loại vé):</span>
                                        <span className="font-medium text-gray-800">{formatPrice(totalPrice)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            {/* Bọc toàn bộ chuỗi text trong {} */}
                                            <span><FaTag className="inline mr-1" />{' Giảm giá (>=3 loại):'}</span>
                                            <span className="font-medium">-{formatPrice(discount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold pt-3 border-t mt-3">
                                        <span>Tổng cộng:</span>
                                        <span>{formatPrice(finalPrice)}</span>
                                    </div>
                                </div>

                                <h2 className="text-xl font-semibold mb-4 border-t pt-4 text-gray-700">Thông tin đặt hàng</h2>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="Nguyễn Văn A" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="example@domain.com" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                                        <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="0987654321" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
                                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-indigo-500 focus:border-indigo-500">
                                            <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                                            <option value="online" disabled>Thanh toán online (Sắp có)</option> {/* Tạm thời disable */}
                                        </select>
                                    </div>
                                    {paymentMethod === 'cod' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ nhận vé/hàng <span className="text-red-500">*</span></label>
                                            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="Số nhà, đường, phường, quận, thành phố" required={paymentMethod === 'cod'} />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (Tùy chọn)</label>
                                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="Yêu cầu thêm (ví dụ: thời gian giao hàng)..."></textarea>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || items.length === 0}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg shadow-md hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
                                </button>
                                <p className="text-xs text-gray-500 mt-3 text-center">Bằng việc nhấn nút, bạn đồng ý với Điều khoản dịch vụ của chúng tôi.</p>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}