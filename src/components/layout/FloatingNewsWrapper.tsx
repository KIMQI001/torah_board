'use client';

import { NewsFloatingWidget } from "@/components/spot/NewsFloatingWidget";

export const FloatingNewsWrapper = () => {
  return (
    <NewsFloatingWidget 
      refreshInterval={30000}
      maxItems={3}
      onNewsClick={(news) => {
        console.log('News clicked:', news);
        if (news.link) {
          window.open(news.link, '_blank');
        }
      }}
    />
  );
};