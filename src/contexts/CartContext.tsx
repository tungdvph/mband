// src/contexts/CartContext.tsx
'use client';

import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import { Schedule } from '@/types/schedule'; // Đảm bảo type Schedule có price

// Định nghĩa kiểu dữ liệu cho một item trong giỏ hàng
export interface CartItem extends Schedule {
    quantity: number;
}

// Định nghĩa kiểu dữ liệu cho Context
interface CartContextType {
    items: CartItem[];
    addToCart: (schedule: Schedule, quantity?: number) => void;
    removeFromCart: (scheduleId: string) => void;
    updateQuantity: (scheduleId: string, quantity: number) => void;
    clearCart: () => void;
    cartCount: number; // Tổng số lượng vé trong giỏ
    distinctItemCount: number; // Số loại sự kiện khác nhau
    totalPrice: number; // Tổng giá gốc
    discount: number; // Số tiền giảm giá
    finalPrice: number; // Giá cuối cùng sau giảm giá
}

// Tạo Context với giá trị mặc định (có thể là undefined hoặc null)
const CartContext = createContext<CartContextType | undefined>(undefined);

// Tạo Provider Component
interface CartProviderProps {
    children: ReactNode;
}

const DISCOUNT_THRESHOLD = 3; // Số loại sự kiện để được giảm giá
const DISCOUNT_PERCENTAGE = 0.2; // 20%

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>(() => {
        // Khởi tạo state từ localStorage nếu có
        if (typeof window !== 'undefined') {
            const savedCart = localStorage.getItem('shoppingCart');
            try {
                return savedCart ? JSON.parse(savedCart) : [];
            } catch (e) {
                console.error("Failed to parse cart from localStorage", e);
                return [];
            }
        }
        return [];
    });

    // Lưu vào localStorage mỗi khi items thay đổi
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('shoppingCart', JSON.stringify(items));
        }
    }, [items]);


    const addToCart = (schedule: Schedule, quantity: number = 1) => {
        setItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(item => item._id === schedule._id);
            if (existingItemIndex > -1) {
                // Nếu đã tồn tại, cập nhật số lượng
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex].quantity += quantity;
                return updatedItems;
            } else {
                // Nếu chưa tồn tại, thêm mới với số lượng là quantity
                // Chỉ thêm nếu có giá (hoặc giá là 0 - miễn phí)
                if (schedule.price !== undefined && schedule.price !== null) {
                    return [...prevItems, { ...schedule, quantity: quantity }];
                }
                // Không thêm nếu không có giá
                console.warn(`Schedule ${schedule._id} does not have a price and cannot be added to cart.`);
                return prevItems;
            }
        });
        // Có thể thêm thông báo ở đây (ví dụ: react-toastify)
        console.log(`Added ${quantity} of ${schedule.eventName} to cart.`);
    };

    const removeFromCart = (scheduleId: string) => {
        setItems(prevItems => prevItems.filter(item => item._id !== scheduleId));
    };

    const updateQuantity = (scheduleId: string, quantity: number) => {
        setItems(prevItems => {
            if (quantity <= 0) {
                // Nếu số lượng <= 0, xóa khỏi giỏ hàng
                return prevItems.filter(item => item._id !== scheduleId);
            }
            return prevItems.map(item =>
                item._id === scheduleId ? { ...item, quantity: quantity } : item
            );
        });
    };

    const clearCart = () => {
        setItems([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('shoppingCart');
        }
    };

    // Tính toán các giá trị dựa trên state `items`
    const { cartCount, distinctItemCount, totalPrice, discount, finalPrice } = useMemo(() => {
        const distinctItems = items.length; // Số loại sự kiện khác nhau
        const count = items.reduce((sum, item) => sum + item.quantity, 0);
        const total = items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);

        let calculatedDiscount = 0;
        if (distinctItems >= DISCOUNT_THRESHOLD) {
            calculatedDiscount = total * DISCOUNT_PERCENTAGE;
        }

        const final = total - calculatedDiscount;

        return {
            cartCount: count,
            distinctItemCount: distinctItems,
            totalPrice: total,
            discount: calculatedDiscount,
            finalPrice: final,
        };
    }, [items]);

    return (
        <CartContext.Provider value={{
            items,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartCount,
            distinctItemCount,
            totalPrice,
            discount,
            finalPrice
        }}>
            {children}
        </CartContext.Provider>
    );
};

// Tạo custom hook để sử dụng Context dễ dàng hơn
export const useCart = (): CartContextType => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};