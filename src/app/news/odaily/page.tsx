"use client"

export default function OdailyPage() {
  return (
    <div className="h-screen w-full">
      <iframe 
        src="https://www.odaily.news/zh-CN"
        className="w-full h-full border-0"
        title="Odaily星球日报"
        frameBorder="0"
        allowFullScreen
      />
    </div>
  )
}