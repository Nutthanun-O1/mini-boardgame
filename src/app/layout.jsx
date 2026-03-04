import './globals.css';

export const metadata = {
  title: 'Board Game Online',
  description: 'เล่นบอร์ดเกมออนไลน์กับเพื่อน',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
