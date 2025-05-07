// src/types/cart.ts
import { Schedule } from './schedule';

export interface CartItem extends Schedule {
    quantity: number;
}

export interface PromotionRule {
    minItems: number; // Số lượng loại sự kiện khác nhau tối thiểu để áp dụng
    discountPercentage: number;
    description: string;
}

// Định nghĩa trạng thái cốt lõi của giỏ hàng
export interface CartState {
    cartItems: CartItem[];
    selectedItemIdsForCheckout: string[]; // Cho phép chọn nhiều
}

// Định nghĩa các hành động có thể thực hiện trên giỏ hàng
export interface CartActions {
    addToCart: (schedule: Schedule) => void;
    removeFromCart: (itemId: string) => void;
    updateItemQuantity: (itemId: string, newQuantity: number) => void;
    toggleSelectItemForCheckout: (itemId: string) => void;
    selectAllItemsForCheckout: () => void;
    deselectAllItemsForCheckout: () => void;
    clearCart: () => void;
    getCartItemCount: () => number; // Số loại sự kiện trong toàn bộ giỏ
    getTotalTicketCount: () => number; // Tổng số vé trong toàn bộ giỏ
    getPromotionForCart: () => PromotionRule | null; // Khuyến mãi dựa trên toàn bộ giỏ (có thể dùng để gợi ý)
    getPromotionForSelectedItems: () => PromotionRule | null; // *** THÊM: Khuyến mãi dựa trên các mục đã chọn ***
}

// Kết hợp State và Actions để tạo thành Props cho Context
export interface CartContextProps extends CartState, CartActions { }