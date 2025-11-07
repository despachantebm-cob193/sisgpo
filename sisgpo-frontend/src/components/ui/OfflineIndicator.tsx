import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import Button from './Button';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const outboxItems = useLiveQuery(() => db.outbox.toArray(), []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    // This is a placeholder for the actual sync logic
    console.log('Syncing...');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOnline && (
        <div className="rounded-md bg-yellow-500 p-4 text-white">
          <p>Você está offline. As alterações serão salvas localmente.</p>
        </div>
      )}
      {outboxItems && outboxItems.length > 0 && (
        <div className="mt-2 flex items-center justify-between rounded-md bg-blue-500 p-4 text-white">
          <p>{outboxItems.length} item(s) pendentes de sincronização.</p>
          <Button onClick={handleSync} variant="secondary">
            Sincronizar
          </Button>
        </div>
      )}
    </div>
  );
}
