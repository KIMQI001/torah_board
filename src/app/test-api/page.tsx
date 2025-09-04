'use client';

import { useEffect, useState } from 'react';
import { daoApi } from '@/lib/api';

export default function TestApiPage() {
  const [status, setStatus] = useState('Loading...');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function testApi() {
      setStatus('Testing announcement API...');
      try {
        console.log('🚀 Starting API test...');
        
        // 测试直接fetch
        const directUrl = 'http://localhost:3002/api/v1/spot/announcements';
        console.log('📡 Direct fetch from:', directUrl);
        
        const directResponse = await fetch(directUrl);
        const directData = await directResponse.json();
        console.log('✅ Direct fetch result:', directData);
        
        // 测试通过daoApi
        console.log('🔔 Testing through daoApi...');
        const apiData = await daoApi.getAnnouncements();
        console.log('✅ daoApi result:', apiData);
        
        setStatus('Success!');
        setData({
          direct: directData,
          api: apiData
        });
      } catch (err) {
        console.error('❌ Test failed:', err);
        setStatus('Failed!');
        setError(err);
      }
    }
    
    testApi();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>API Test Page</h1>
      <p>Status: {status}</p>
      {error && (
        <div style={{ color: 'red' }}>
          <h2>Error:</h2>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
      {data && (
        <div>
          <h2>Direct Fetch:</h2>
          <pre>{JSON.stringify(data.direct, null, 2).substring(0, 500)}...</pre>
          <h2>API Call:</h2>
          <pre>{JSON.stringify(data.api, null, 2).substring(0, 500)}...</pre>
        </div>
      )}
    </div>
  );
}