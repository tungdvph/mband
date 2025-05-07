// src/contexts/CartContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { CartItem, CartContextProps, PromotionRule } from '@/types/cart';
import { Schedule } from '@/types/schedule';
import { PROMOTION_RULES } from '@/config/promotions'; // Đảm bảo bạn đã tạo file này

const CartContext = createContext<CartContextProps | undefined>(undefined);

interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedItemIdsForCheckout, setSelectedItemIdsForCheckout] = useState<string[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load giỏ hàng và các mục đã chọn từ localStorage khi component mount
    useEffect(() => {
        const storedCart = localStorage.getItem('shoppingCart');
        const storedSelectedItems = localStorage.getItem('selectedCartItems');

        if (storedCart) {
            try {
                const parsedCart: CartItem[] = JSON.parse(storedCart);
                // Đảm bảo tất cả item đều có quantity hợp lệ
                const validatedCart = parsedCart.map(item => ({
                    ...item,
                    quantity: (typeof item.quantity === 'number' && item.quantity > 0) ? item.quantity : 1,
                }));
                setCartItems(validatedCart);
            } catch (error) {
                console.error("Lỗi khi parse giỏ hàng từ localStorage:", error);
                localStorage.removeItem('shoppingCart');
            }
        }

        if (storedSelectedItems) {
            try {
                const parsedSelectedItems: string[] = JSON.parse(storedSelectedItems);
                setSelectedItemIdsForCheckout(parsedSelectedItems);
            } catch (error) {
                console.error("Lỗi khi parse các mục đã chọn từ localStorage:", error);
                localStorage.removeItem('selectedCartItems');
            }
        }
        setIsInitialized(true);
    }, []);

    // Lưu giỏ hàng và các mục đã chọn vào localStorage mỗi khi chúng thay đổi
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('shoppingCart', JSON.stringify(cartItems));
            localStorage.setItem('selectedCartItems', JSON.stringify(selectedItemIdsForCheckout));
        }
    }, [cartItems, selectedItemIdsForCheckout, isInitialized]);

    const addToCart = useCallback((scheduleToAdd: Schedule) => {
        setCartItems((prevItems) => {
            const existingItemIndex = prevItems.findIndex((cartItem) => cartItem._id === scheduleToAdd._id);
            if (existingItemIndex > -1) {
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    quantity: updatedItems[existingItemIndex].quantity + 1,
                };
                // Cân nhắc sử dụng thư viện thông báo (toast) thay vì alert
                alert(`Đã cập nhật số lượng cho "${scheduleToAdd.eventName}" trong giỏ hàng!`);
                return updatedItems;
            } else {
                alert(`Đã thêm "${scheduleToAdd.eventName}" vào giỏ hàng!`);
                return [...prevItems, { ...scheduleToAdd, quantity: 1 }];
            }
        });
    }, []);

    const removeFromCart = useCallback((itemId: string) => {
        setCartItems((prevItems) => prevItems.filter((item) => item._id !== itemId));
        setSelectedItemIdsForCheckout(prevSelected => prevSelected.filter(id => id !== itemId));
        alert('Đã xóa sự kiện khỏi giỏ hàng.');
    }, []);

    const updateItemQuantity = useCallback((itemId: string, newQuantity: number) => {
        setCartItems((prevItems) => {
            if (newQuantity <= 0) {
                alert('Sự kiện đã được xóa khỏi giỏ hàng do số lượng bằng 0.');
                setSelectedItemIdsForCheckout(prevSelected => prevSelected.filter(id => id !== itemId));
                return prevItems.filter(item => item._id !== itemId);
            }
            return prevItems.map(item =>
                item._id === itemId ? { ...item, quantity: newQuantity } : item
            );
        });
    }, []);

    const toggleSelectItemForCheckout = useCallback((itemId: string) => {
        setSelectedItemIdsForCheckout(prevSelectedIds =>
            prevSelectedIds.includes(itemId)
                ? prevSelectedIds.filter(id => id !== itemId)
                : [...prevSelectedIds, itemId]
        );
    }, []);

    const selectAllItemsForCheckout = useCallback(() => {
        setSelectedItemIdsForCheckout(cartItems.map(item => item._id));
    }, [cartItems]);

    const deselectAllItemsForCheckout = useCallback(() => {
        setSelectedItemIdsForCheckout([]);
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
        setSelectedItemIdsForCheckout([]);
        alert('Giỏ hàng đã được làm trống.');
    }, []);

    const getCartItemCount = useCallback((): number => {
        return cartItems.length; // Số loại sự kiện khác nhau
    }, [cartItems]);

    const getTotalTicketCount = useCallback((): number => {
        return cartItems.reduce((total, item) => total + item.quantity, 0); // Tổng số vé
    }, [cartItems]);

    // Helper function chung để tính toán khuyến mãi dựa trên một danh sách các item
    const getPromotionLogic = useCallback((itemsToEvaluate: CartItem[]): PromotionRule | null => {
        const uniqueItemCount = itemsToEvaluate.length; // Logic khuyến mãi dựa trên số loại sự kiện khác nhau
        for (const rule of PROMOTION_RULES) { // PROMOTION_RULES đã được sắp xếp từ cao xuống thấp
            if (uniqueItemCount >= rule.minItems) {
                return rule;
            }
        }
        return null;
    }, []); // PROMOTION_RULES là hằng số từ import

    const getPromotionForCart = useCallback((): PromotionRule | null => {
        // Khuyến mãi dựa trên toàn bộ giỏ hàng (có thể dùng để gợi ý)
        return getPromotionLogic(cartItems);
    }, [cartItems, getPromotionLogic]);

    const getPromotionForSelectedItems = useCallback((): PromotionRule | null => {
        // Khuyến mãi dựa trên các mục đã được chọn để thanh toán
        const selectedItems = cartItems.filter(item => selectedItemIdsForCheckout.includes(item._id));
        return getPromotionLogic(selectedItems);
    }, [cartItems, selectedItemIdsForCheckout, getPromotionLogic]);

    const contextValue = useMemo(() => (isInitialized ? {
        cartItems,
        selectedItemIdsForCheckout,
        addToCart,
        removeFromCart,
        updateItemQuantity,
        toggleSelectItemForCheckout,
        selectAllItemsForCheckout,
        deselectAllItemsForCheckout,
        clearCart,
        getCartItemCount,
        getTotalTicketCount,
        getPromotionForCart,
        getPromotionForSelectedItems,
    } : undefined), [
        isInitialized, cartItems, selectedItemIdsForCheckout,
        addToCart, removeFromCart, updateItemQuantity, toggleSelectItemForCheckout,
        selectAllItemsForCheckout, deselectAllItemsForCheckout, clearCart,
        getCartItemCount, getTotalTicketCount, getPromotionForCart, getPromotionForSelectedItems
    ]);

    // Không render gì cho đến khi khởi tạo xong phía client để tránh hydration mismatch
    if (!isInitialized) {
        return null;
    }

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = (): CartContextProps => {
    const context = useContext(CartContext);

    const dummyValues: CartContextProps = {
        cartItems: [],
        selectedItemIdsForCheckout: [],
        addToCart: (schedule: Schedule) => console.warn('addToCart được gọi trên giỏ hàng chưa khởi tạo', schedule),
        removeFromCart: (itemId: string) => console.warn('removeFromCart được gọi trên giỏ hàng chưa khởi tạo', itemId),
        updateItemQuantity: (itemId: string, newQuantity: number) => console.warn('updateItemQuantity được gọi trên giỏ hàng chưa khởi tạo', itemId, newQuantity),
        toggleSelectItemForCheckout: (itemId: string) => console.warn('toggleSelectItemForCheckout được gọi trên giỏ hàng chưa khởi tạo', itemId),
        selectAllItemsForCheckout: () => console.warn('selectAllItemsForCheckout được gọi trên giỏ hàng chưa khởi tạo'),
        deselectAllItemsForCheckout: () => console.warn('deselectAllItemsForCheckout được gọi trên giỏ hàng chưa khởi tạo'),
        clearCart: () => console.warn('clearCart được gọi trên giỏ hàng chưa khởi tạo'),
        getCartItemCount: () => 0,
        getTotalTicketCount: () => 0,
        getPromotionForCart: () => null,
        getPromotionForSelectedItems: () => null,
    };

    if (context === undefined) {
        // Chỉ cảnh báo ở client nếu context vẫn undefined sau khi quá trình khởi tạo المفترض đã diễn ra
        if (typeof window !== 'undefined' && document.readyState === 'complete') {
            // document.readyState === 'complete' là một cách kiểm tra thêm rằng client đã tải xong
            console.warn('useCart được gọi khi CartContext chưa hoàn toàn khởi tạo hoặc nằm ngoài CartProvider. Trả về giá trị mặc định.');
        }
        return dummyValues;
    }
    return context;
};