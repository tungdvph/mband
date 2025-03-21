export default function AdminDashboard() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-500 text-white p-6 rounded-lg">
          <h3 className="text-xl mb-2">Tổng số Users: 7</h3>
          <p>Chi tiết</p>
        </div>
        <div className="bg-yellow-500 text-white p-6 rounded-lg">
          <h3 className="text-xl mb-2">Tổng số Bookings: 4</h3>
          <p>Chi tiết</p>
        </div>
        <div className="bg-green-500 text-white p-6 rounded-lg">
          <h3 className="text-xl mb-2">Tổng số bài hát: 3</h3>
          <p>Chi tiết</p>
        </div>
        <div className="bg-teal-500 text-white p-6 rounded-lg">
          <h3 className="text-xl mb-2">Tổng số Liên hệ: 4</h3>
          <p>Chi tiết</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Biểu đồ Doanh thu</h3>
          {/* Add chart component here */}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Biểu đồ Trạng thái Booking</h3>
          {/* Add chart component here */}
        </div>
      </div>
    </div>
  );
}