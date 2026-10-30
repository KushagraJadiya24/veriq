import "./globals.css";

export const metadata = {
  title: "Veriq: ask your database in plain English",
  description:
    "Veriq turns questions into read-only SQL, checks it, and shows exactly what ran.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1B2A41",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
