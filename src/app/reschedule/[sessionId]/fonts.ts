import localFont from 'next/font/local';

export const josefinSansBold = localFont({
  src: [
    {
      path: '../../public/fonts/josefin_sans/JosefinSans-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-josefin-bold',
});
