export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          ⚙️ Cài đặt hệ thống
        </h1>
        <p className="text-gray-600">Cấu hình và quản lý hệ thống</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Đang phát triển
          </h2>
          <p className="text-gray-600">
            Tính năng cài đặt sẽ được cập nhật trong phiên bản tiếp theo
          </p>
        </div>
      </div>
    </div>
  );
}
