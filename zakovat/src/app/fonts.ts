import localFont from "next/font/local";

// Same font files are embedded in the generated PDFs, so the on-screen preview
// matches the printed certificate.
export const playfair = localFont({
  variable: "--font-playfair",
  display: "swap",
  src: [
    { path: "../../public/fonts/PlayfairDisplay_600SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/PlayfairDisplay_700Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/PlayfairDisplay_400Regular_Italic.ttf", weight: "400", style: "italic" },
  ],
});

export const notoSans = localFont({
  variable: "--font-noto-sans",
  display: "swap",
  src: [
    { path: "../../public/fonts/NotoSans_400Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/NotoSans_500Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/NotoSans_600SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/NotoSans_700Bold.ttf", weight: "700", style: "normal" },
  ],
});

export const notoSerif = localFont({
  variable: "--font-noto-serif",
  display: "swap",
  src: [
    { path: "../../public/fonts/NotoSerif_400Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/NotoSerif_700Bold.ttf", weight: "700", style: "normal" },
  ],
});
