import type { ContentTag, IngestedPost } from "../types/app";
import type { TrustedSource } from "../screens/admin/admin.types";

function uniqueTags(tags: Array<ContentTag | null | undefined>) {
  return Array.from(
    new Set(
      tags.filter(
        (tag): tag is ContentTag =>
          typeof tag === "string" && tag.trim().length > 0
      )
    )
  );
}

export function normalizeContentTags(
  tags: Array<ContentTag | null | undefined>,
  fallback: ContentTag = "other"
): ContentTag[] {
  const normalized = uniqueTags(tags);

  if (normalized.length > 0) {
    return normalized;
  }

  return [fallback];
}

export function getPrimaryTagFromTags(
  tags: Array<ContentTag | null | undefined>,
  fallback: ContentTag = "other"
): ContentTag {
  return normalizeContentTags(tags, fallback)[0] || fallback;
}

export function getSourceTags(
  source: Pick<TrustedSource, "tags" | "defaultTag">
): ContentTag[] {
  return normalizeContentTags(source.tags, source.defaultTag || "other");
}

export function getPostTags(
  post: Pick<IngestedPost, "tags" | "tag">
): ContentTag[] {
  return normalizeContentTags(post.tags ?? [], post.tag || "other");
}

export function getPostPrimaryTag(
  post: Pick<IngestedPost, "tags" | "tag">
): ContentTag {
  return getPrimaryTagFromTags(post.tags ?? [], post.tag || "other");
}

export function postHasTag(
  post: Pick<IngestedPost, "tags" | "tag">,
  tag: ContentTag
) {
  return getPostTags(post).includes(tag);
}

export function sourceHasTag(
  source: Pick<TrustedSource, "tags" | "defaultTag">,
  tag: ContentTag
) {
  return getSourceTags(source).includes(tag);
}

export function mergeTagsForPost(params: {
  postTags?: Array<ContentTag | null | undefined>;
  postTag?: ContentTag | null;
  sourceTags?: Array<ContentTag | null | undefined>;
  sourceDefaultTag?: ContentTag | null;
}): ContentTag[] {
  const ownTags = uniqueTags([
    ...(params.postTags || []),
    params.postTag || null,
  ]);

  if (ownTags.length > 0) {
    return ownTags;
  }

  return normalizeContentTags(
    [...(params.sourceTags || []), params.sourceDefaultTag || null],
    "other"
  );
}