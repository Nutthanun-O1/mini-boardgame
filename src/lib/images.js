/**
 * Role & game image configuration.
 *
 * วางไฟล์ภาพไว้ใน public/images/ ตาม path ด้านล่าง
 * รองรับ .png, .jpg, .svg, .webp
 *
 * ถ้ายังไม่มีไฟล์ภาพ จะ fallback แสดงตัวอักษรแทน
 *
 * ────────────────────────────────────
 * แนะนำขนาดภาพ:
 *   Role cards  → 400×560 px (สัดส่วน 5:7)
 *   Game cards  → 400×300 px (สัดส่วน 4:3)
 * ────────────────────────────────────
 */

export const ROLE_IMAGES = {
  Master: '/images/roles/master.png',
  Insider: '/images/roles/insider.png',
  Common: '/images/roles/common.png',
};

export const ROLE_INFO = {
  Master: {
    label: 'Master (DM)',
    description: 'คุณรู้คำลับ — ตอบคำถาม Yes/No ของผู้เล่น',
  },
  Insider: {
    label: 'Insider',
    description: 'คุณรู้คำลับ — แฝงตัวช่วยนำทางโดยไม่ให้ถูกจับได้',
  },
  Common: {
    label: 'Common',
    description: 'คุณไม่รู้คำลับ — ถามคำถาม Yes/No เพื่อหาคำตอบ',
  },
};

export const GAME_IMAGES = {
  insider: '/images/games/insider.png',
  werewolf: '/images/games/werewolf.png',
  spyfall: '/images/games/spyfall.png',
  codenames: '/images/games/codenames.png',
};
