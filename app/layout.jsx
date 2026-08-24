import "./globals.css";
import IntroSplash from "./lib/IntroSplash";

export const metadata = {
  title: "دونیای بۆنەکان | World of Scents",
  description: "A curated collection of fine fragrances",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <IntroSplash />
        {children}
      </body>
    </html>
  );
}