import { ValueTransformer } from 'typeorm';

export const decimalColumnTransformer: ValueTransformer = {
  to: (value?: number | null) => value,

  from: (value?: string | number | null) => {
    if (value === null || value === undefined) {
      return null;
    }

    const num = typeof value === 'number' ? value : Number(String(value));

    return Number.isFinite(num) ? num : 0;
  },
};

export const decimalColumn = {
  type: 'decimal' as const,
  precision: 18,
  scale: 2,
  transformer: decimalColumnTransformer,
};

export const nullableDecimalColumn = {
  ...decimalColumn,
  nullable: true as const,
};
