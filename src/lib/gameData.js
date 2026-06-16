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
    'ลิง','งู','หมู','วัว','ไก่','เป็ด','กบ','เต่า',
    'แมลง','หนู','ปู','กุ้ง','หอย','นกพิราบ','ปลาทอง',
    'มด','ยุง','แมลงปอ','หนอน','ผึ้ง','แมงกะพรุน','ปลาการ์ตูน','หิ่งห้อย',
  ],
  food: [
    'ข้าว','ไข่','นม','น้ำ','ขนมปัง','เค้ก','พิซซ่า',
    'ไอศกรีม','ผัดไทย','ส้มตำ','กล้วย','แตงโม','มะม่วง',
    'ช็อกโกแลต','แฮมเบอร์เกอร์','บะหมี่','ข้าวเหนียว','มะละกอ',
    'เต้าหู้','ลูกชิ้น','แซนด์วิช','ป๊อปคอร์น','องุ่น','สับปะรด',
    'ส้ม','เงาะ','ลำไย','ขนมจีน','ก๋วยเตี๋ยว','ขนมครก',
  ],
  objects: [
    'โทรศัพท์','นาฬิกา','กุญแจ','ร่ม','แว่นตา','กระเป๋า',
    'หมอน','ดินสอ','กรรไกร','กระจก','พัดลม','เก้าอี้',
    'โต๊ะ','ประตู','รองเท้า','ผ้าขนหนู','หวี','สบู่',
    'แปรงสีฟัน','ถุงเท้า','หมวก','เสื้อ','กางเกง','ผ้าห่ม',
    'ถ้วย','จาน','ช้อน','ส้อม','ขวดน้ำ','ปากกา',
  ],
  places: [
    'บ้าน','ตลาด','สวนสาธารณะ','ห้างสรรพสินค้า',
    'ห้องสมุด','โรงภาพยนตร์','สระว่ายน้ำ','สถานีรถไฟ',
    'ร้านสะดวกซื้อ','ปั๊มน้ำมัน','ร้านตัดผม','ร้านกาแฟ',
    'สนามฟุตบอล','โรงยิม','สนามเด็กเล่น','ไปรษณีย์',
    'ร้านซักผ้า','ตลาดนัด','ร้านหนังสือ','ลานจอดรถ',
  ],
  vehicles: [
    'รถยนต์','รถบัส','รถไฟฟ้า','เครื่องบิน','เรือ','จักรยาน',
    'รถมอเตอร์ไซค์','สามล้อ','รถแท็กซี่','รถตู้','รถพยาบาล',
    'รถดับเพลิง','เฮลิคอปเตอร์','รถบรรทุก','เรือแคนู','รถเมล์',
  ],
  bodyParts: [
    'มือ','เท้า','ตา','หู','จมูก','ปาก','ฟัน',
    'ลิ้น','นิ้ว','หัวเข่า','ข้อศอก','ไหล่','คาง','คิ้ว','แก้ม',
  ],
};

/**
 * ปานกลาง: คำที่รู้จักแต่ต้องคิดหน่อย
 */
