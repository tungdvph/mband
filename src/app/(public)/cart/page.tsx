// src/app/(public)/cart/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { CartItem, PromotionRule } from '@/types/cart';
import { FaTrashAlt, FaCheckCircle, FaRegCircle, FaPlus, FaMinus, FaGift } from 'react-icons/fa';
import { PROMOTION_RULES } from '@/config/promotions';
import ComboBookingModal, { CustomerDetails } from '@/components/booking/ComboBookingModal';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';

export default function CartPage() {
    const {
        cartItems,
        removeFromCart,
        selectedItemIdsForCheckout,
        toggleSelectItemForCheckout,
        updateItemQuantity,
        getPromotionForSelectedItems,
        getCartItemCount,
        selectAllItemsForCheckout,
        deselectAllItemsForCheckout,
        clearCart,
    } = useCart();
    const router = useRouter();

    const [showComboBookingModal, setShowComboBookingModal] = useState(false);
    const { data: session, status: authStatus } = useSession();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const currentAppliedPromotion = getPromotionForSelectedItems();
    // const totalUniqueItemsInCart = getCartItemCount(); // Biến này có vẻ không được sử dụng, có thể bỏ

    const selectedItems: CartItem[] = useMemo(() =>
        cartItems.filter(item => selectedItemIdsForCheckout.includes(item._id)),
        [cartItems, selectedItemIdsForCheckout]
    );
    const selectedUniqueItemsCount = selectedItems.length;

    const selectedItemsSubtotal = useMemo(() =>
        selectedItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0),
        [selectedItems]
    );

    const { discountAmount, finalSelectedItemsTotal } = useMemo(() => {
        let discount = 0;
        let finalTotal = selectedItemsSubtotal;
        if (currentAppliedPromotion && selectedItems.length > 0) {
            discount = (selectedItemsSubtotal * currentAppliedPromotion.discountPercentage) / 100;
            finalTotal = selectedItemsSubtotal - discount;
        }
        return { discountAmount: discount, finalSelectedItemsTotal: finalTotal };
    }, [selectedItemsSubtotal, currentAppliedPromotion, selectedItems.length]);

    const handleOpenComboBookingModal = () => {
        if (authStatus === 'loading') {
            toast.info("Đang kiểm tra trạng thái đăng nhập...");
            return;
        }

        if (authStatus === 'authenticated') {
            if (selectedItemIdsForCheckout.length > 0) {
                setShowComboBookingModal(true);
            } else {
                toast.warn("Vui lòng chọn ít nhất một sự kiện để tiến hành đặt vé.");
            }
        } else {
            setShowLoginPrompt(true);
        }
    };

    const handleCloseComboBookingModal = () => {
        setShowComboBookingModal(false);
    };

    const handleComboBookingSubmit = async (customerDetails: CustomerDetails) => {
        if (selectedItems.length === 0) {
            toast.error("Không có sự kiện nào được chọn để đặt.");
            return;
        }

        const bookingPayload = {
            customerDetails,
            bookedItems: selectedItems.map(item => ({
                scheduleId: item._id,
                eventName: item.eventName,
                date: item.date,
                ticketCount: item.quantity,
                priceAtBooking: item.price ?? 0,
            })),
            totalPrice: finalSelectedItemsTotal,
            ticketCount: selectedItems.reduce((sum, item) => sum + item.quantity, 0),
            status: 'pending',
            bookingType: 'combo',
            appliedPromotion: currentAppliedPromotion ? {
                description: currentAppliedPromotion.description,
                discountPercentage: currentAppliedPromotion.discountPercentage,
            } : null,
        };

        try {
            const response = await fetch('/api/ticket-booking/combo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingPayload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Lỗi không xác định từ server." }));
                throw new Error(errorData.message || `Lỗi ${response.status}: Không thể đặt vé combo.`);
            }

            const newBooking = await response.json();
            toast.success(`Đặt combo thành công! Mã đặt vé của bạn: ${newBooking?._id || 'N/A'}`);

            const idsToRemove = selectedItems.map(item => item._id);
            idsToRemove.forEach(id => removeFromCart(id));

            setShowComboBookingModal(false);
            router.push('/booking/history');

        } catch (error: any) {
            console.error("Lỗi khi đặt vé combo:", error);
            toast.error(error.message || "Đã xảy ra lỗi khi đặt vé combo. Vui lòng thử lại.");
            throw error;
        }
    };

    const isAllSelected = cartItems.length > 0 && selectedItemIdsForCheckout.length === cartItems.length;

    const handleToggleSelectAll = () => {
        if (isAllSelected) {
            deselectAllItemsForCheckout();
        } else {
            selectAllItemsForCheckout();
        }
    };

    const sortedPromotionRulesForDisplay = useMemo(() =>
        [...PROMOTION_RULES].sort((a, b) => a.minItems - b.minItems),
        []
    );

    const closeLoginPrompt = () => setShowLoginPrompt(false);
    const handleGoLogin = () => {
        router.push('/login');
        closeLoginPrompt();
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-16 min-h-screen">
                <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-800">Giỏ Hàng Của Bạn</h1>

                {cartItems.length === 0 ? (
                    <div className="text-center text-gray-500 bg-white p-10 rounded-lg shadow">
                        <p className="text-xl mb-4">Giỏ hàng của bạn đang trống.</p>
                        <Link href="/schedule">
                            <span className="text-blue-600 hover:text-blue-800 font-semibold">
                                Xem lịch trình và thêm sự kiện!
                            </span>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
                        <div className="mb-4 flex justify-end">
                            <button
                                onClick={handleToggleSelectAll}
                                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                            >
                                {isAllSelected ? `Bỏ chọn tất cả (${selectedItemIdsForCheckout.length})` : `Chọn tất cả (${cartItems.length})`}
                            </button>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {cartItems.map((item: CartItem) => {
                                const isSelected = selectedItemIdsForCheckout.includes(item._id);
                                return (
                                    <li key={item._id} className={`py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${isSelected ? 'bg-green-50 -mx-4 px-4 rounded-lg shadow-sm border border-green-200' : 'border-b border-gray-200 last:border-b-0'}`}>
                                        <div className="flex items-center flex-shrink-0 mr-4 order-1 md:order-none self-center md:self-auto">
                                            <button
                                                onClick={() => toggleSelectItemForCheckout(item._id)}
                                                title={isSelected ? "Bỏ chọn" : "Chọn để đặt vé"}
                                                className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${isSelected
                                                    ? 'text-green-600 bg-green-100 hover:bg-green-200 focus:ring-green-500'
                                                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 focus:ring-blue-500'
                                                    }`}
                                            >
                                                {isSelected ? <FaCheckCircle className="w-6 h-6" /> : <FaRegCircle className="w-6 h-6" />}
                                            </button>
                                        </div>

                                        <div className="flex-grow text-center md:text-left mb-4 md:mb-0 order-3 md:order-none w-full md:w-auto">
                                            <h2 className="text-lg font-semibold text-gray-900">{item.eventName}</h2>
                                            <p className="text-sm text-gray-600">
                                                {item.date ? new Date(item.date).toLocaleDateString('vi-VN') : 'N/A'} | {item.startTime} | {item.venue.name}
                                            </p>
                                            <p className="text-sm font-bold text-indigo-600 mt-1">
                                                Giá vé: {item.price ? `${item.price.toLocaleString('vi-VN')} VND` : 'Miễn phí'}
                                            </p>
                                            <div className="flex items-center justify-center md:justify-start mt-3 space-x-2">
                                                <button
                                                    onClick={() => {
                                                        updateItemQuantity(item._id, item.quantity - 1);
                                                        if (item.quantity - 1 > 0) toast.info(`Đã cập nhật số lượng cho ${item.eventName}`);
                                                        else toast.info(`${item.eventName} đã được xóa khỏi giỏ`);
                                                    }}
                                                    disabled={item.quantity <= 1 && item.price !== 0}
                                                    className="p-1.5 border rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Giảm số lượng"
                                                >
                                                    <FaMinus className="w-3 h-3" />
                                                </button>
                                                <span className="px-3 py-1 text-gray-800 font-medium tabular-nums w-8 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => {
                                                        updateItemQuantity(item._id, item.quantity + 1);
                                                        toast.info(`Đã cập nhật số lượng cho ${item.eventName}`);
                                                    }}
                                                    className="p-1.5 border rounded text-gray-600 hover:bg-gray-100"
                                                    title="Tăng số lượng"
                                                >
                                                    <FaPlus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-800 mt-2">
                                                Thành tiền: {((item.price ?? 0) * item.quantity).toLocaleString('vi-VN')} VND
                                            </p>
                                        </div>

                                        <div className="flex items-center flex-shrink-0 order-2 md:order-none ml-auto md:ml-0 self-start md:self-center">
                                            <button
                                                onClick={() => {
                                                    removeFromCart(item._id);
                                                    toast.info(`${item.eventName} đã được xóa khỏi giỏ hàng.`);
                                                }}
                                                title="Xóa khỏi giỏ hàng"
                                                className="p-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <FaTrashAlt className="w-5 h-5" />
                                                <span className="sr-only">Xóa</span>
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="mt-10 pt-6 border-t border-gray-300">
                            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Thanh Toán Đơn Hàng</h2>
                            {selectedItems.length > 0 ? (
                                <div className="bg-indigo-50 p-6 rounded-lg shadow">
                                    <h3 className="text-xl font-semibold mb-4 text-indigo-800">
                                        Tổng kết {selectedItems.length} sự kiện đã chọn:
                                    </h3>
                                    <div className="space-y-2 text-gray-700">
                                        {/* ... các chi tiết tổng kết ... */}
                                        <p className="flex justify-between">
                                            <span>Số loại sự kiện đã chọn:</span>
                                            <span className="font-medium">{selectedUniqueItemsCount}</span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span>Tổng số vé đã chọn:</span>
                                            <span className="font-medium">
                                                {selectedItems.reduce((sum, currentItem) => sum + currentItem.quantity, 0)}
                                            </span>
                                        </p>
                                        <hr className="my-2" />
                                        <p className="flex justify-between text-lg">
                                            <span>Tạm tính:</span>
                                            <span className="font-semibold">{selectedItemsSubtotal.toLocaleString('vi-VN')} VND</span>
                                        </p>
                                        {currentAppliedPromotion && (
                                            <>
                                                <div className='my-3 p-3 bg-green-100 border border-green-300 rounded-md text-green-700'>
                                                    <p className='font-semibold text-sm'>
                                                        🎉 Áp dụng: {currentAppliedPromotion.description} (-{currentAppliedPromotion.discountPercentage}%)
                                                    </p>
                                                </div>
                                                <p className="flex justify-between text-lg text-red-600">
                                                    <span>Giảm giá:</span>
                                                    <span className="font-semibold">-{discountAmount.toLocaleString('vi-VN')} VND</span>
                                                </p>
                                            </>
                                        )}
                                        <hr className="my-3 border-t-2 border-dashed border-indigo-200" />
                                        <p className="flex justify-between text-2xl font-bold text-indigo-600">
                                            <span>Tổng cộng:</span>
                                            <span>{finalSelectedItemsTotal.toLocaleString('vi-VN')} VND</span>
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 my-8">
                                    Vui lòng chọn các sự kiện bạn muốn đặt vé từ danh sách ở trên.
                                </p>
                            )}
                            <div className="mt-8 text-center">
                                <button
                                    onClick={handleOpenComboBookingModal}
                                    disabled={selectedItems.length === 0 || authStatus === 'loading'}
                                    className="w-full md:w-auto px-10 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg shadow-md hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {authStatus === 'loading' ? 'Đang kiểm tra...' : `Tiến hành đặt vé (${selectedItems.length} sự kiện đã chọn)`}
                                </button>
                                {selectedItems.length === 0 && cartItems.length > 0 && (
                                    <p className='text-sm text-red-500 mt-3'>Bạn chưa chọn sự kiện nào để đặt vé.</p>
                                )}
                            </div>
                        </div>

                        {cartItems.length > 0 && (
                            <div className="mt-12 pt-8 border-t border-gray-300">
                                <h3 className="text-xl font-semibold mb-4 text-center text-gray-700 flex items-center justify-center">
                                    <FaGift className="mr-2 text-yellow-500" /> Các Ưu Đãi Khác
                                </h3>
                                <div className="space-y-3">
                                    {/* ... hiển thị các quy tắc khuyến mãi ... */}
                                    {sortedPromotionRulesForDisplay.map((rule) => {
                                        const isCurrentlyAppliedToSelection = currentAppliedPromotion &&
                                            currentAppliedPromotion.minItems === rule.minItems &&
                                            currentAppliedPromotion.discountPercentage === rule.discountPercentage;
                                        const itemsNeededForThisRuleBasedOnSelection = rule.minItems - selectedUniqueItemsCount;

                                        if (isCurrentlyAppliedToSelection) return null;

                                        if (itemsNeededForThisRuleBasedOnSelection <= 0) {
                                            return (
                                                <div key={rule.description} className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                                                    <p className="text-blue-700">
                                                        Bạn <span className="font-semibold">đã đủ điều kiện</span> cho: <span className="font-semibold">"{rule.description}"</span> (giảm {rule.discountPercentage}%) với các sự kiện đang chọn.
                                                        {currentAppliedPromotion && currentAppliedPromotion.discountPercentage < rule.discountPercentage && (
                                                            <span className="block text-xs italic">Đây là ưu đãi tốt hơn khuyến mãi hiện tại của bạn!</span>
                                                        )}
                                                        {!currentAppliedPromotion && (
                                                            <span className="block text-xs italic">Hãy chọn các sự kiện này để nhận ưu đãi!</span>
                                                        )}
                                                    </p>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div key={rule.description} className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                                                    <p className="text-yellow-700">
                                                        💡 Chọn thêm <span className="font-bold">{itemsNeededForThisRuleBasedOnSelection} loại sự kiện khác</span> vào lựa chọn của bạn để được: <span className="font-semibold">"{rule.description}"</span> (giảm {rule.discountPercentage}%).
                                                    </p>
                                                </div>
                                            );
                                        }
                                    })}
                                    {PROMOTION_RULES.length === 0 && <p className="text-center text-gray-500">Hiện chưa có chương trình khuyến mãi nào.</p>}
                                    {PROMOTION_RULES.length > 0 && sortedPromotionRulesForDisplay.every(rule => (currentAppliedPromotion &&
                                        currentAppliedPromotion.minItems === rule.minItems &&
                                        currentAppliedPromotion.discountPercentage === rule.discountPercentage) || (rule.minItems - selectedUniqueItemsCount > 0)) && !currentAppliedPromotion && selectedUniqueItemsCount === 0 && (
                                            <p className="text-center text-gray-500 italic text-sm mt-4">Chọn sự kiện để xem các ưu đãi hấp dẫn!</p>
                                        )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ComboBookingModal
                isOpen={showComboBookingModal}
                onClose={handleCloseComboBookingModal}
                selectedItems={selectedItems}
                subtotal={selectedItemsSubtotal}
                discountAmount={discountAmount}
                finalTotal={finalSelectedItemsTotal}
                appliedPromotion={currentAppliedPromotion}
                onSubmitBooking={handleComboBookingSubmit}
            />

            {/* Khung Thông báo Yêu cầu Đăng nhập ĐÃ CẬP NHẬT */}
            {showLoginPrompt && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center p-4">
                    {/* Lớp phủ nền, sử dụng RGBA trực tiếp */}
                    <div
                        className="fixed inset-0 bg-[rgba(0,0,0,0.3)] transition-opacity" // << THAY ĐỔI Ở ĐÂY
                        onClick={closeLoginPrompt}
                    ></div>
                    <div
                        className="relative max-w-md w-full bg-yellow-50 border border-yellow-300 p-8 pt-10 rounded-lg shadow-xl text-center transform transition-all scale-95 opacity-0 animate-fade-in-scale z-[101]"
                        style={{ animationFillMode: 'forwards', animationDuration: '0.2s' }}
                    >
                        {/* Nút đóng 'X' */}
                        <button
                            onClick={closeLoginPrompt}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded-full transition-colors"
                            title="Đóng"
                            aria-label="Đóng thông báo"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <style jsx>{`
                            @keyframes fade-in-scale {
                                from { opacity: 0; transform: scale(0.95); }
                                to { opacity: 1; transform: scale(1); }
                            }
                            .animate-fade-in-scale {
                                animation-name: fade-in-scale;
                            }
                        `}</style>
                        <svg className="mx-auto mb-4 w-12 h-12 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                        </svg>
                        <h2 className="text-2xl font-semibold text-yellow-800 mb-4">Yêu cầu Đăng nhập</h2>
                        <p className="text-gray-700 mb-6">
                            Bạn cần đăng nhập để tiến hành đặt vé.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                            <button onClick={handleGoLogin} className="px-6 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out w-full sm:w-auto">
                                Đăng nhập
                            </button>
                            <button onClick={closeLoginPrompt} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-150 ease-in-out w-full sm:w-auto">
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}