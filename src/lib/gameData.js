/**
 * Game data — word banks, locations, and helper functions.
 * (Moved from server.js so the client can handle game logic directly.)
 */

import { getSupabase } from './supabase';

// ══════════════════════════════════════════════
//  Insider word bank — by difficulty
// ══════════════════════════════════════════════

/**
 * ง่าย: คำที่คนทั่วไปรู้จักดี ตอบ Yes/No ง่าย
 */
const easyWords = {
  animals: [
    'แมว','สุนัข','ช้าง','ม้า','กระต่าย','ปลา','นก',
    'ลิง','งู','หมู','วัว','ไก่','เป็ด','กบ','เต่า'
  ],
  food: [
    'ข้าว','ไข่','นม','น้ำ','ขนมปัง','เค้ก','พิซซ่า',
    'ไอศกรีม','ผัดไทย','ส้มตำ','กล้วย','แตงโม','มะม่วง',
    'ช็อกโกแลต','แฮมเบอร์เกอร์'
  ],
  objects: [
    'โทรศัพท์','นาฬิกา','กุญแจ','ร่ม','แว่นตา','กระเป๋า',
    'หมอน','ดินสอ','กรรไกร','กระจก','พัดลม','เก้าอี้',
    'โต๊ะ','ประตู','รองเท้า'
  ],
  places: [
    'โรงเรียน','บ้าน','โรงพยาบาล','ตลาด','สวนสาธารณะ',
    'ชายหาด','สนามบิน','วัด','ห้างสรรพสินค้า','สวนสัตว์',
    'ห้องสมุด','โรงภาพยนตร์','สระว่ายน้ำ','สถานีรถไฟ','ร้านอาหาร'
  ],
};

/**
 * ปานกลาง: คำที่รู้จักแต่ต้องคิดหน่อย
 */
const mediumWords = {
  animals: [
    'เสือ','สิงโต','เพนกวิน','ปลาโลมา','นกแก้ว','จระเข้',
    'ยีราฟ','หมี','แมงมุม','ผีเสื้อ','ปลาหมึก','แมวน้ำ',
    'นกฮูก','ม้าลาย','กวาง'
  ],
  food: [
    'ต้มยำกุ้ง','ซูชิ','สเต็ก','ราเมน','มะพร้าว','ทุเรียน',
    'กุ้งเผา','ข้าวมันไก่','ส้ม','โดนัท','วาฟเฟิล','มักกะโรนี',
    'ติ่มซำ','เครป','ทาโก้'
  ],
  objects: [
    'เทียน','ลูกโป่ง','ไฟฉาย','กล้องถ่ายรูป','กีตาร์',
    'จักรยาน','ว่าว','เข็มทิศ','กล้องส่องทางไกล','เชือก',
    'ตะเกียง','ลูกบาศก์','กล่องดนตรี','ไม้ขีดไฟ','หน้ากาก'
  ],
  activities: [
    'ว่ายน้ำ','ร้องเพลง','ทำอาหาร','วาดรูป','เต้นรำ',
    'ตกปลา','ปีนเขา','ถ่ายรูป','เล่นเกม','ช้อปปิ้ง',
    'แคมป์ปิ้ง','ดำน้ำ','โยคะ','ปั่นจักรยาน','สเก็ตบอร์ด'
  ],
  occupations: [
    'หมอ','ครู','ตำรวจ','นักบิน','พ่อครัว',
    'นักดับเพลิง','ทนายความ','วิศวกร','ชาวนา','ช่างภาพ',
    'สัตวแพทย์','จิตรกร','นักดนตรี','นักเขียน','พยาบาล'
  ],
};

/**
 * ยาก: คำนามธรรม / คอนเซ็ปต์ / ต้องตีความ
 */
const hardWords = {
  concepts: [
    'เสรีภาพ','ความยุติธรรม','ประชาธิปไตย','แรงโน้มถ่วง',
    'อนาคต','ความฝัน','จิตวิญญาณ','มิตรภาพ','ความกลัว',
    'เวลา','ความจริง','ศรัทธา','ดวงชะตา','สัญชาตญาณ','อิสรภาพ'
  ],
  hardThings: [
    'เดจาวู','ออโรร่า','หลุมดำ','ดีเอ็นเอ','บล็อกเชน',
    'อัลกอริทึม','ปัญญาประดิษฐ์','เมตาเวิร์ส','ควอนตัม',
    'พาราด็อกซ์','ยูโทเปีย','คริปโต','โฮโลแกรม','นาโนเทคโนโลยี','ไซเบอร์'
  ],
  culture: [
    'สงกรานต์','ลอยกระทง','ไหว้ครู','บวชนาค','ทอดกฐิน',
    'รำไทย','มวยไทย','ตุ๊กตุ๊ก','ตักบาตร','กระทง',
    'พิธีรดน้ำ','ขันโตก','ผ้าไหม','โขน','หนังตะลุง'
  ],
  obscure: [
    'กาลอวกาศ','มิราจ','ไคเนซิส','ซินเนสทีเซีย','เอนโทรปี',
    'โทโพโลยี','ฟิโบนัชชี','แฟร็กทัล','เนบิวลา','ซูเปอร์โนวา',
    'ดิสโทเปีย','ไซเคเดลิก','เซอร์เรียล','อะมีบา','ฟอสซิล'
  ],
};

const DIFFICULTY_BANKS = {
  easy: easyWords,
  medium: mediumWords,
  hard: hardWords,
};

const CATEGORY_LABELS = {
  animals: 'สัตว์',
  food: 'อาหาร',
  places: 'สถานที่',
  objects: 'สิ่งของ',
  activities: 'กิจกรรม',
  occupations: 'อาชีพ',
  concepts: 'แนวคิด',
  hardThings: 'เทคโนโลยี',
  culture: 'วัฒนธรรม',
  obscure: 'คำยาก',
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

export function pickWord(difficulty = 'medium') {
  const bank = DIFFICULTY_BANKS[difficulty] || DIFFICULTY_BANKS.medium;
  const keys = Object.keys(bank);
  const key = keys[Math.floor(Math.random() * keys.length)];
  const list = bank[key];
  return {
    word: list[Math.floor(Math.random() * list.length)],
    category: CATEGORY_LABELS[key] || key,
  };
}

/**
 * Pick N unique random words from the given difficulty bank (for word-choice mode).
 */
export function pickWordChoices(difficulty = 'medium', count = 6) {
  const bank = DIFFICULTY_BANKS[difficulty] || DIFFICULTY_BANKS.medium;
  // Pool all words across categories
  const allWords = [];
  for (const key of Object.keys(bank)) {
    for (const w of bank[key]) {
      allWords.push({ word: w, category: CATEGORY_LABELS[key] || key });
    }
  }
  // Shuffle and pick
  for (let i = allWords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
  }
  return allWords.slice(0, count);
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
