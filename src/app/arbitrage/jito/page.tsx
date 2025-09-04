"use client"

export default function JitoPage() {
  return (
    <div className="w-full h-[calc(100vh-140px)] rounded-lg overflow-hidden border">
      <iframe
        src="https://explorer.jito.wtf/"
        className="w-full h-full"
        frameBorder="0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}