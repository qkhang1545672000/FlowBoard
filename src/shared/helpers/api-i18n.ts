import { BadRequestException, NotFoundException } from '@nestjs/common';

const messages: Record<string, string> = {
  'errors.common.userNotFound': 'Không tìm thấy người dùng',
  'errors.auth.verificationFailed': 'Token xác minh không hợp lệ',
  'errors.auth.tokenExpired': 'Token xác minh đã hết hạn',
  'errors.auth.emailMismatch': 'Email không khớp với token xác minh',
};

export function translateApiMessage(key: string): string {
  return messages[key] ?? key;
}

export function apiBadRequest(key: string): never {
  throw new BadRequestException(translateApiMessage(key));
}

export function apiNotFound(key: string): never {
  throw new NotFoundException(translateApiMessage(key));
}
