/**
 * Game data — word banks, locations, and helper functions.
 * (Moved from server.js so the client can handle game logic directly.)
 */

import { getSupabase } from './supabase';

// ══════════════════════════════════════════════
//  Insider word bank
// ══════════════════════════════════════════════
const insiderWords = {
  animals: [
    'แมว','สุนัข','ช้าง','ม้า','กระต่าย','เสือ','สิงโต',
    'ลิง','งู','เพนกวิน','ปลาโลมา','นกแก้ว','จระเข้',
    'ยีราฟ','หมี','แมงมุม','ผีเสื้อ','ปลาหมึก','กบ','เต่า'
  ],
  food: [
    'ส้มตำ','ข้าวผัด','พิซซ่า','ซูชิ','แฮมเบอร์เกอร์',
    'ไอศกรีม','ต้มยำกุ้ง','ผัดไทย','สเต็ก','ราเมน',
    'ขนมปัง','เค้ก','ช็อกโกแลต','มะม่วง','แตงโม'
  ],
  places: [
    'โรงเรียน','โรงพยาบาล','สนามบิน','ชายหาด','ภูเขา',
    'ห้างสรรพสินค้า','สวนสนุก','พิพิธภัณฑ์','วัด','สถานีรถไฟ',
    'ตลาดนัด','สวนสัตว์','ห้องสมุด','สระว่ายน้ำ','โรงภาพยนตร์'
  ],
  objects: [
    'โทรศัพท์','นาฬิกา','กุญแจ','ร่ม','แว่นตา','กระเป๋า',
    'กรรไกร','กระจก','เทียน','ลูกโป่ง',
    'หมอน','พัดลม','ไฟฉาย','กล้องถ่ายรูป','ดินสอ'
  ],
  activities: [
    'ว่ายน้ำ','วิ่ง','ร้องเพลง','ทำอาหาร','วาดรูป',
    'เต้นรำ','ตกปลา','ปีนเขา','ถ่ายรูป','เล่นเกม',
    'อ่านหนังสือ','นอนหลับ','ดูหนัง','ช้อปปิ้ง','แคมป์ปิ้ง'
  ],
  occupations: [
    'หมอ','ครู','ตำรวจ','นักบิน','พ่อครัว',
    'นักดับเพลิง','ทนายความ','วิศวกร','นักบินอวกาศ','ชาวนา',
    'จิตรกร','นักดนตรี','นักเขียน','ช่างภาพ','สัตวแพทย์'
  ]
};

const CATEGORY_LABELS = {
  animals: 'สัตว์',
  food: 'อาหาร',
  places: 'สถานที่',
  objects: 'สิ่งของ',
  activities: 'กิจกรรม',
  occupations: 'อาชีพ',
};

// ══════════════════════════════════════════════
//  Spyfall locations
// ══════════════════════════════════════════════
export const spyfallLocations = {
  school:         'โรงเรียน',
  hospital:       'โรงพยาบาล',
  airport:        'สนามบิน',
  beach:          'ชายหาด',
  casino:         'คาสิโน',
  supermarket:    'ซูเปอร์มาร์เก็ต',
  restaurant:     'ร้านอาหาร',
  spaceship:      'ยานอวกาศ',
  submarine:      'เรือดำน้ำ',
  zoo:            'สวนสัตว์',
  temple:         'วัด',
  bank:           'ธนาคาร',
  circus:         'ละครสัตว์',
  pirate_ship:    'เรือโจรสลัด',
  police_station: 'สถานีตำรวจ',
  movie_studio:   'สตูดิโอถ่ายหนัง',
  train:          'รถไฟ',
  amusement_park: 'สวนสนุก',
  university:     'มหาวิทยาลัย',
  hotel:          'โรงแรม',
};

export const ALL_SPYFALL_LOCATIONS = Object.entries(spyfallLocations).map(
  ([key, label]) => ({ key, label })
);

// ══════════════════════════════════════════════
//  Helpers
// ══════════════════════════════════════════════

export function pickWord() {
  const keys = Object.keys(insiderWords);
  const key = keys[Math.floor(Math.random() * keys.length)];
  const list = insiderWords[key];
  return {
    word: list[Math.floor(Math.random() * list.length)],
    category: CATEGORY_LABELS[key] || key,
  };
}

export function pickSpyfallLocation() {
  const keys = Object.keys(spyfallLocations);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { locationKey: key, locationLabel: spyfallLocations[key] };
}

/**
 * Generate a unique 4-character room code that doesn't already exist in the DB.
 */
export async function generateRoomCode() {
  const supabase = getSupabase();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  // Verify uniqueness
  const { data } = await supabase.from('rooms').select('code').eq('code', code).maybeSingle();
  if (data) return generateRoomCode();
  return code;
}