const mediumWords = {
  animals: [
    'เสือ','สิงโต','เพนกวิน','ปลาโลมา','นกแก้ว','จระเข้',
    'ยีราฟ','หมี','แมงมุม','ผีเสื้อ','ปลาหมึก','แมวน้ำ',
    'นกฮูก','ม้าลาย','กวาง','ฮิปโป','อีกัว','แรด','กอริลลา',
    'นากทะเล','ชิมแปนซี','นกกระจอกเทศ','ตัวกิ้งก่า','หมาป่า',
    'พะยูน','นกยูง','กิ้งก่า','อูฐ','ตุ่น','แพนด้า',
  ],
  food: [
    'ต้มยำกุ้ง','ซูชิ','สเต็ก','ราเมน','มะพร้าว','ทุเรียน',
    'กุ้งเผา','ข้าวมันไก่','โดนัท','วาฟเฟิล','มักกะโรนี',
    'ติ่มซำ','เครป','ทาโก้','ข้าวซอย','ลาบ','น้ำพริกอ่อง',
    'แกงเขียวหวาน','พะแนง','มัสมั่น','แกงส้ม','ยำวุ้นเส้น',
    'ข้าวผัด','หมูสะเต๊ะ','หมูกระทะ','ชาบู','บิงซู',
    'ครัวซองต์','แพนเค้ก','บราวนี่',
  ],
  objects: [
    'เทียน','ลูกโป่ง','ไฟฉาย','กล้องถ่ายรูป','กีตาร์',
    'กระบอกโทรศัพท์','ว่าว','เข็มทิศ','กล้องส่องทางไกล','เชือก',
    'ตะเกียง','ลูกบาศก์','กล่องดนตรี','ไม้ขีดไฟ','หน้ากาก',
    'กล้องจุลทรรศน์','เปียโน','กลอง','ขลุ่ย','กล่องเครื่องมือ',
    'แม่กุญแจ','โคมไฟ','ลูกโลก','หมากรุก','ไพ่','ลูกเต๋า',
    'แว่นขยาย','กระดาษ','สมุด','โปสการ์ด',
  ],
  activities: [
    'ว่ายน้ำ','ร้องเพลง','ทำอาหาร','วาดรูป','เต้นรำ',
    'ตกปลา','ปีนเขา','ถ่ายรูป','เล่นเกม','ช้อปปิ้ง',
    'แคมป์ปิ้ง','ดำน้ำ','โยคะ','ปั่นจักรยาน','สเก็ตบอร์ด',
    'เล่นว่าว','เล่นหมากรุก','อ่านหนังสือ','ดูหนัง','ร้องคาราโอเกะ',
    'เล่นกีฬา','วิ่ง','ต่อจิ๊กซอว์','เล่นบอร์ดเกม','ปลูกต้นไม้',
    'ทำสวน','เล่นเซิร์ฟ','พายเรือ','กระโดดร่ม','เล่นโบว์ลิ่ง',
  ],
  occupations: [
    'หมอ','ครู','ตำรวจ','นักบิน','พ่อครัว',
    'นักดับเพลิง','ทนายความ','วิศวกร','ชาวนา','ช่างภาพ',
    'สัตวแพทย์','จิตรกร','นักดนตรี','นักเขียน','พยาบาล',
    'นักแสดง','ผู้กำกับ','นักข่าว','บาร์เทนเดอร์','ช่างตัดผม',
    'เภสัชกร','นักบัญชี','สถาปนิก','นักออกแบบ','โปรแกรมเมอร์',
    'ยูทูปเบอร์','นักกีฬา','กัปตันเรือ','มัคคุเทศก์','ดีเจ',
  ],
  nature: [
    'ภูเขา','แม่น้ำ','ทะเล','น้ำตก','ถ้ำ','ทะเลทราย',
    'ป่า','เกาะ','ภูเขาไฟ','ธารน้ำแข็ง','ปะการัง','หุบเขา',
    'ทุ่งหญ้า','ป่าชายเลน','บึง',
  ],
  entertainment: [
    'คอนเสิร์ต','ละคร','เกมโชว์','มายากล','ซีรีส์',
    'การ์ตูน','หนังสือการ์ตูน','คอสเพลย์','เทศกาลดนตรี','ดนตรีสด',
    'โรงละคร','ตู้คีบตุ๊กตา','ห้องหนีปริศนา','เกมกระดาน','ปาร์ตี้',
  ],
};

/**
 * ยาก: คำนามธรรม / คอนเซ็ปต์ / ต้องตีความ
 */
