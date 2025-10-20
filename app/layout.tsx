import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100">
        <main className="mx-auto max-w-3xl p-6">{children}</main>
      </body>
    </html>
  )
}
