'use client';
import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { IBookingRequest } from '@/lib/models/BookingRequest';

// 1. INTERFACE CHO DỮ LIỆU FORM CỦA ADMIN
export interface IAdminBookingFormFields {
  userId?: string; // Admin có thể cần xem hoặc gán (hiện tại không có input cho nó trong form)
  eventName: string;
  eventDate: string; // Dữ liệu từ input datetime-local là string
  location: string;
  eventType: IBookingRequest['eventType'] | '';
  duration: number | string;
  expectedGuests: number | string;
  requirements?: string;
  budget?: number | string | null;
  status: IBookingRequest['status']; // Admin luôn quản lý status
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

// 2. PROPS CHO COMPONENT
interface BookingFormProps {
  booking?: IBookingRequest | null; // Dữ liệu booking hiện tại để edit
  onSubmit: (data: IAdminBookingFormFields) => void; // Callback khi submit form
  onClose: () => void; // Callback để đóng form/modal
}

const PHONE_REGEX = /^[0-9]{9,11}$/;
const PHONE_VALIDATION_MESSAGE = "Số điện thoại chỉ chứa số và có từ 9 đến 11 chữ số.";
const EVENT_DATE_PAST_MESSAGE = "Ngày tổ chức không được là ngày trong quá khứ.";
const EVENT_DATE_REQUIRED_MESSAGE = "Vui lòng chọn ngày tổ chức.";

export default function BookingForm({ booking, onSubmit, onClose }: BookingFormProps) {
  // 3. STATE CHO DỮ LIỆU FORM VÀ LỖI
  const [formData, setFormData] = useState<IAdminBookingFormFields>({
    userId: '', // Sẽ được cập nhật từ `booking` prop nếu có
    eventName: '',
    eventDate: '',
    location: '',
    eventType: '',
    duration: 2,
    expectedGuests: 50,
    requirements: '',
    budget: '', // Khởi tạo là string rỗng
    status: 'pending', // Mặc định cho thêm mới
    contactName: '',
    contactPhone: '',
    contactEmail: ''
  });

  const [formErrors, setFormErrors] = useState({
    contactPhone: '',
    eventDate: ''
  });

  // 4. useEffect ĐỂ ĐIỀN DỮ LIỆU KHI EDIT
  useEffect(() => {
    if (booking) {
      setFormData({
        userId: booking.userId?.toString() || '', // Chuyển ObjectId thành string nếu có
        eventName: booking.eventName || '',
        eventDate: booking.eventDate ? new Date(booking.eventDate).toISOString().slice(0, 16) : '',
        location: booking.location || '',
        eventType: booking.eventType || '',
        duration: booking.duration || 2,
        expectedGuests: booking.expectedGuests || 50,
        requirements: booking.requirements || '',
        budget: booking.budget === null || booking.budget === undefined ? '' : booking.budget,
        status: booking.status || 'pending',
        contactName: booking.contactName || '',
        contactPhone: booking.contactPhone || '',
        contactEmail: booking.contactEmail || ''
      });
      setFormErrors({ contactPhone: '', eventDate: '' }); // Reset lỗi khi load dữ liệu mới
    } else {
      // Reset form cho chế độ thêm mới
      setFormData({
        userId: '', eventName: '', eventDate: '', location: '', eventType: '',
        duration: 2, expectedGuests: 50, requirements: '', budget: '',
        status: 'pending', contactName: '', contactPhone: '', contactEmail: ''
      });
      setFormErrors({ contactPhone: '', eventDate: '' });
    }
  }, [booking]);

  // 5. HÀM XỬ LÝ THAY ĐỔI INPUT
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      // Giữ string rỗng cho input number nếu người dùng xóa, hoặc parse nếu có giá trị
      [name]: type === 'number' && name !== 'contactPhone'
        ? (value === '' ? '' : parseFloat(value))
        : value
    }));

    // Xóa lỗi tương ứng khi người dùng bắt đầu sửa
    if (name === 'contactPhone') {
      setFormErrors(prev => ({ ...prev, contactPhone: '' }));
    }
    if (name === 'eventDate') {
      setFormErrors(prev => ({ ...prev, eventDate: '' }));
    }
  };

  // 6. HÀM VALIDATE FORM
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { contactPhone: '', eventDate: '' };

    // Validate số điện thoại
    if (formData.contactPhone && !PHONE_REGEX.test(formData.contactPhone)) {
      newErrors.contactPhone = PHONE_VALIDATION_MESSAGE;
      isValid = false;
    } else if (!formData.contactPhone) { // Nếu trường số điện thoại là bắt buộc
      newErrors.contactPhone = "Vui lòng nhập số điện thoại.";
      isValid = false;
    }


    // Validate ngày tổ chức
    if (formData.eventDate) {
      const eventD = new Date(formData.eventDate);
      const now = new Date();
      const eventDayStart = new Date(eventD.getFullYear(), eventD.getMonth(), eventD.getDate());
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (eventDayStart < todayStart) {
        newErrors.eventDate = EVENT_DATE_PAST_MESSAGE;
        isValid = false;
      }
    } else {
      newErrors.eventDate = EVENT_DATE_REQUIRED_MESSAGE;
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  // 7. HÀM SUBMIT FORM
  const handleSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Chuyển đổi các trường số từ string (nếu có) về number trước khi submit
      const dataToSubmit: IAdminBookingFormFields = {
        ...formData,
        duration: parseFloat(String(formData.duration)) || 0,
        expectedGuests: parseInt(String(formData.expectedGuests), 10) || 0,
        budget: formData.budget === '' || formData.budget === null || formData.budget === undefined
          ? null
          : parseFloat(String(formData.budget)),
      };
      onSubmit(dataToSubmit);
    } else {
      console.log("Form validation failed", formErrors);
    }
  };

  // 8. RENDER FORM
  return (
    <form onSubmit={handleSubmitForm} className="space-y-6 p-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Tên sự kiện */}
        <div>
          <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">Tên sự kiện</label>
          <input
            type="text"
            name="eventName"
            id="eventName"
            value={formData.eventName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>

        {/* Ngày tổ chức */}
        <div>
          <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">Ngày tổ chức</label>
          <input
            type="datetime-local"
            name="eventDate"
            id="eventDate"
            value={formData.eventDate}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.eventDate ? 'border-red-500' : ''}`}
            required
          />
          {formErrors.eventDate && <p className="mt-1 text-xs text-red-600">{formErrors.eventDate}</p>}
        </div>

        {/* Địa điểm */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">Địa điểm</label>
          <input
            type="text"
            name="location"
            id="location"
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>

        {/* Loại sự kiện */}
        <div>
          <label htmlFor="eventType" className="block text-sm font-medium text-gray-700">Loại sự kiện</label>
          <select
            name="eventType"
            id="eventType"
            value={formData.eventType}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Chọn loại sự kiện</option>
            <option value="wedding">Đám cưới</option>
            <option value="birthday">Sinh nhật</option>
            <option value="corporate">Sự kiện công ty</option>
            <option value="festival">Lễ hội</option>
            <option value="other">Khác</option>
          </select>
        </div>

        {/* Thời lượng */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Thời lượng (giờ)</label>
          <input
            type="number"
            name="duration"
            id="duration"
            value={formData.duration}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            min="0.5"
            step="0.5"
            required
          />
        </div>

        {/* Số khách dự kiến */}
        <div>
          <label htmlFor="expectedGuests" className="block text-sm font-medium text-gray-700">Số khách dự kiến</label>
          <input
            type="number"
            name="expectedGuests"
            id="expectedGuests"
            value={formData.expectedGuests}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            min="1"
            required
          />
        </div>

        {/* Ngân sách */}
        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700">Ngân sách (VNĐ)</label>
          <input
            type="number"
            name="budget"
            id="budget"
            value={formData.budget === null || formData.budget === undefined ? '' : formData.budget}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            min="0"
            placeholder="Để trống nếu không có"
          />
        </div>

        {/* Trạng thái (Admin có thể sửa) */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Trạng thái</label>
          <select
            name="status"
            id="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required // Trạng thái là bắt buộc
          >
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Yêu cầu đặc biệt */}
      <div className="col-span-1 md:col-span-2">
        <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">Yêu cầu đặc biệt</label>
        <textarea
          name="requirements"
          id="requirements"
          value={formData.requirements}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          rows={3}
        />
      </div>

      {/* Thông tin liên hệ */}
      <fieldset className="mt-6">
        <legend className="text-base font-medium text-gray-900">Thông tin liên hệ</legend>
        <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">Tên người liên hệ</label>
            <input
              type="text"
              name="contactName"
              id="contactName"
              value={formData.contactName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input
              type="tel"
              name="contactPhone"
              id="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${formErrors.contactPhone ? 'border-red-500' : ''}`}
              required
              pattern="^[0-9]{9,11}$" // HTML5 pattern
              title={PHONE_VALIDATION_MESSAGE} // Tooltip cho pattern
            />
            {formErrors.contactPhone && <p className="mt-1 text-xs text-red-600">{formErrors.contactPhone}</p>}
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="contactEmail"
              id="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
        </div>
      </fieldset>

      {/* Nút điều khiển */}
      <div className="flex justify-end space-x-3 pt-6">
        <button
          type="button"
          onClick={onClose} // Nút Hủy sẽ gọi prop onClose
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {booking ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </form>
  );
}
