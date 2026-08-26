import notificationRepository from "../repository/notificationRepository.js";


class NotificationService {
  /**
   * Lấy danh sách thông báo riêng tư của người dùng
   */
  async getMyNotifications(userId) {
    const notifications = await notificationRepository.getAndTrimUserNotifications(userId, 50);
    return { notifications };
  }

  /**
   * Tạo thông báo mới (thường dùng nội bộ hệ thống khi đặt vé, thay đổi trạng thái...)
   */
  async addNotification({ ticketId, userId, ticketStatus, note }) {
    if (!userId || !ticketId) {
      throw new Error("Missing user information or ticket code to create a notification.");
    }

    const newNotification = await notificationRepository.createNotification({
      id_ticket: ticketId,
      id_user: userId,
      status: false, // Mặc định là chưa đọc
      ticketStatus: ticketStatus || "Pending",
      note: note || "Default notification",
    });

    return newNotification;
  }

  /**
   * Đánh dấu một thông báo cá nhân là đã đọc
   */
  async markMyNotificationAsRead(notificationId, userId) {
    const notification = await notificationRepository.updateStatusByIdAndUser(
      notificationId,
      userId,
      true
    );
    
    if (!notification) {
      const error = new Error("Notification not found or you do not have permission to access");
      error.statusCode = 404;
      throw error;
    }
    return notification;
  }

  /**
   * Đánh dấu tất cả thông báo của người dùng là đã đọc
   */
  async markAllMyNotificationsAsRead(userId) {
    await notificationRepository.updateManyStatusByUser(userId, false, true);
    return { message: "Đã cập nhật tất cả thông báo thành đã đọc" };
  }

  /**
   * Xóa một thông báo cá nhân
   */
  async deleteMyNotification(notificationId, userId) {
    const deleted = await notificationRepository.deleteByIdAndUser(notificationId, userId);
    if (!deleted) {
      const error = new Error("Không tìm thấy thông báo để xóa");
      error.statusCode = 404;
      throw error;
    }
    return deleted;
  }
}

export default new NotificationService();