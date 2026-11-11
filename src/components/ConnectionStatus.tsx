import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { WifiOff } from 'lucide-react';

export default function ConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (error && error.message.includes('fetch')) {
          setStatus('offline');
        } else {
          setStatus('online');
        }
      } catch {
        setStatus('offline');
      }
    }

    checkConnection();
  }, []);

  // Clean UI principle: Don't clutter the interface when everything is working smoothly
  if (status !== 'offline') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-amber-200 bg-amber-50 text-amber-800 shadow-md text-xs font-medium">
        <WifiOff className="w-3.5 h-3.5 text-amber-600" />
        <span>Working offline • Reconnecting to care database</span>
      </div>
    </div>
  );
}
