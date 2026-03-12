import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// เชื่อมต่อกับ Supabase เหมียว
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
 try {
    const data = await request.json(); // ข้อมูลจากไฟล์ JSON ที่เอเธนส์ส่งมา
    const allowedDifficulties = ['easyWords', 'mediumWords', 'hardWords'];

    // 1. ตรวจสอบระดับความยากเหมียว
    for (const item of data) {
      if (!allowedDifficulties.includes(item.difficulty)) {
        return NextResponse.json({ error: `ระดับ '${item.difficulty}' ไม่ถูกต้องเหมียว!` }, { status: 400 });
      }
    }

    // 2. ดึงรายการคำศัพท์ทั้งหมดจากไฟล์มาเตรียมไว้เหมียว
    const wordsInPayload = data.map(item => item.คำ);

    // 3. ตรวจสอบกับ Database ว่ามีคำเหล่านี้อยู่แล้วหรือยังเหมียว
    const { data: existingRecords, error: fetchError } = await supabase
      .from('words') // เปลี่ยนชื่อ Table ให้ตรงกับของเอเธนส์นะเหมียว
      .select('word')
      .in('word', wordsInPayload);

    if (fetchError) throw fetchError;

    // ถ้าเจอคำซ้ำใน Database เหมียว
    if (existingRecords && existingRecords.length > 0) {
      const duplicateWords = existingRecords.map(item => item.คำ).join(', ');
      return NextResponse.json({ 
        error: `ยกเลิกการเพิ่มข้อมูล! เพราะมีคำว่า [${duplicateWords}] อยู่ในฐานข้อมูลแล้วเหมียว` 
      }, { status: 400 });
    }

    // 4. ถ้าไม่มีคำซ้ำเลย ก็เพิ่มข้อมูลทั้งหมดลงไปเหมียว
    const { error: insertError } = await supabase.from('words').insert(data);
    if (insertError) throw insertError;

    return NextResponse.json({ message: 'เช็คแล้วไม่มีคำซ้ำ เพิ่มข้อมูลเรียบร้อยแล้วเหมียว!' }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}