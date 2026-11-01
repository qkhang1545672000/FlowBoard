export enum NotificationType {
  WORKSPACE_INVITE = 'WORKSPACE_INVITE', // Lời mời tham gia Workspace (có nút Chấp nhận/Từ chối)
  WORKSPACE_ACTIVITY = 'WORKSPACE_ACTIVITY', // Hoạt động chung trong Workspace
  BOARD_CREATE = 'BOARD_CREATE', // Tạo Board mới trong Workspace
  TASK_ASSIGN = 'TASK_ASSIGN', // Được giao Task mới
  TASK_DUE_SOON = 'TASK_DUE_SOON', // Task sắp đến hạn
  CHAT_MENTION = 'CHAT_MENTION', // Được nhắc đến trong thảo luận/chat
  SYSTEM = 'SYSTEM', // Thông báo hệ thống
}

// 2. Phân loại đối tượng/phạm vi nhận thông báo
export enum NotificationScope {
  WORKSPACE = 'WORKSPACE', // Gửi cho tất cả thành viên thuộc Workspace này
  BOARD = 'BOARD', // Gửi cho tất cả thành viên thuộc Board này
  TASK = 'TASK', // Gửi cho người tạo & những người được phân công trong Task này
  DIRECT = 'DIRECT', // Gửi trực tiếp 1-1 cho 1 User cụ thể (ví dụ: Lời mời, Tag tên)
}
