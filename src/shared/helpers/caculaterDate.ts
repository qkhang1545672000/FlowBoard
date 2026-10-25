// Hàm tính phần trăm tiến độ dựa trên startDate và dueDate
export function calculateDynamicProgress(
  startDate: Date | string | null,
  dueDate: Date | string | null,
): number {
  if (!startDate || !dueDate) return 0;

  const now = new Date().getTime();
  const start = new Date(startDate).getTime();
  const end = new Date(dueDate).getTime();

  if (end <= start) return 0;

  // Nếu đã quá hạn thì 100%
  if (now >= end) return 100;

  // Nếu thời điểm hiện tại nằm trước ngày bắt đầu (chưa tới hạn),
  // thay vì trả về 0 ngay lập tức, ta có thể cho phép tính từ lúc bắt đầu
  // hoặc trả về 0 nhưng đảm bảo múi giờ không bị lệch.
  // Nếu bạn muốn nếu chưa tới giờ nhưng trong cùng ngày vẫn cho chạy progress nhẹ hoặc tính từ 0:
  if (now <= start) {
    // Nếu bạn muốn test ngay, có thể bỏ dòng return 0 này hoặc để nó chạy theo thời gian thực
    return 0;
  }

  const totalDuration = end - start;
  const elapsed = now - start;

  return Math.max(
    0,
    Math.min(100, Math.round((elapsed / totalDuration) * 100)),
  );
}

export const calculateTimeRemaining = (
  startDate: Date | string | null,
  dueDate: Date | string | null,
): string => {
  const now = new Date().getTime();

  // 1. Kiểm tra nếu có ngày bắt đầu và chưa tới ngày bắt đầu (startDate > now)
  if (startDate) {
    const start = new Date(startDate).getTime();
    const startDiffMs = start - now;

    if (startDiffMs > 0) {
      const startMinutes = Math.floor(startDiffMs / (1000 * 60));
      const startHours = Math.floor(startDiffMs / (1000 * 60 * 60));
      const startDays = Math.floor(startDiffMs / (1000 * 60 * 60 * 24));

      if (startDays > 0) {
        return `Còn ${startDays} ngày nữa bắt đầu`;
      } else if (startHours > 0) {
        return `Còn ${startHours} giờ nữa bắt đầu`;
      } else if (startMinutes > 0) {
        return `Còn ${startMinutes} phút nữa bắt đầu`;
      } else {
        return 'Sắp bắt đầu';
      }
    }
  }

  // 2. Nếu đã qua ngày bắt đầu (hoặc không có startDate), tính thời gian đến hạn (dueDate) như bình thường
  if (!dueDate) return '';
  const end = new Date(dueDate).getTime();
  const diffMs = end - now;

  if (diffMs <= 0) return 'Đã quá hạn';

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `Còn ${diffDays} ngày`;
  } else if (diffHours > 0) {
    return `Còn ${diffHours} giờ`;
  } else if (diffMinutes > 0) {
    return `Còn ${diffMinutes} phút`;
  } else {
    return 'Sắp hết hạn';
  }
};
