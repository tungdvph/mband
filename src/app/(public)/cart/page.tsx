// src/app/(public)/cart/page.tsx
'use client';

import React, { useMemo } from 'react'; // *** THÊM useMemo VÀO ĐÂY ***
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { CartItem, PromotionRule } from '@/types/cart';
import { FaTrashAlt, FaCheckCircle, FaRegCircle, FaPlus, FaMinus, FaGift } from 'react-icons/fa';
import { PROMOTION_RULES } from '@/config/promotions';

export default function CartPage() {
    const {
        cartItems,
        removeFromCart,
        selectedItemIdsForCheckout,
        toggleSelectItemForCheckout,
        updateItemQuantity,
        getPromotionForSelectedItems,
        // getCartItemCount, // Có thể không cần dùng trực tiếp nếu đã có sortedPromotionRulesForDisplay
        // getTotalTicketCount,
        selectAllItemsForCheckout,
        deselectAllItemsForCheckout,
    } = useCart();
    const router = useRouter();

    const currentAppliedPromotion = getPromotionForSelectedItems();

    const handleProceedToCheckout = () => {
        if (selectedItemIdsForCheckout.length > 0) {
            router.push('/checkout');
        } else {
            alert("Vui lòng chọn ít nhất một sự kiện để tiến hành đặt vé.");
        }
    };

    const selectedItems: CartItem[] = cartItems.filter(item =>
        selectedItemIdsForCheckout.includes(item._id)
    );
    const selectedUniqueItemsCount = selectedItems.length;

    const selectedItemsSubtotal = selectedItems.reduce(
        (sum, item) => sum + (item.price ?? 0) * item.quantity,
        0
    );

    let discountAmount = 0;
    let finalSelectedItemsTotal = selectedItemsSubtotal;

    if (currentAppliedPromotion && selectedItems.length > 0) {
        discountAmount = (selectedItemsSubtotal * currentAppliedPromotion.discountPercentage) / 100;
        finalSelectedItemsTotal = selectedItemsSubtotal - discountAmount;
    }

    const isAllSelected = cartItems.length > 0 && selectedItemIdsForCheckout.length === cartItems.length;

    const handleToggleSelectAll = () => {
        if (isAllSelected) {
            deselectAllItemsForCheckout();
        } else {
            selectAllItemsForCheckout();
        }
    };

    // Sắp xếp PROMOTION_RULES theo minItems tăng dần để hiển thị gợi ý tốt hơn
    const sortedPromotionRulesForDisplay = useMemo(() =>
        [...PROMOTION_RULES].sort((a, b) => a.minItems - b.minItems),
        [] // PROMOTION_RULES là hằng số từ import, không thay đổi nên dependency array rỗng
    );

    return (
        <Layout>
            <div className="container mx-auto px-4 py-16 min-h-screen">
                <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-800">Giỏ Hàng Của Bạn</h1>

                {cartItems.length === 0 ? (
                    <div className="text-center text-gray-500 bg-white p-10 rounded-lg shadow">
                        {/* ... (phần giỏ hàng trống) ... */}
                        <p className="text-xl mb-4">Giỏ hàng của bạn đang trống.</p>
                        <Link href="/schedule">
                            <span className="text-blue-600 hover:text-blue-800 font-semibold">
                                Xem lịch trình và thêm sự kiện!
                            </span>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
                        {/* ... (phần còn lại của component giữ nguyên như trước) ... */}
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
                                                {new Date(item.date).toLocaleDateString('vi-VN')} | {item.startTime} | {item.venue.name}
                                            </p>
                                            <p className="text-sm font-bold text-indigo-600 mt-1">
                                                Giá vé: {item.price ? `${item.price.toLocaleString('vi-VN')} VND` : 'Miễn phí'}
                                            </p>
                                            <div className="flex items-center justify-center md:justify-start mt-3 space-x-2">
                                                <button
                                                    onClick={() => updateItemQuantity(item._id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1 && item.price !== 0}
                                                    className="p-1.5 border rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Giảm số lượng"
                                                >
                                                    <FaMinus className="w-3 h-3" />
                                                </button>
                                                <span className="px-3 py-1 text-gray-800 font-medium tabular-nums w-8 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateItemQuantity(item._id, item.quantity + 1)}
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
                                                onClick={() => removeFromCart(item._id)}
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

                        {/* === PHẦN THANH TOÁN === */}
                        <div className="mt-10 pt-6 border-t border-gray-300">
                            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Thanh Toán Đơn Hàng</h2>
                            {selectedItems.length > 0 ? (
                                <div className="bg-indigo-50 p-6 rounded-lg shadow">
                                    <h3 className="text-xl font-semibold mb-4 text-indigo-800">
                                        Tổng kết {selectedItems.length} sự kiện đã chọn:
                                    </h3>
                                    <div className="space-y-2 text-gray-700">
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
                                    onClick={handleProceedToCheckout}
                                    disabled={selectedItems.length === 0}
                                    className="w-full md:w-auto px-10 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg shadow-md hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    Tiến hành đặt vé ({selectedItems.length} sự kiện đã chọn)
                                </button>
                                {selectedItems.length === 0 && cartItems.length > 0 && (
                                    <p className='text-sm text-red-500 mt-3'>Bạn chưa chọn sự kiện nào để đặt vé.</p>
                                )}
                            </div>
                        </div>

                        {/* === PHẦN GỢI Ý KHUYẾN MÃI === */}
                        {cartItems.length > 0 && (
                            <div className="mt-12 pt-8 border-t border-gray-300">
                                <h3 className="text-xl font-semibold mb-4 text-center text-gray-700 flex items-center justify-center">
                                    <FaGift className="mr-2 text-yellow-500" /> Các Ưu Đãi Khác
                                </h3>
                                <div className="space-y-3">
                                    {sortedPromotionRulesForDisplay.map((rule) => {
                                        const isCurrentlyAppliedToSelection = currentAppliedPromotion &&
                                            currentAppliedPromotion.minItems === rule.minItems &&
                                            currentAppliedPromotion.discountPercentage === rule.discountPercentage;

                                        const itemsNeededForThisRuleBasedOnSelection = rule.minItems - selectedUniqueItemsCount;

                                        if (isCurrentlyAppliedToSelection) {
                                            // Không hiển thị lại nếu nó đã là KM đang được áp dụng cho lựa chọn,
                                            // vì nó đã được hiển thị ở phần tổng kết thanh toán.
                                            return null;
                                        }

                                        if (itemsNeededForThisRuleBasedOnSelection <= 0) {
                                            // Đủ điều kiện với lựa chọn hiện tại, nhưng không phải là KM tốt nhất được áp dụng
                                            // hoặc người dùng có thể chọn thêm để đạt KM này nếu nó tốt hơn
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
                                            // Gợi ý mua thêm
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
        </Layout>
    );
}