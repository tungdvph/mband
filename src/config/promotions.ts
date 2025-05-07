// src/config/promotions.ts
import { PromotionRule } from '@/types/cart'; // Đảm bảo đường dẫn đúng

export const PROMOTION_RULES: PromotionRule[] = [
    { minItems: 4, discountPercentage: 15, description: 'Giảm 15% khi mua từ 4 loại sự kiện khác nhau' },
    { minItems: 3, discountPercentage: 10, description: 'Giảm 10% khi mua từ 3 loại sự kiện khác nhau' },
    { minItems: 2, discountPercentage: 5, description: 'Giảm 5% khi mua từ 2 loại sự kiện khác nhau' },
    // Sắp xếp theo minItems giảm dần để hàm getPromotionLogic ưu tiên KM tốt nhất
].sort((a, b) => b.minItems - a.minItems);