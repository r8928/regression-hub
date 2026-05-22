import SessionWrapper from '@/components/SessionWrapper';
import { fontVariables } from './fonts';
import './globals.css';

export const metadata = {
  title: 'QA Regression Hub',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.svg' type='image/svg+xml' />
      </head>
      <body className={fontVariables} suppressHydrationWarning>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