const hardWords = {
  concepts: [
    'เสรีภาพ','ความยุติธรรม','ประชาธิปไตย','แรงโน้มถ่วง',
    'อนาคต','ความฝัน','จิตวิญญาณ','มิตรภาพ','ความกลัว',
    'เวลา','ความจริง','ศรัทธา','ดวงชะตา','สัญชาตญาณ','อิสรภาพ',
    'จินตนาการ','ความทรงจำ','ความสุข','ความเศร้า','ความรัก',
    'ความโกรธ','ความเหงา','ความหวัง','แรงบันดาลใจ','ความซื่อสัตย์',
    'จริยธรรม','สำนึก','อัตตา','กรรม','นิพพาน',
  ],
  hardThings: [
    'เดจาวู','ออโรร่า','หลุมดำ','ดีเอ็นเอ','บล็อกเชน',
    'อัลกอริทึม','ปัญญาประดิษฐ์','เมตาเวิร์ส','ควอนตัม',
    'พาราด็อกซ์','ยูโทเปีย','คริปโต','โฮโลแกรม','นาโนเทคโนโลยี','ไซเบอร์',
    'จักรวาลคู่ขนาน','ไทม์แมชชีน','มิติที่สี่','สมการ','ทฤษฎีสัมพัทธภาพ',
    'โคลนนิ่ง','จีโนม','สตาร์ทอัป','อินเทอร์เน็ต','ซอฟต์แวร์',
    'ฮาร์ดแวร์','เซิร์ฟเวอร์','คลาวด์','บิ๊กดาต้า','ไมโครชิป',
  ],
  culture: [
    'สงกรานต์','ลอยกระทง','ไหว้ครู','บวชนาค','ทอดกฐิน',
    'รำไทย','มวยไทย','ตุ๊กตุ๊ก','ตักบาตร','กระทง',
    'พิธีรดน้ำ','ขันโตก','ผ้าไหม','โขน','หนังตะลุง',
    'ลิเก','หุ่นกระบอก','รำวง','ขบวนแห่','ฟ้อนเล็บ',
    'หมอลำ','ผ้าขาวม้า','กลองยาว','ปี่พาทย์','ระนาด',
    'เครื่องสาย','ตะกร้อ','ว่าวจุฬา','เรือยาว','พระพุทธรูป',
  ],
  obscure: [
    'กาลอวกาศ','มิราจ','ไคเนซิส','ซินเนสทีเซีย','เอนโทรปี',
    'โทโพโลยี','ฟิโบนัชชี','แฟร็กทัล','เนบิวลา','ซูเปอร์โนวา',
    'ดิสโทเปีย','ไซเคเดลิก','เซอร์เรียล','อะมีบา','ฟอสซิล',
    'ควาซาร์','พัลซาร์','แอนติแมตเตอร์','ไอโซโทป','โฟตอน',
    'นิวตริโน','โปรตอน','อิเล็กตรอน','เซลล์ต้นกำเนิด','พลาสมา',
    'ชีวสาร','โมเลกุล','โครโมโซม','ไวรัส','แบคทีเรีย',
  ],
  emotions: [
    'ความอิจฉา','ความภาคภูมิใจ','ความละอาย','ความสงสาร','ความสับสน',
    'ความตื่นเต้น','ความประหลาดใจ','ความเบื่อ','ความรังเกียจ','ความหลง',
    'ความทะเยอทะยาน','ความโหยหา','ความอาย','ความขยะแขยง','ความมั่นใจ',
  ],
  abstract: [
    'อุปมา','สัญลักษณ์','ปรัชญา','ตรรกะ','ทฤษฎี',
    'สมมติฐาน','มายาคติ','อุดมการณ์','จิตใต้สำนึก','นิยาม',
    'มโนทัศน์','สัจนิยม','อนาธิปไตย','ทุนนิยม','สังคมนิยม',
  ],
};

/**
 * nightmare: คำยากมาก / คาดไม่ถึง / ตอบเชิงตีความ
 */
