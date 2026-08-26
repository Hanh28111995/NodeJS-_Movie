import Notification from "../model/userCartNotificationModel.js";

class NotificationRepository {
  // Lấy danh sách thông báo của user cụ thể (có limit/phân trang)
  // Trong notificationRepository.js

  async getAndTrimUserNotifications(userId, limit) {
    // 1. Lấy ra danh sách 50 thông báo mới nhất
    const notifications = await Notification.find({ id_user: userId })
      .populate("id_ticket", "startTime seatName paymentStatus transactionId")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // 2. Nếu số lượng thông báo vượt quá giới hạn (limit), tiến hành xóa các bản ghi cũ phía sau
    if (notifications.length === limit) {
      // Lấy thời điểm tạo của bản ghi thứ 50 (bản ghi cũ nhất trong top 50)
      const oldestKeptNotification = notifications[notifications.length - 1];

      // Xóa tất cả các thông báo của user này có thời gian tạo cũ hơn bản ghi thứ 50 đó
      await Notification.deleteMany({
        id_user: userId,
        createdAt: { $lt: oldestKeptNotification.createdAt },
      }).catch((err) => console.error("Error trimming notifications:", err));
    }

    return notifications;
  }

  // Tạo thông báo mới
  async createNotification(data) {
    return await Notification.create(data);
  }

  // Cập nhật trạng thái 'status' (đã đọc/chưa đọc) của 1 thông báo theo user
  async updateStatusByIdAndUser(notificationId, userId, status = true) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, id_user: userId },
      { status },
      { new: true },
    ).lean();
  }

  // Đánh dấu tất cả thông báo của user thành đã đọc
  async updateManyStatusByUser(
    userId,
    filterStatus = false,
    updateStatus = true,
  ) {
    return await Notification.updateMany(
      { id_user: userId, status: filterStatus },
      { status: updateStatus },
    );
  }

  // Xóa 1 thông báo thuộc về user
  async deleteByIdAndUser(notificationId, userId) {
    return await Notification.findOneAndDelete({
      _id: notificationId,
      id_user: userId,
    });
  }
}

export default new NotificationRepository();
