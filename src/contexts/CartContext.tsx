// src/contexts/CartContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react'; // << THÊM VÀO
import { toast } from 'react-toastify'; // << THÊM VÀO (nếu chưa có)
import { CartItem, CartContextProps, PromotionRule } from '@/types/cart';
import { Schedule } from '@/types/schedule';
import { PROMOTION_RULES } from '@/config/promotions';

// --- Định nghĩa các hàm gọi API ---
const API_BASE_URL = '/api/user/me/cart';

const fetchCartAPI = async (): Promise<CartItem[]> => {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
        if (response.status === 401) return []; // Chưa đăng nhập hoặc session hết hạn, trả về giỏ hàng rỗng
        const errorData = await response.json().catch(() => ({ message: 'Không thể tải dữ liệu giỏ hàng' }));
        throw new Error(errorData.message || `Lỗi tải giỏ hàng: ${response.status}`);
    }
    return response.json();
};

const addToCartAPI = async (schedule: Schedule, quantity: number): Promise<CartItem> => {
    const payload = { _id: schedule._id, quantity }; // API POST mong muốn scheduleId và quantity
    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Không thể thêm sản phẩm vào giỏ' }));
        throw new Error(errorData.message || `Lỗi thêm sản phẩm: ${response.status}`);
    }
    return response.json();
};