const nightmareWords = {
  thaiMyth: [
    'นนทก','ทศกัณฐ์','อินทรชิต','กุมภกรรณ','พิเภก','สุวรรณมัจฉา',
    'ไมยราพ','ฤาษี','ครุฑ','นาค','กินรี','ยักษ์','กัณหา','รามเกียรติ์','พระลักษณ์',
  ],
  rareAnimals: [
    'ม้านิลมังกร','ทากทะเล','ฉลามกรีนแลนด์','หมึกดัมโบ้','แมงดาทะเล',
    'กุ้งตั๊กแตน','แอกโซลอเติล','โอกาปิ','นาร์วาฬ','แพนโกลิน','วอมแบต',
    'เมียร์แคต','ค้างคาวจมูกใบไม้','เต่าอัลดาบรา','ฮิปโปแคระ',
  ],
  geography: [
    'หมู่เกาะกาลาปากอส','ช่องแคบมะละกา','สามเหลี่ยมเบอร์มิวดา','วงแหวนแห่งไฟ',
    'ที่ราบสูงทิเบต','ทะเลเดดซี','หุบเขาไรน์','แหลมกู๊ดโฮป','ขั้วโลกเหนือ',
    'ธารน้ำแข็งเพอริโตโมเรโน','ที่ราบลุ่มเมโสโปเตเมีย','ทะเลอารัล','เกาะไอซ์แลนด์',
    'คลองสุเอซ','คลองปานามา',
  ],
  thaiHistory: [
    'เสียกรุงครั้งที่สอง','ศึกยุทธหัตถี','บางระจัน','ปฏิวัติ 2475','สนธิสัญญาเบาว์ริง',
    'สุโขทัย','อยุธยา','ธนบุรี','รัตนโกสินทร์','กฎหมายตราสามดวง',
    'ศิลาจารึกหลักที่ 1','พ่อขุนรามคำแหง','สมเด็จพระนเรศวร','สมเด็จพระเจ้าตากสิน','ทวิภาคี',
  ],
  scienceDeep: [
    'กลศาสตร์ควอนตัม','ภาวะพัวพันควอนตัม','เอกฐาน','สสารมืด','พลังงานมืด',
    'ทฤษฎีสตริง','สนามฮิกส์','โบซอนฮิกส์','อุณหพลศาสตร์','เอนทัลปี',
    'ซูเปอร์คอนดักเตอร์','เลนส์ความโน้มถ่วง','พหุจักรวาล','ความไม่แน่นอนของไฮเซนเบิร์ก','โมเมนตัมเชิงมุม',
  ],
  literaturePhilo: [
    'อัตถิภาวนิยม','สุญนิยม','สัมพัทธนิยม','ปฏิฐานนิยม','ปรากฏการณ์วิทยา',
    'ปัจเจกนิยม','โสเครติส','เพลโต','อริสโตเติล','นิทเชอ',
    'กามูส์','ดอสโตเยฟสกี','อุปมาอุปไมย','ปริศนาธรรม','จริยศาสตร์เชิงคุณธรรม',
  ],
  artifacts: [
    'ศิลาโรเซตตา','หินสโตนเฮนจ์','โมอาย','โคลอสเซียม','กำแพงเมืองจีน',
    'นครวัด','ปิรามิดกีซา','มาชูปิกชู','อักษรรูน','ดาบเอ็กซ์คาลิเบอร์',
    'คัมภีร์เดดซี','แผนที่พีรีเรส','เครื่องจักรแอนติคิธีรา','หีบพันธสัญญา','ตราพระราชลัญจกร',
  ],
  weirdModern: [
    'ไวรัลมีม','โดพามีนลูป','ฟิลเตอร์บับเบิล','อัลกอริทึมแนะนำ','ดีพเฟก',
    'ดิจิทัลฟุตพรินต์','ไบโอแฮ็กกิ้ง','โนโคด','ควอนต์ฟันด์','เมตาอะนาไลซิส',
    'ภาวะหมดไฟ','เศรษฐศาสตร์พฤติกรรม','ทฤษฎีเกม','ปรากฏการณ์แมนเดลา','ห้องเสียงสะท้อน',
  ],
};

const DIFFICULTY_BANKS = {
  easy: easyWords,
  medium: mediumWords,
  hard: hardWords,
  nightmare: nightmareWords,
};

