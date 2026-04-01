import type { Locale, IngestedPost, ContentTag } from "../../types/app";

export type ViewerDirection = "next" | "prev" | null;

export type FeedOption<T extends string> = {
  value: T;
  label: string;
};

export type FeedScreenProps = {
  locale: Locale;
  posts: IngestedPost[];
  likedPostIds: number[];
  savedPostIds: number[];
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onHidePost: (id: number) => void;
  onDeletePost: (id: number) => Promise<void>;
  currentTelegramUserId: string | null;
  openSource: (handle: string) => void;
};

export type FeedCardProps = {
  post: IngestedPost;
  locale: Locale;
  isOwner: boolean;
  isAdmin: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onDelete: () => void;
  onHide: () => void;
  onOpen: () => void;
  onOpenCreator: () => void;
  mediaIndex: number;
  onChangeMediaIndex: (next: number) => void;
};

export type FeedTextCardProps = FeedCardProps;

export type FeedMediaCardProps = FeedCardProps & {
  displayText: string;
  isCardVisible?: boolean;
};

export type ViewerProps = {
  locale: Locale;
  activePost: IngestedPost | null;
  viewerDirection: ViewerDirection;
  expandedCaption: boolean;
  setExpandedCaption: React.Dispatch<React.SetStateAction<boolean>>;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  copySuccessId: number | null;
  menuPostId: number | null;
  setMenuPostId: React.Dispatch<React.SetStateAction<number | null>>;
  actionError: string;
  videoProgress: number;
  viewerMediaIndex: number;
  setViewerMediaIndex: React.Dispatch<React.SetStateAction<number>>;
  likedPostIds: number[];
  savedPostIds: number[];
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onHidePost: (id: number) => void;
  onDeletePost: (id: number) => Promise<void>;
  currentTelegramUserId: string | null;
  openSource: (handle: string) => void;
  closeViewer: () => void;
  nextViewer: () => void;
  prevViewer: () => void;
  handleShare: (post: IngestedPost) => Promise<void>;
  setActionError: React.Dispatch<React.SetStateAction<string>>;
};

export type FeedHeaderProps = {
  selectedTags: ContentTag[];
  toggleTag: (tag: ContentTag) => void;
  clearTags: () => void;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  tagsOpen: boolean;
  setTagsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};