const updateCartItemQuantityAPI = async (itemId: string, quantity: number): Promise<CartItem | { message: string, removedItemId?: string }> => {
    const response = await fetch(`${API_BASE_URL}/${itemId}`, { // itemId ở đây là scheduleId
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Không thể cập nhật số lượng' }));
        throw new Error(errorData.message || `Lỗi cập nhật số lượng: ${response.status}`);
    }
    return response.json();
};

const removeFromCartAPI = async (itemId: string): Promise<{ message: string, removedItemId: string }> => {
    const response = await fetch(`${API_BASE_URL}/${itemId}`, { // itemId ở đây là scheduleId
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Không thể xóa sản phẩm' }));
        throw new Error(errorData.message || `Lỗi xóa sản phẩm: ${response.status}`);
    }
    return response.json();
};

const clearCartAPI = async (): Promise<{ message: string }> => {
    const response = await fetch(API_BASE_URL, { method: 'DELETE' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Không thể làm trống giỏ hàng' }));
        throw new Error(errorData.message || `Lỗi làm trống giỏ hàng: ${response.status}`);
    }
    return response.json();
};
// --- Kết thúc định nghĩa hàm API ---


const CartContext = createContext<CartContextProps | undefined>(undefined);

interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedItemIdsForCheckout, setSelectedItemIdsForCheckout] = useState<string[]>([]);
    const [isCartLoading, setIsCartLoading] = useState(true); // << THÊM state loading
    const { data: session, status: sessionStatus } = useSession(); // << Lấy session

    // Load giỏ hàng từ API khi session thay đổi
    const loadCartForCurrentUser = useCallback(async () => {
        if (sessionStatus === 'authenticated') {
            setIsCartLoading(true);
            try {
                const itemsFromApi = await fetchCartAPI();
                setCartItems(itemsFromApi);
                // Reset các item đã chọn khi giỏ hàng tải lại từ người dùng khác hoặc làm mới
                setSelectedItemIdsForCheckout(prevSelected =>
                    itemsFromApi.filter(item => prevSelected.includes(item._id)).map(item => item._id)
                );
            } catch (error) {
                toast.error((error as Error).message || "Không thể tải giỏ hàng từ server.");
                setCartItems([]); // Xóa giỏ hàng client nếu có lỗi
                setSelectedItemIdsForCheckout([]);
            } finally {
                setIsCartLoading(false);
            }
        } else if (sessionStatus === 'unauthenticated') {
            // Nếu không đăng nhập, xóa giỏ hàng client
            setCartItems([]);
            setSelectedItemIdsForCheckout([]);
            setIsCartLoading(false);
        }
        // Nếu sessionStatus === 'loading', isCartLoading sẽ vẫn là true
        // và hàm này sẽ được gọi lại khi sessionStatus thay đổi.
    }, [sessionStatus]);

    useEffect(() => {
        loadCartForCurrentUser();
    }, [loadCartForCurrentUser]); // Phụ thuộc vào sessionStatus thông qua loadCartForCurrentUser

    // Lưu selectedItemIdsForCheckout vào localStorage (tùy chọn, có thể bỏ nếu không muốn)
    // Chỉ nên làm điều này nếu bạn muốn giữ lựa chọn qua các lần làm mới trang CHO CÙNG MỘT USER
    // và cần cẩn thận khi user thay đổi.
    useEffect(() => {
        if (sessionStatus === 'authenticated' && !isCartLoading) { // Chỉ lưu khi đã đăng nhập và tải xong
            // Thêm user ID vào key để phân biệt
            const userId = session?.user?.id;
            if (userId) {
                localStorage.setItem(`selectedCartItems_${userId}`, JSON.stringify(selectedItemIdsForCheckout));
            }
        }
    }, [selectedItemIdsForCheckout, sessionStatus, isCartLoading, session?.user?.id]);

    useEffect(() => {
        if (sessionStatus === 'authenticated' && !isCartLoading) {
            const userId = session?.user?.id;
            if (userId) {
                const storedSelectedItems = localStorage.getItem(`selectedCartItems_${userId}`);
                if (storedSelectedItems) {
                    try {
                        const parsedSelectedItems: string[] = JSON.parse(storedSelectedItems);
                        // Chỉ khôi phục nếu các item đó vẫn còn trong giỏ hàng hiện tại
                        const validSelectedItems = parsedSelectedItems.filter(id => cartItems.some(cartItem => cartItem._id === id));
                        setSelectedItemIdsForCheckout(validSelectedItems);
                    } catch (error) {
                        console.error("Lỗi khi parse các mục đã chọn từ localStorage:", error);
                        localStorage.removeItem(`selectedCartItems_${userId}`);
                    }
                }
            }
        } else if (sessionStatus === 'unauthenticated') {
            // Xóa tất cả selected items nếu không đăng nhập
            setSelectedItemIdsForCheckout([]);
            // Bạn có thể muốn xóa tất cả các key `selectedCartItems_userId` khỏi localStorage ở đây nếu cần
        }
    }, [sessionStatus, isCartLoading, session?.user?.id, cartItems]); // Thêm cartItems làm dependency


    const addToCart = useCallback(async (scheduleToAdd: Schedule, quantity: number = 1) => {
        if (sessionStatus !== 'authenticated') {
            toast.warn("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
            // Cân nhắc việc redirect hoặc mở modal đăng nhập ở đây
            return;
        }
        setIsCartLoading(true);
        try {
            const addedOrUpdatedItem = await addToCartAPI(scheduleToAdd, quantity);
            setCartItems((prevItems) => {
                const existingItemIndex = prevItems.findIndex((cartItem) => cartItem._id === addedOrUpdatedItem._id);
                if (existingItemIndex > -1) {
                    const updatedItems = [...prevItems];
                    updatedItems[existingItemIndex] = addedOrUpdatedItem; // API đã xử lý cộng dồn hoặc tạo mới
                    return updatedItems;
                }
                return [...prevItems, addedOrUpdatedItem];
            });
            toast.success(`Đã thêm "${addedOrUpdatedItem.eventName}" vào giỏ hàng!`);
        } catch (error) {
            toast.error(`Lỗi khi thêm vào giỏ: ${(error as Error).message}`);
        } finally {
            setIsCartLoading(false);
        }
    }, [sessionStatus]);

    const removeFromCart = useCallback(async (itemId: string) => {
        if (sessionStatus !== 'authenticated') return;
        setIsCartLoading(true);
        try {
            const { removedItemId } = await removeFromCartAPI(itemId);
            setCartItems((prevItems) => prevItems.filter((item) => item._id !== removedItemId));
            setSelectedItemIdsForCheckout(prevSelected => prevSelected.filter(id => id !== removedItemId));
            toast.info("Đã xóa sản phẩm khỏi giỏ hàng.");
        } catch (error) {
            toast.error(`Lỗi khi xóa sản phẩm: ${(error as Error).message}`);
        } finally {
            setIsCartLoading(false);
        }
    }, [sessionStatus]);

    const updateItemQuantity = useCallback(async (itemId: string, newQuantity: number) => {
        if (sessionStatus !== 'authenticated') return;
        // API PUT của chúng ta sẽ xử lý newQuantity <= 0 bằng cách xóa item.
        setIsCartLoading(true);
        try {
            const result = await updateCartItemQuantityAPI(itemId, newQuantity);

            if (result && 'removedItemId' in result && result.removedItemId) {
                // Item đã bị xóa bởi API (do quantity <= 0)
                setCartItems(prevItems => prevItems.filter(item => item._id !== result.removedItemId));
                setSelectedItemIdsForCheckout(prevSelected => prevSelected.filter(id => id !== result.removedItemId));
                toast.info("Sản phẩm đã được xóa khỏi giỏ hàng do số lượng bằng 0.");
            } else if (result && '_id' in result) {
                // Item được cập nhật thành công
                const updatedItem = result as CartItem;
                setCartItems(prevItems =>
                    prevItems.map(item => (item._id === updatedItem._id ? updatedItem : item))
                );
                toast.info(`Đã cập nhật số lượng cho "${updatedItem.eventName}".`);
            }
            // Trường hợp API trả về lỗi đã được xử lý bởi throw new Error trong updateCartItemQuantityAPI
        } catch (error) {
            toast.error(`Lỗi khi cập nhật số lượng: ${(error as Error).message}`);
        } finally {
            setIsCartLoading(false);
        }
    }, [sessionStatus]);

    const clearCart = useCallback(async () => {
        if (sessionStatus !== 'authenticated') return;
        setIsCartLoading(true);
        try {
            await clearCartAPI();
            setCartItems([]);
            setSelectedItemIdsForCheckout([]);
            toast.info("Giỏ hàng đã được làm trống.");
        } catch (error) {
            toast.error(`Lỗi khi làm trống giỏ hàng: ${(error as Error).message}`);
        } finally {
            setIsCartLoading(false);
        }
    }, [sessionStatus]);

    // Các hàm còn lại (toggle, selectAll, deselectAll, getPromotion) giữ nguyên logic client-side
    // dựa trên cartItems đã được fetch từ API.
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

    const getCartItemCount = useCallback((): number => {
        return cartItems.length;
    }, [cartItems]);

    const getTotalTicketCount = useCallback((): number => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    }, [cartItems]);

    const getPromotionLogic = useCallback((itemsToEvaluate: CartItem[]): PromotionRule | null => {
        const uniqueItemCount = itemsToEvaluate.length;
        // Giả sử PROMOTION_RULES được sắp xếp từ ưu đãi tốt nhất (nhiều item nhất hoặc % cao nhất) đến thấp nhất
        // Hoặc bạn cần logic để chọn ưu đãi tốt nhất nếu nhiều rule được áp dụng
        for (const rule of PROMOTION_RULES) { // PROMOTION_RULES đã được sắp xếp từ cao xuống thấp
            if (uniqueItemCount >= rule.minItems) {
                return rule; // Trả về rule đầu tiên thỏa mãn
            }
        }
        return null;
    }, []); // PROMOTION_RULES là hằng số

    const getPromotionForCart = useCallback((): PromotionRule | null => {
        return getPromotionLogic(cartItems);
    }, [cartItems, getPromotionLogic]);

    const getPromotionForSelectedItems = useCallback((): PromotionRule | null => {
        const selectedItems = cartItems.filter(item => selectedItemIdsForCheckout.includes(item._id));
        return getPromotionLogic(selectedItems);
    }, [cartItems, selectedItemIdsForCheckout, getPromotionLogic]);


    const contextValue = useMemo(() => ({
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
        isCartLoading, // << Thêm isCartLoading vào context
    }), [
        cartItems, selectedItemIdsForCheckout,
        addToCart, removeFromCart, updateItemQuantity, toggleSelectItemForCheckout,
        selectAllItemsForCheckout, deselectAllItemsForCheckout, clearCart,
        getCartItemCount, getTotalTicketCount, getPromotionForCart, getPromotionForSelectedItems,
        isCartLoading
    ]);

    // Không render children cho đến khi session status được xác định (tránh hydration mismatch nếu cần)
    // Hoặc bạn có thể luôn render children và trang cart sẽ tự xử lý isCartLoading
    if (sessionStatus === 'loading' && isCartLoading) { // Nếu session đang load và cart cũng đang load (thường là lúc đầu)
        // return null; // Hoặc một component loading toàn cục
    }


    return (
        <CartContext.Provider value={contextValue as CartContextProps}> {/* Ép kiểu nếu contextValue có thể là undefined ban đầu */}
            {children}
        </CartContext.Provider>
    );
};

export const useCart = (): CartContextProps => {
    const context = useContext(CartContext);
    if (context === undefined) {
        // Điều này không nên xảy ra nếu CartProvider bao bọc đúng cách
        // và chúng ta không trả về null từ CartProvider khi chưa khởi tạo
        console.warn('useCart được gọi ngoài CartProvider hoặc CartContext chưa sẵn sàng.');
        // Trả về một đối tượng dummy để tránh lỗi runtime ở client, nhưng đây là dấu hiệu của vấn đề cấu trúc
        return {
            cartItems: [],
            selectedItemIdsForCheckout: [],
            addToCart: () => { },
            removeFromCart: () => { },
            updateItemQuantity: () => { },
            toggleSelectItemForCheckout: () => { },
            selectAllItemsForCheckout: () => { },
            deselectAllItemsForCheckout: () => { },
            clearCart: () => { },
            getCartItemCount: () => 0,
            getTotalTicketCount: () => 0,
            getPromotionForCart: () => null,
            getPromotionForSelectedItems: () => null,
            isCartLoading: true, // Mặc định là đang loading
        } as CartContextProps;
    }
    return context;
};