const CATEGORY_LABELS = {
  animals: 'สัตว์',
  food: 'อาหาร',
  places: 'สถานที่',
  objects: 'สิ่งของ',
  vehicles: 'ยานพาหนะ',
  bodyParts: 'ร่างกาย',
  activities: 'กิจกรรม',
  occupations: 'อาชีพ',
  nature: 'ธรรมชาติ',
  entertainment: 'ความบันเทิง',
  concepts: 'แนวคิด',
  hardThings: 'เทคโนโลยี',
  culture: 'วัฒนธรรม',
  obscure: 'คำยาก',
  emotions: 'อารมณ์',
  abstract: 'นามธรรม',
  thaiMyth: 'วรรณคดี/เทพปกรณัมไทย',
  rareAnimals: 'สัตว์หายาก',
  geography: 'ภูมิศาสตร์โลก',
  thaiHistory: 'ประวัติศาสตร์ไทย',
  scienceDeep: 'วิทยาศาสตร์ขั้นลึก',
  literaturePhilo: 'วรรณกรรม/ปรัชญา',
  artifacts: 'โบราณวัตถุ/อารยธรรม',
  weirdModern: 'แนวคิดร่วมสมัย',
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

export async function pickWord(difficulty = 'medium') {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('words')
    .select('word, category_label')
    .eq('difficulty', difficulty);

  if (error || !data || data.length === 0) {
    console.error('Error fetching words:', error);
    // Fallback if DB is empty
    return { word: 'ทดสอบ', category: 'ทั่วไป' };
  }

  const randomIdx = Math.floor(Math.random() * data.length);
  const picked = data[randomIdx];
  return {
    word: picked.word,
    category: picked.category_label
  };
}

/**
 * Pick N unique random words from the given difficulty bank (for word-choice mode).
 * Guarantees no duplicate words.
 */
export async function pickWordChoices(difficulty = 'medium', count = 5) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('words')
    .select('word, category_label')
    .eq('difficulty', difficulty);

  if (error || !data || data.length === 0) {
    console.error('Error fetching word choices:', error);
    // Fallback if DB is empty
    return Array(count).fill({ word: 'ทดสอบ', category: 'ทั่วไป' });
  }

  // Shuffle (Fisher–Yates) and pick
  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }
  
  return data.slice(0, count).map(d => ({
    word: d.word,
    category: d.category_label
  }));
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

// ══════════════════════════════════════════════
//  Exploding Kittens helpers
// ══════════════════════════════════════════════

