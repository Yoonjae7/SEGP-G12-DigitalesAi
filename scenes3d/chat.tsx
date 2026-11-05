'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { PHOTO_H, PHOTO_INNER, PHOTO_W } from '@/lib/art/photo';

/** What the phone in the story shows: the chat so far, as plain data. */
export interface ChatShot { title: string; people: number; items: { who: string; text: string; photo?: boolean; mine?: boolean }[] }

/** The texture for the phone screen of the person holding a phone in the scene (the learner). */
export const PhoneScreenContext = createContext<THREE.Texture | null>(null);
export const usePhoneScreen = () => useContext(PhoneScreenContext);

const W = 360, H = 640;
const FONT = '"Atkinson Hyperlegible Next", Verdana, system-ui, sans-serif';

let photoImg: HTMLImageElement | null = null;
let photoLoading = false;
const waiting = new Set<() => void>();
function loadPhoto(onLoad: () => void) {
  if (photoImg) return;
  waiting.add(onLoad);
  if (photoLoading) return;
  photoLoading = true;
  const img = new Image();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PHOTO_W} ${PHOTO_H}" width="${PHOTO_W * 2}" height="${PHOTO_H * 2}">${PHOTO_INNER}</svg>`;
  img.onload = () => { photoImg = img; waiting.forEach((f) => f()); waiting.clear(); };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function wrap(g: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(' ')) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}
function rrect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

export function drawChat(g: CanvasRenderingContext2D, chat: ChatShot | null, title?: string, count?: number) {
  g.fillStyle = '#CFE8EF'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#E7DFCE'; g.fillRect(0, 0, W, 64);
  g.fillStyle = '#1C1B19'; g.font = `700 26px ${FONT}`; g.textBaseline = 'middle';
  g.fillText(chat?.title ?? title ?? 'Close Friends', 18, 34);
  g.font = `500 18px ${FONT}`; g.fillStyle = '#4A4741'; g.textAlign = 'right';
  g.fillText(`${chat?.people ?? count ?? 12}`, W - 18, 34); g.textAlign = 'left';

  // lay the bubbles out from the bottom, so the newest is always in view
  type Box = { h: number; draw: (y: number) => void };
  const boxes: Box[] = [];
  const maxW = 270;
  for (const it of chat?.items ?? []) {
    if (it.photo) {
      const h = 22 + 190;
      boxes.push({ h, draw: (y) => {
        g.fillStyle = '#4A4741'; g.font = `700 16px ${FONT}`; g.fillText(it.who, 22, y + 8);
        g.save(); rrect(g, 18, y + 22, 262, 182, 12); g.clip();
        if (photoImg) g.drawImage(photoImg, 18, y + 22, 262, 182); else { g.fillStyle = '#B8864F'; g.fillRect(18, y + 22, 262, 182); }
        g.restore();
        g.strokeStyle = 'rgba(28,27,25,.5)'; g.lineWidth = 2; rrect(g, 18, y + 22, 262, 182, 12); g.stroke();
      } });
      continue;
    }
    g.font = `500 22px ${FONT}`;
    const lines = wrap(g, it.text, maxW - 28);
    const bh = lines.length * 28 + 22;
    boxes.push({ h: 24 + bh, draw: (y) => {
      const x = it.mine ? W - 18 - maxW : 18;
      g.fillStyle = '#4A4741'; g.font = `700 16px ${FONT}`; g.fillText(it.who, x + 6, y + 8);
      g.fillStyle = it.mine ? '#F6D9B8' : '#F4EEE3'; rrect(g, x, y + 22, maxW, bh, 16); g.fill();
      g.strokeStyle = 'rgba(28,27,25,.3)'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = '#1C1B19'; g.font = `500 22px ${FONT}`;
      lines.forEach((l, i) => g.fillText(l, x + 14, y + 22 + 24 + i * 28));
    } });
  }
  // keep the newest messages that fit, and lay them out from the top, so the hand never covers them
  let room = H - 64 - 24, from = boxes.length;
  while (from > 0 && room - (boxes[from - 1].h + 12) >= 0) { room -= boxes[from - 1].h + 12; from--; }
  let y = 76;
  for (let i = from; i < boxes.length; i++) { boxes[i].draw(y); y += boxes[i].h + 12; }
  if (!boxes.length) {
    // no messages yet: grey bars, like a chat that is still loading
    g.fillStyle = 'rgba(74,71,65,.35)';
    [[18, 120, 200], [18, 190, 150], [18, 260, 220]].forEach(([x, yy, w]) => { rrect(g, x, yy, w, 40, 14); g.fill(); });
  }
}

/** A canvas texture for a phone screen that follows the chat. Redraws when the chat changes or the photo has loaded. */
export function useChatTexture(chat: ChatShot | null, fixed?: { title: string; count: number }): THREE.CanvasTexture {
  const { cv, tex } = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { cv, tex };
  }, []);
  useEffect(() => {
    const paint = () => { drawChat(cv.getContext('2d')!, chat, fixed?.title, fixed?.count); tex.needsUpdate = true; };
    paint();
    loadPhoto(paint);
    return () => { waiting.delete(paint); };
  }, [chat, fixed?.title, fixed?.count, cv, tex]);
  return tex;
}
