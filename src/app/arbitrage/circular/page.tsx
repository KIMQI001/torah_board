"use client"

export default function CircularPage() {
  return (
    <div className="w-full h-[calc(100vh-140px)] rounded-lg overflow-hidden border">
      <iframe
        src="https://circular.fi/address/77777T2qnynHFsA63FyfY766ciBTXizavU1f5HeZXwN"
        className="w-full h-full"
        frameBorder="0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}