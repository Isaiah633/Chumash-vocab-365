import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chumash Vocab 365",
  description:
    "Learn Biblical Hebrew vocabulary from the Chumash with spaced repetition.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
