import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request) {
  try {
    const data = await request.json();
    const allowedDifficulties = ['easyWords', 'mediumWords', 'hardWords'];

    // 1. กรองเฉพาะข้อมูลที่ difficulty ถูกต้องเหมียว
    const validData = data.filter(item => allowedDifficulties.includes(item.difficulty));

    if (validData.length === 0) {
      return NextResponse.json({ error: 'ไม่มีข้อมูลที่ระดับความยากถูกต้องเลยเหมียว' }, { status: 400 });
    }

    // 2. ดึงรายการคำศัพท์จากไฟล์มาเช็คเหมียว
    const wordsInPayload = validData.map(item => item.word);

    // 3. ไปดูใน Table ว่ามีคำไหนซ้ำบ้างเหมียว
    const { data: existingRecords, error: fetchError } = await supabase
      .from('words')
      .select('word')
      .in('word', wordsInPayload);

    if (fetchError) {
      console.error("Supabase Fetch Error:", fetchError);
      throw fetchError;
    }

    // สร้างรายการคำที่ซ้ำใน Database เหมียว
    const chunkSize = 50;
    let existingWordsList = [];

    // วนลูปหั่นข้อมูลทีละ 50 คำเหมียว
    for (let i = 0; i < wordsInPayload.length; i += chunkSize) {
      const chunk = wordsInPayload.slice(i, i + chunkSize);

      const { data: records, error: fetchError } = await supabase
        .from('words')
        .select('word')
        .in('word', chunk); // ส่งไปเช็คทีละนิดเหมียว

      if (fetchError) {
        console.error("Supabase Fetch Error:", fetchError);
        throw fetchError;
      }

      // ถ้าเจอคำซ้ำ ให้เอามารวมไว้ในรายการเหมียว
      if (records) {
        existingWordsList.push(...records.map(item => item.word));
      }
    }

    // --- 4. กรองเอาเฉพาะคำที่ยังไม่มีใน Database จริง ๆ เหมียว ---
    const finalDataToInsert = data
      .filter(item =>
        item.word &&
        allowedDifficulties.includes(item.difficulty) &&
        !existingWordsList.includes(item.word)
      )
      .map(item => ({
        word: item.word,
        difficulty: item.difficulty,
        category: item.category
      }));

    console.log(finalDataToInsert)

    // 5. ถ้ากรองแล้วเหลือข้อมูล ค่อยส่งไปเพิ่มเหมียว
    if (finalDataToInsert.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from('words')
        .insert(finalDataToInsert)
        .select(); // เติม .select() เพื่อบังคับให้มันส่งผลลัพธ์กลับมาให้ดูเหมียว
      if (insertError) throw insertError;

      return NextResponse.json({
        message: `เพิ่มข้อมูลใหม่ ${finalDataToInsert.length} คำสำเร็จ! (ข้ามคำซ้ำไป ${existingWordsList.length} คำ) เหมียว`
      }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'ทุกคำที่มีในไฟล์ มีอยู่ในระบบหมดแล้วเหมียว' }, { status: 200 });
    }

  } catch (error) {
    console.error("Full Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}