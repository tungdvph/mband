'use client';
import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { IBookingRequest } from '@/lib/models/BookingRequest'; // Vẫn cần để lấy kiểu cho eventType, status và khi populate form edit

// 1. TẠO INTERFACE RIÊNG CHO DỮ LIỆU FORM
// Interface này chỉ chứa các trường dữ liệu mà form sẽ quản lý.
export interface IBookingFormFields {
  eventName: string;
  eventDate: string; // Dữ liệu từ input datetime-local là string
  location: string;
  eventType: IBookingRequest['eventType'] | ''; // Lấy kiểu enum từ IBookingRequest, cho phép rỗng
  duration: number | string; // Có thể là string từ input, cần parse
  expectedGuests: number | string; // Có thể là string từ input, cần parse
  requirements?: string;
  budget?: number | string | null; // Có thể là string từ input, hoặc null
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  status?: IBookingRequest['status']; // Optional, admin có thể đặt
}

interface BookingRequestFormProps {
  onSubmit: (data: IBookingFormFields) => void; // Sử dụng IBookingFormFields
  booking?: IBookingRequest | null;
  onClose?: () => void;
}

const PHONE_REGEX = /^[0-9]{9,11}$/;
const PHONE_VALIDATION_MESSAGE = "Số điện thoại chỉ chứa số và có từ 9 đến 11 chữ số.";

export default function BookingRequestForm({ onSubmit, booking, onClose }: BookingRequestFormProps) {
  // 2. SỬ DỤNG INTERFACE MỚI CHO STATE
  const [formData, setFormData] = useState<IBookingFormFields>({
    eventName: '',
    eventDate: '',
    location: '',
    eventType: '', // Khởi tạo là chuỗi rỗng
    duration: 2,
    expectedGuests: 50,
    requirements: '',
    budget: '', // Khởi tạo budget là string rỗng để input number không bị lỗi khi rỗng/xóa
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    status: 'pending'
  });

  const [formErrors, setFormErrors] = useState({
    contactPhone: '',
    eventDate: ''
  });

  useEffect(() => {
    if (booking) {
      setFormData({
        eventName: booking.eventName || '',
        eventDate: booking.eventDate ? new Date(booking.eventDate).toISOString().slice(0, 16) : '',
        location: booking.location || '',
        eventType: booking.eventType || '',
        duration: booking.duration || 2,
        expectedGuests: booking.expectedGuests || 50,
        requirements: booking.requirements || '',
        budget: booking.budget === null || booking.budget === undefined ? '' : booking.budget, // Xử lý null/undefined cho budget
        contactName: booking.contactName || '',
        contactPhone: booking.contactPhone || '',
        contactEmail: booking.contactEmail || '',
        status: booking.status || 'pending'
      });
      // Xóa lỗi khi load dữ liệu mới
      setFormErrors({ contactPhone: '', eventDate: '' });
    } else {
      setFormData({
        eventName: '', eventDate: '', location: '', eventType: '',
        duration: 2, expectedGuests: 50, requirements: '', budget: '',
        contactName: '', contactPhone: '', contactEmail: '', status: 'pending'
      });
      setFormErrors({ contactPhone: '', eventDate: '' });
    }
  }, [booking]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' && name !== 'contactPhone'
        ? (value === '' ? '' : parseFloat(value)) // Giữ string rỗng cho input number, hoặc parse
        : value
    }));

    if (name === 'contactPhone') {
      setFormErrors(prev => ({ ...prev, contactPhone: '' }));
    }
    if (name === 'eventDate') {
      setFormErrors(prev => ({ ...prev, eventDate: '' }));
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { contactPhone: '', eventDate: '' };

    if (formData.contactPhone && !PHONE_REGEX.test(formData.contactPhone)) {
      newErrors.contactPhone = PHONE_VALIDATION_MESSAGE;
      isValid = false;
    }

    if (formData.eventDate) {
      const eventD = new Date(formData.eventDate);
      const now = new Date();
      // Để đơn giản, chỉ kiểm tra ngày, không kiểm tra giờ phút cụ thể ở client
      // Nếu eventDate là ngày hôm nay, vẫn cho phép
      const eventDayStart = new Date(eventD.getFullYear(), eventD.getMonth(), eventD.getDate());
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (eventDayStart < todayStart) {
        newErrors.eventDate = "Ngày tổ chức không được là ngày trong quá khứ.";
        isValid = false;
      }
    } else {
      newErrors.eventDate = "Vui lòng chọn ngày tổ chức."; // Nếu trường ngày là bắt buộc
      isValid = false;
    }


    setFormErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Chuyển đổi các trường số từ string (nếu có) về number trước khi submit
      const dataToSubmit: IBookingFormFields = {
        ...formData,
        duration: parseFloat(String(formData.duration)) || 0,
        expectedGuests: parseInt(String(formData.expectedGuests), 10) || 0,
        budget: formData.budget === '' || formData.budget === null || formData.budget === undefined
          ? null // Hoặc undefined tùy theo backend mong muốn
          : parseFloat(String(formData.budget)),
      };
      onSubmit(dataToSubmit);
    } else {
      console.log("Form validation failed", formErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
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

        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700">Ngân sách (VNĐ)</label>
          <input
            type="number"
            name="budget"
            id="budget"
            value={formData.budget === null || formData.budget === undefined ? '' : formData.budget} // Hiển thị rỗng nếu là null/undefined
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            min="0"
            placeholder="Để trống nếu không có"
          />
        </div>
        {booking !== undefined && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Trạng thái</label>
            <select
              name="status"
              id="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        )}
      </div>

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
              pattern="^[0-9]{9,11}$"
              title={PHONE_VALIDATION_MESSAGE}
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

      <div className="flex justify-end space-x-3 pt-6">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {booking ? 'Cập nhật đặt lịch' : 'Gửi yêu cầu đặt lịch'}
        </button>
      </div>
    </form>
  );
}
