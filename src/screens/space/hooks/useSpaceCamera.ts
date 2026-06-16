import { useRef, useState } from "react";
import { WORLD_H, WORLD_W } from "../lib/space-engine";
import type { SpaceSignal, SpaceViewport } from "../types";

const DEFAULT_VIEWPORT: SpaceViewport = { x: -760, y: -470, scale: 1 };
const MIN_SCALE = 0.55;
const MAX_SCALE = 2.4;

function clampScale(value: number) {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));
}

export function useSpaceCamera() {
  const [viewport, setViewport] = useState<SpaceViewport>(DEFAULT_VIEWPORT);
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<SpaceViewport>(DEFAULT_VIEWPORT);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragStart = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const pinchStart = useRef<{ distance: number; scale: number; centerX: number; centerY: number; worldX: number; worldY: number } | null>(null);

  const commitViewport = (next: SpaceViewport) => {
    viewportRef.current = next;
    setViewport(next);
  };

  const resetViewport = () => commitViewport(DEFAULT_VIEWPORT);

  const focusTo = (signal: SpaceSignal, scale = 1.22) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const wx = (signal.x / 100) * WORLD_W;
    const wy = (signal.y / 100) * WORLD_H;
    commitViewport({ scale, x: rect.width / 2 - wx * scale, y: rect.height / 2 - wy * scale });
  };

  const zoomTo = (nextScaleRaw: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const current = viewportRef.current;
    const nextScale = clampScale(nextScaleRaw);
    const mx = rect.width / 2;
    const my = rect.height / 2;
    const worldX = (mx - current.x) / current.scale;
    const worldY = (my - current.y) / current.scale;
    commitViewport({ scale: nextScale, x: mx - worldX * nextScale, y: my - worldY * nextScale });
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const current = viewportRef.current;
    const nextScale = clampScale(current.scale - event.deltaY * 0.0012);
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const worldX = (mx - current.x) / current.scale;
    const worldY = (my - current.y) / current.scale;
    commitViewport({ scale: nextScale, x: mx - worldX * nextScale, y: my - worldY * nextScale });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button,input,textarea,a")) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size >= 2) {
      const rect = event.currentTarget.getBoundingClientRect();
      const [a, b] = Array.from(pointersRef.current.values()).slice(0, 2);
      const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const centerX = (a.x + b.x) / 2 - rect.left;
      const centerY = (a.y + b.y) / 2 - rect.top;
      const current = viewportRef.current;
      pinchStart.current = {
        distance,
        scale: current.scale,
        centerX,
        centerY,
        worldX: (centerX - current.x) / current.scale,
        worldY: (centerY - current.y) / current.scale,
      };
      setDragging(false);
      dragStart.current = null;
      return;
    }

    setDragging(true);
    const current = viewportRef.current;
    dragStart.current = { x: event.clientX, y: event.clientY, vx: current.x, vy: current.y };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    event.preventDefault();
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pinchStart.current && pointersRef.current.size >= 2) {
      const [a, b] = Array.from(pointersRef.current.values()).slice(0, 2);
      const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const nextScale = clampScale(pinchStart.current.scale * (distance / pinchStart.current.distance));
      commitViewport({
        scale: nextScale,
        x: pinchStart.current.centerX - pinchStart.current.worldX * nextScale,
        y: pinchStart.current.centerY - pinchStart.current.worldY * nextScale,
      });
      return;
    }

    if (!dragging || !dragStart.current) return;
    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;
    commitViewport({ ...viewportRef.current, x: dragStart.current.vx + dx, y: dragStart.current.vy + dy });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchStart.current = null;
    if (pointersRef.current.size === 0) {
      setDragging(false);
      dragStart.current = null;
    }
  };

  return {
    stageRef,
    viewport,
    setViewport: commitViewport,
    resetViewport,
    focusTo,
    zoomTo,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
