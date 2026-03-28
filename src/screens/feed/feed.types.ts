import type { Locale, Video } from "../../types/app";

export type FeedMode = "new" | "rising" | "trending";
export type ViewerDirection = "next" | "prev" | null;

export type FeedScreenProps = {
  locale: Locale;
  videos: Video[];
  likedPostIds: number[];
  savedPostIds: number[];
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onHidePost: (id: number) => void;
  onDeletePost: (id: number) => Promise<void>;
  currentTelegramUserId: string | null;
  openSource: (channel: string) => void;
};

export type FeedOption<T extends string> = {
  value: T;
  label: string;
};

export type FeedCardProps = {
  video: Video;
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
};

export type ViewerProps = {
  locale: Locale;
  activeVideo: Video | null;
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
  openSource: (channel: string) => void;
  closeViewer: () => void;
  nextViewer: () => void;
  prevViewer: () => void;
  handleShare: (video: Video) => Promise<void>;
  setActionError: React.Dispatch<React.SetStateAction<string>>;
};
