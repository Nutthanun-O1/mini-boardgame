'use client';

import React, { useState } from 'react'

const page = () => {
  const [status, setStatus] = useState('');

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setStatus('กำลังอ่านไฟล์และส่งข้อมูล... เหมียว');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // แปลงข้อความในไฟล์เป็น JSON Object เหมียว
        const jsonData = JSON.parse(e.target.result);

        // ส่งข้อมูลไปยัง API ที่เราทำไว้เหมียว
        const res = await fetch('/api/insert-words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jsonData),
        });

        if (res.ok) {
          setStatus('เพิ่มข้อมูลจากไฟล์สำเร็จแล้วเหมียว!');
        } else {
          setStatus('เกิดข้อผิดพลาดในการบันทึกข้อมูลเหมียว');
        }
      } catch (err) {
        setStatus('ไฟล์ไม่ใช่รูปแบบ JSON ที่ถูกต้องนะเหมียว');
      }
    };
    reader.readAsText(file);
  };
  return (
    <div className='w-full h-screen flex justify-center items-center'>
      <div className='w-sm h-full max-h-80 bg-white rounded-3xl flex justify-center items-center'>
        <div className='flex flex-col gap-2'>
          <p className='text-sm text-black'>ทิ้งไฟล์ json ในนี้เลยน้อง</p>
          <input 
                type="file" 
                accept=".json"
                className="file-input file-input-success"
                onChange={handleFileChange}
          />
          <p className="text-warning">{status}</p>
        </div>
      </div>
    </div>
  )
}

export default page