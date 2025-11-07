import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Table } from 'dexie';
import api from '../services/api';
import { useEffect } from 'react';

export function useOfflineCRUD<T extends { id?: number, synced?: boolean }>(
  tableName: 'viaturas' | 'obms' | 'aeronaves'
) {
  const table = db[tableName] as Table<T>;

  const getAll = () => {
    return useLiveQuery(() => table.toArray(), []);
  };

  const sync = async () => {
    if (navigator.onLine) {
      try {
        const response = await api.get(`/api/admin/${tableName}`);
        const serverData = response.data.data;
        await table.clear();
        await table.bulkAdd(serverData.map((item: T) => ({ ...item, synced: true })));
      } catch (error) {
        console.error('Failed to sync data from server', error);
      }
    }
  };

  useEffect(() => {
    sync();
    window.addEventListener('online', syncOutbox);
    return () => {
      window.removeEventListener('online', syncOutbox);
    };
  }, []);

  const add = async (item: T) => {
    if (navigator.onLine) {
      try {
        const response = await api.post(`/api/admin/${tableName}`, item);
        await table.add({ ...response.data, synced: true });
      } catch (error) {
        console.error('API call failed, adding to outbox', error);
        const tempId = Date.now();
        await table.add({ ...item, id: tempId, synced: false });
        await addToOutbox('POST', `/api/admin/${tableName}`, { ...item, tempId });
      }
    } else {
      console.log('Offline, adding to outbox');
      const tempId = Date.now();
      await table.add({ ...item, id: tempId, synced: false });
      await addToOutbox('POST', `/api/admin/${tableName}`, { ...item, tempId });
    }
  };

  const update = async (id: number, item: T) => {
    if (navigator.onLine) {
      try {
        await api.put(`/api/admin/${tableName}/${id}`, item);
        await table.update(id, { ...item, synced: true });
      } catch (error) {
        console.error('API call failed, adding to outbox', error);
        await table.update(id, { ...item, synced: false });
        await addToOutbox('PUT', `/api/admin/${tableName}/${id}`, item);
      }
    } else {
      console.log('Offline, adding to outbox');
      await table.update(id, { ...item, synced: false });
      await addToOutbox('PUT', `/api/admin/${tableName}/${id}`, item);
    }
  };

  const remove = async (id: number) => {
    if (navigator.onLine) {
      try {
        await api.delete(`/api/admin/${tableName}/${id}`);
        await table.delete(id);
      } catch (error) {
        console.error('API call failed, adding to outbox', error);
        await addToOutbox('DELETE', `/api/admin/${tableName}/${id}`, { id });
      }
    } else {
      console.log('Offline, adding to outbox');
      await addToOutbox('DELETE', `/api/admin/${tableName}/${id}`, { id });
      await table.delete(id);
    }
  };

  const addToOutbox = async (method: 'POST' | 'PUT' | 'DELETE', url: string, body: any) => {
    await db.outbox.add({
      method,
      url,
      body,
      timestamp: Date.now(),
    });
  };

  const syncOutbox = async () => {
    const outboxItems = await db.outbox.toArray();
    for (const item of outboxItems) {
      try {
        if (item.method === 'POST') {
          const response = await api.post(item.url, item.body);
          // Update the local item with the new ID from the server
          await table.where({ id: item.body.tempId }).modify({ id: response.data.id, synced: true });
        } else if (item.method === 'PUT') {
          await api.put(item.url, item.body);
          await table.where({ id: item.body.id }).modify({ synced: true });
        } else if (item.method === 'DELETE') {
          await api.delete(item.url);
        }
        await db.outbox.delete(item.id!);
      } catch (error) {
        console.error('Failed to sync outbox item', item, error);
      }
    }
  };

  return { getAll, add, update, remove, sync };
}
