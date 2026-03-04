'use client';

import { useState } from 'react';

/**
 * แสดงภาพพร้อม fallback — ถ้าภาพโหลดไม่ได้จะแสดงตัวอักษรแทน
 */
export default function FallbackImage({ src, fallback, alt, className, imageClassName }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={className}>
        <span className={imageClassName}>{fallback}</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        src={src}
        alt={alt || ''}
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}
