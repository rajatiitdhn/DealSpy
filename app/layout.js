
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata = {
  title: "DealSpy",
  description: "PriceTracker App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}
      <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
