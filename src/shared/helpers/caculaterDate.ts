// Hàm tính phần trăm tiến độ dựa trên thời gian thực
export function calculateDynamicProgress(
  createdAt: Date | string,
  dueDate: Date | string,
): number {
  if (!createdAt || !dueDate) return 0;

  const now = new Date().getTime();
  const start = new Date(createdAt).getTime();
  const end = new Date(dueDate).getTime();

  // Nếu quá hạn thì 100%
  if (now >= end) return 100;
  // Nếu chưa đến lúc tạo thì 0%
  if (now <= start) return 0;

  const totalDuration = end - start;
  const elapsed = now - start;

  // Tính phần trăm và làm tròn
  return Math.round((elapsed / totalDuration) * 100);
}

export const calculateTimeRemaining = (dueDate: Date | string): string => {
  if (!dueDate) return '';
  const now = new Date().getTime();
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