export const KITTENS_CARDS = {
  defuse: { label: 'กู้ระเบิด', desc: 'ใช้เมื่อจั่วได้แมวระเบิด เพื่อเอาตัวรอด', color: '#10b981', action: false, img: '/images/explode-cat/Defuse-Via-3AM-Flatulence.jpg' },
  kitten: { label: 'แมวระเบิด', desc: 'หากจั่วได้การ์ดนี้และไม่มีการ์ดกู้ระเบิด คุณจะแพ้ทันที', color: '#ef4444', action: false, img: '/images/explode-cat/Exploding-Kitten-Alien.jpg' },
  attack: { label: 'โจมตี', desc: 'จบเทิร์นโดยไม่ต้องจั่วไพ่ และบังคับให้ผู้เล่นคนถัดไปเล่น 2 เทิร์น', color: '#f59e0b', action: true, img: '/images/explode-cat/Attack-Bear-o-Dactyl.jpg' },
  skip: { label: 'ข้าม', desc: 'จบเทิร์นโดยไม่ต้องจั่วไพ่ 1 ใบ', color: '#3b82f6', action: true, img: '/images/explode-cat/Skip-Commandeer-a-Bunnyraptor.jpg' },
  'see-future': { label: 'มองเห็นอนาคต', desc: 'แอบดูไพ่ 3 ใบแรกจากกองจั่ว', color: '#8b5cf6', action: true, img: '/images/explode-cat/See-the-Future-Ask-the-All-Seeing-Goat-Wizard.jpg' },
  shuffle: { label: 'สับไพ่', desc: 'สับกองการ์ดจั่วทั้งหมดเพื่อเปลี่ยนลำดับไพ่', color: '#ec4899', action: true, img: '/images/explode-cat/Shuffle-A-Kraken-Emerges-and-Hes-Super-Upset.jpg' },
  favor: { label: 'ขอความช่วยเหลือ', desc: 'บังคับให้ผู้เล่น 1 คน มอบการ์ดในมือให้คุณ 1 ใบ (ผู้เล่นคนนั้นเลือกเอง)', color: '#06b6d4', action: true, img: '/images/explode-cat/Favor-Fall-So-Deeply-in-Love.jpg' },
  
  // Phase 1 Additions
  reverse: { label: 'ย้อนกลับ', desc: 'จบเทิร์นโดยไม่ต้องจั่วไพ่ และสลับทิศทางการเล่น', color: '#facc15', action: true, img: '/images/explode-cat/Reverse-Go-Back-In-Time-And-Steal-A-Pregnant-Dinosaur.jpg' },
  'draw-from-bottom': { label: 'จั่วจากล่างสุด', desc: 'จบเทิร์นของคุณโดยการจั่วไพ่จากใบล่างสุดของกอง', color: '#64748b', action: true, img: '/images/explode-cat/Draw-from-the-Bottom-Take-a-Big-Bite-of-Your-Coward-Sandwich.jpg' },
  'targeted-attack': { label: 'โจมตีระบุเป้าหมาย', desc: 'จบเทิร์นโดยไม่ต้องจั่วไพ่ และบังคับให้ผู้เล่นที่คุณเลือกเล่น 2 เทิร์น', color: '#ea580c', action: true, img: '/images/explode-cat/Targeted-Attack-2x-Deploy-The-Groin-Kicking-Panda-Bear.jpg' },
  'super-skip': { label: 'ซูเปอร์ข้าม', desc: 'จบเทิร์นของคุณทั้งหมด (ข้ามเทิร์นที่สะสมไว้ทั้งหมด) โดยไม่ต้องจั่วไพ่', color: '#2563eb', action: true, img: '/images/explode-cat/Super-Skip-Hitch-A-Ride-on-a-Corgihorse.jpg' },
  'swap-top-bottom': { label: 'สลับบนล่าง', desc: 'สลับไพ่ใบบนสุดกับใบล่างสุดของกองจั่ว โดยไม่ต้องดูหน้าไพ่', color: '#d946ef', action: true, img: '/images/explode-cat/Swap-Top-and-Bottom.jpg' },
  'personal-attack': { label: 'โจมตีตัวเอง', desc: 'เพิ่ม 3 เทิร์นให้กับตัวคุณเอง (ปกติจะใช้คู่กับการ์ดอื่นๆ เพื่อสะสมแอคชั่น)', color: '#be123c', action: true, img: '/images/explode-cat/Personal-Attack-Finally-Throw-Up-All-the-Crayons-You-Ate-When-You-Were-A-Kid.jpg' },
  
  // Phase 2 Additions
  'alter-future': { label: 'แก้ไขอนาคต', desc: 'แอบดูไพ่ 3 ใบบนสุด และจัดเรียงลำดับใหม่ได้', color: '#8b5cf6', action: true, img: '/images/explode-cat/Alter-the-Future-Cat-Wizard.jpg' },
  'share-future': { label: 'แชร์อนาคต', desc: 'เปิดไพ่ 3 ใบบนสุดให้ทุกคนเห็นพร้อมกัน', color: '#8b5cf6', action: true, img: '/images/explode-cat/Share-the-Future-Listen-to-the-Words-of-an-Emo-Emu.jpg' },
  'beard-cat': { label: 'Beard Cat', desc: 'สะสมครบ 2 ใบใช้สุ่มขโมยการ์ด', color: '#6b7280', action: false, img: '/images/explode-cat/Beard-Cat.jpg' },
  'feral-cat': { label: 'Feral Cat', desc: 'ใช้แทนไพ่แมวปกติใบไหนก็ได้ 1 ใบ', color: '#6b7280', action: false, img: '/images/explode-cat/Feral-Cat.jpg' },
  
  // Phase 3 & 4 Additions
  'nope': { label: 'ไม่!', desc: 'หยุดการทำงานของการ์ดแอคชั่นใดๆ ยกเว้นแมวระเบิดและกู้ระเบิด เล่นตอนไหนก็ได้', color: '#ef4444', action: false, isNope: true, img: '/images/explode-cat/Nope-A-Jackanope-Bounds-into-the-Room.jpg' },
  'imploding-kitten': { label: 'แมวระเบิดหงายหน้า', desc: 'ไม่สามารถกู้ได้! ถ้าจั่วเจอคือตายทันที (ภาคเสริม)', color: '#000000', action: false, img: '/images/explode-cat/Imploding-Kitten.jpg' },
  'streaking-kitten': { label: 'Streaking Kitten', desc: 'คุณสามารถถือแมวระเบิดไว้ในมือได้โดยไม่ตาย (ภาคเสริม)', color: '#f59e0b', action: false, img: '/images/explode-cat/Streaking-Kitten.jpg' },
  'zombie-kitten': { label: 'Zombie Kitten', desc: 'กู้ระเบิดได้และชุบชีวิตผู้เล่นที่ตายไปแล้ว 1 คน (ภาคเสริม)', color: '#10b981', action: false, img: '/images/explode-cat/Zombie-Kitten-Always-Land-On-Your-Feet.jpg' }
};

