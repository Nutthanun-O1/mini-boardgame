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
 *   Role cards      → 400×560 px (สัดส่วน 5:7)
 *   Game cards      → 400×300 px (สัดส่วน 4:3)
 *   Location cards  → 400×300 px (สัดส่วน 4:3)
 * ────────────────────────────────────
 */

// ─── Insider ───
export const ROLE_IMAGES = {
  Master: '/images/roles/master.png',
  Insider: '/images/roles/insider.png',
  Common: '/images/roles/common.png',
};

export const ROLE_INFO = {
  Master: {
    label: 'Master (DM)',
    description: 'ผู้ดำเนินเกม',
  },
  Insider: {
    label: 'Insider',
    description: 'ใบคำลับแบบเนียนๆ',
  },
  Common: {
    label: 'Common',
    description: 'ถามคำถามไปเรื่อยๆ',
  },
};

// ─── Spyfall ───
export const SPYFALL_ROLE_IMAGES = {
  Spy: '/images/roles/spy.png',
  Agent: '/images/roles/agent.png',
};

export const SPYFALL_ROLE_INFO = {
  Spy: {
    label: 'Spy',
    description: 'คุณไม่รู้สถานที่ — พยายามเดาจากคำถามของคนอื่น อย่าให้โดนจับได้!',
  },
  Agent: {
    label: 'Agent',
    description: 'คุณรู้สถานที่ — ถามคำถามเพื่อหาตัว Spy แต่ระวังอย่าเผยสถานที่!',
  },
};

/**
 * Spyfall locations — ภาพแต่ละสถานที่
 * ไฟล์: public/images/spyfall-locations/<key>.png
 */
export const SPYFALL_LOCATION_IMAGES = {
  school:       '/images/spyfall-locations/school.png',
  hospital:     '/images/spyfall-locations/hospital.png',
  airport:      '/images/spyfall-locations/airport.png',
  beach:        '/images/spyfall-locations/beach.png',
  casino:       '/images/spyfall-locations/casino.png',
  supermarket:  '/images/spyfall-locations/supermarket.png',
  restaurant:   '/images/spyfall-locations/restaurant.png',
  spaceship:    '/images/spyfall-locations/spaceship.png',
  submarine:    '/images/spyfall-locations/submarine.png',
  zoo:          '/images/spyfall-locations/zoo.png',
  temple:       '/images/spyfall-locations/temple.png',
  bank:         '/images/spyfall-locations/bank.png',
  circus:       '/images/spyfall-locations/circus.png',
  pirate_ship:  '/images/spyfall-locations/pirate_ship.png',
  police_station: '/images/spyfall-locations/police_station.png',
  movie_studio: '/images/spyfall-locations/movie_studio.png',
  train:        '/images/spyfall-locations/train.png',
  amusement_park: '/images/spyfall-locations/amusement_park.png',
  university:   '/images/spyfall-locations/university.png',
  hotel:        '/images/spyfall-locations/hotel.png',
};

// ─── Game Select ───
export const GAME_IMAGES = {
  insider: '/images/games/insider.png',
  werewolf: '/images/games/werewolf.png',
  spyfall: '/images/games/spyfall.png',
  codenames: '/images/games/codenames.png',
};
