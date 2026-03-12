/**
 * Game data — word banks, locations, and helper functions.
 */
import { createClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey)


// ══════════════════════════════════════════════
//  Insider word bank — by difficulty
// ══════════════════════════════════════════════

// 1. ดึงข้อมูลทั้งหมดจากตาราง words เหมียว (เพิ่มดักจับ Error เพื่อไม่ให้ค้างเหมียว)
let allWords = [];
try {
  const { data: responseData, error: fetchError } = await supabase
  .from('words')
  .select('word, difficulty, category');

if (fetchError) {
  console.error('❌ ดึงข้อมูลไม่สำเร็จ:', fetchError.message);
} else {
  allWords = responseData || [];
  console.log('✅ ข้อมูลที่ดึงได้จาก DB:', allWords); // ดูใน Console ว่ามีข้อมูลไหมเหมียว
}
} catch (e) {
  console.error('❌ Connection Error:', e.message);
}

// 2. เตรียมตัวแปรไว้ข้างนอกบล็อก
let easyWords = {};
let mediumWords = {};
let hardWords = {};

// 3. จัดกลุ่มข้อมูล (เช็คด้วยว่ามีข้อมูลไหมเหมียว)
if (allWords.length > 0) {
  const groupByCategory = (difficultyLevel) => {
    return allWords
      .filter(item => item.difficulty === difficultyLevel)
      .reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item.word);
        return acc;
      }, {});
  };

  easyWords = groupByCategory('easyWords');
  mediumWords = groupByCategory('mediumWords');
  hardWords = groupByCategory('hardWords');
}

// 4. DIFFICULTY_BANKS คงชื่อเดิมไว้เหมียว
export const DIFFICULTY_BANKS = {
  easy: easyWords,
  medium: mediumWords,
  hard: hardWords,
};

const CATEGORY_LABELS = {
  animals: 'สัตว์', food: 'อาหาร', places: 'สถานที่', objects: 'สิ่งของ',
  vehicles: 'ยานพาหนะ', bodyParts: 'ร่างกาย', activities: 'กิจกรรม',
  occupations: 'อาชีพ', nature: 'ธรรมชาติ', entertainment: 'ความบันเทิง',
  concepts: 'แนวคิด', hardThings: 'เทคโนโลยี', culture: 'วัฒนธรรม',
  obscure: 'คำยาก', emotions: 'อารมณ์', abstract: 'นามธรรม',
};

// ══════════════════════════════════════════════
//  Spyfall locations
// ══════════════════════════════════════════════
export const spyfallLocations = {
  school: 'โรงเรียน', hospital: 'โรงพยาบาล', airport: 'สนามบิน',
  beach: 'ชายหาด', casino: 'คาสิโน', supermarket: 'ซูเปอร์มาร์เก็ต',
  restaurant: 'ร้านอาหาร', spaceship: 'ยานอวกาศ', submarine: 'เรือดำน้ำ',
  zoo: 'สวนสัตว์', temple: 'วัด', bank: 'ธนาคาร', circus: 'ละครสัตว์',
  pirate_ship: 'เรือโจรสลัด', police_station: 'สถานีตำรวจ',
  movie_studio: 'สตูดิโอถ่ายหนัง', train: 'รถไฟ', amusement_park: 'สวนสนุก',
  university: 'มหาวิทยาลัย', hotel: 'โรงแรม',
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
  
  // ถ้ายังโหลดไม่เสร็จหรือไม่มีข้อมูล ให้บอกว่ากำลังโหลดเหมียว
  if (keys.length === 0) {
    return { word: 'กำลังรอข้อมูล...', category: 'รอนิดนึงเหมียว' };
  }

  const key = keys[Math.floor(Math.random() * keys.length)];
  const list = bank[key];

  if (!list || list.length === 0) {
    return { word: 'กำลังดึงคำ...', category: CATEGORY_LABELS[key] || key };
  }

  return {
    word: list[Math.floor(Math.random() * list.length)],
    category: CATEGORY_LABELS[key] || key,
  };
}

export function pickWordChoices(difficulty = 'medium', count = 6) {
  const bank = DIFFICULTY_BANKS[difficulty] || DIFFICULTY_BANKS.medium;
  const seen = new Set();
  const allWordsPool = [];
  
  for (const key of Object.keys(bank)) {
    if (Array.isArray(bank[key])) {
      for (const w of bank[key]) {
        if (!seen.has(w)) {
          seen.add(w);
          allWordsPool.push({ word: w, category: CATEGORY_LABELS[key] || key });
        }
      }
    }
  }

  if (allWordsPool.length === 0) return [];

  for (let i = allWordsPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allWordsPool[i], allWordsPool[j]] = [allWordsPool[j], allWordsPool[i]];
  }
  return allWordsPool.slice(0, count);
}

export function pickSpyfallLocation() {
  const keys = Object.keys(spyfallLocations);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { locationKey: key, locationLabel: spyfallLocations[key] };
}

export async function generateRoomCode() {
  const supabaseRoom = getSupabase(); // เปลี่ยนชื่อเพื่อไม่ให้ตีกับข้างบนเหมียว
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  const { data } = await supabaseRoom.from('rooms').select('code').eq('code', code).maybeSingle();
  if (data) return generateRoomCode();
  return code;
}