import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Austin English',
  description: '个性化英语复习工具，配合孩子的英语课程，家长自建专属复习内容库',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <script src="/js/letter-audio-player.js" async></script>
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>{children}</body>
    </html>
  )
} 