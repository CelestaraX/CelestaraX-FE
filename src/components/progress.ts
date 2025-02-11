import { tv, type VariantProps } from 'tailwind-variants';

/**
 * progress() 함수가 slots를 반환:
 * - base: 전체 Progress 래퍼
 * - track: 배경(아직 채워지지 않은 영역)
 * - indicator: 채워진 영역
 */
export const progress = tv({
  slots: {
    base: 'w-full flex flex-col gap-2',
    track: 'relative h-2 bg-gray-300/50 overflow-hidden rounded-full',
    indicator: 'h-full bg-blue-500 transition-all duration-500 rounded-full',
  },
  variants: {
    color: {
      default: {
        indicator: 'bg-blue-500',
      },
      primary: {
        indicator: 'bg-blue-600',
      },
      secondary: {
        indicator: 'bg-purple-600',
      },
      success: {
        indicator: 'bg-green-500',
      },
      warning: {
        indicator: 'bg-yellow-500',
      },
      danger: {
        indicator: 'bg-red-500',
      },
    },
    size: {
      sm: {
        track: 'h-1',
      },
      md: {
        track: 'h-2',
      },
      lg: {
        track: 'h-3',
      },
    },
    rounded: {
      none: {
        track: 'rounded-none',
        indicator: 'rounded-none',
      },
      full: {
        track: 'rounded-full',
        indicator: 'rounded-full',
      },
    },
    disableAnimation: {
      true: {
        indicator: 'transition-none',
      },
    },
  },
  defaultVariants: {
    color: 'default',
    size: 'md',
    rounded: 'full',
    disableAnimation: false,
  },
});

export type ProgressVariantProps = VariantProps<typeof progress>;
