/**
 * Material Design 3 Components Export
 */

export { default as AppShell } from './AppShell'
export { default as SmartTopBar } from './SmartTopBar'
export { default as Carousel } from './Carousel'
export type { CarouselItemSize, CarouselProps } from './Carousel'
export { default as BottomNavigation } from './BottomNavigation'
export { default as BottomSheet } from './BottomSheet'
export type { BottomSheetProps } from './BottomSheet'
export { default as Typography } from './Typography'
export {
  DisplayLarge,
  DisplayMedium,
  DisplaySmall,
  HeadlineLarge,
  HeadlineMedium,
  HeadlineSmall,
  TitleLarge,
  TitleMedium,
  TitleSmall,
  BodyLarge,
  BodyMedium,
  BodySmall,
  LabelLarge,
  LabelMedium,
  LabelSmall,
} from './Typography'

// Re-export Button, Post, PostSkeleton from common (M3 compliant)
export { default as Button } from '../common/Button'
export { default as Post } from '../common/Post'
export type { PostProps } from '../common/Post'
export { default as PostSkeleton } from '../common/PostSkeleton'
export type { PostSkeletonProps } from '../common/PostSkeleton'
export { default as Comments } from '../common/Comments'
export type { CommentsProps } from '../common/Comments'
