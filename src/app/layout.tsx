import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Austin English - 双语英语学习',
  description: '专为中国学生设计的双语英语学习平台',
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
      <body className={inter.className}>{children}</body>
    </html>
  )
} 