export function initKittensGame(players, targetDeckSize = 50, customKittensCount = null) {
  const pCount = players.length;
  
  // 1. Create a pool of action cards
  let actionPool = [];
  const baseCardCounts = {
    attack: 4, skip: 4, 'see-future': 5, shuffle: 4, favor: 4,
    reverse: 4, 'draw-from-bottom': 4, 'targeted-attack': 3, 
    'super-skip': 2, 'swap-top-bottom': 3, 'personal-attack': 3,
    'alter-future': 4, 'share-future': 2,
    'beard-cat': 4, 'feral-cat': 4,
    'nope': 5,
    'streaking-kitten': 1,
    'zombie-kitten': 2
  };
  
  Object.entries(baseCardCounts).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) actionPool.push(type);
  });
  
  const neededActionsForHands = pCount * 4;
  const defusesInDeck = Math.max(0, 6 - pCount);
  const kittensCount = customKittensCount !== null && customKittensCount > 0 
    ? customKittensCount 
    : Math.max(1, pCount); // pCount instead of pCount-1 because Streaking Kitten allows holding 1 bomb
    
  let desiredActionPoolSize = targetDeckSize - kittensCount - defusesInDeck + neededActionsForHands;
  if (desiredActionPoolSize < neededActionsForHands) {
    desiredActionPoolSize = neededActionsForHands;
  }
  
  while (actionPool.length < desiredActionPoolSize) {
    const keys = Object.keys(baseCardCounts);
    actionPool.push(keys[Math.floor(Math.random() * keys.length)]);
  }
  
  if (actionPool.length > desiredActionPoolSize) {
    actionPool = actionPool.slice(0, desiredActionPoolSize);
  }

  // Shuffle the initial action pool
  for (let i = actionPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [actionPool[i], actionPool[j]] = [actionPool[j], actionPool[i]];
  }

  // 2. Deal hands to players
  const hands = {};
  players.forEach(p => {
    // Deal 1 Defuse and 4 random action cards
    hands[p.id] = ['defuse', ...actionPool.splice(0, 4)];
  });

  // 3. Build the draw deck
  // Remaining action cards + remaining Defuses + Kittens
  let deck = [...actionPool];
  
  // Add remaining defuses to the deck (standard rules: total 6 defuses, leftover go to deck)
  const leftoverDefuses = Math.max(0, 6 - pCount);
  for (let i = 0; i < leftoverDefuses; i++) {
    deck.push('defuse');
  }

  // Add exploding kittens and 1 imploding kitten
  if (kittensCount > 0) {
    deck.push('imploding-kitten'); // First bomb is Imploding Kitten
    for (let i = 1; i < kittensCount; i++) {
      deck.push('kitten');
    }
  }

  // Shuffle final deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  // Shuffled turn order
  const turnOrder = players.map(p => p.id);
  for (let i = turnOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [turnOrder[i], turnOrder[j]] = [turnOrder[j], turnOrder[i]];
  }

  return {
    deck,
    discard: [],
    hands,
    turnOrder,
    currentTurnIdx: 0,
    currentPlayerId: turnOrder[0],
    turnDirection: 1, // 1 for normal, -1 for reverse
    attacksRemaining: 0, // > 0 means current player has extra turns to play
    eliminated: [],
    status: 'playing',
    lastAction: 'เริ่มเกมแล้ว! ตาของ ' + (players.find(p => p.id === turnOrder[0])?.name || 'ผู้เล่นคนแรก'),
    futureCards: null,
    pendingKitten: null, // { player_id, card }
    kittensSettings: {
      deckSize: targetDeckSize,
      bombCount: customKittensCount || 0
    }
  };
}

