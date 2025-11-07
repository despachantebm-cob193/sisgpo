import Dexie, { Table } from 'dexie';
import { Viatura, Obm, Aeronave } from '../types/entities';

export interface Outbox {
  id?: number;
  method: 'POST' | 'PUT' | 'DELETE';
  url: string;
  body: any;
  timestamp: number;
}

export class MySubClassedDexie extends Dexie {
  viaturas!: Table<Viatura>;
  obms!: Table<Obm>;
  aeronaves!: Table<Aeronave>;
  outbox!: Table<Outbox>;

  constructor() {
    super('sisgpo');
    this.version(1).stores({
      viaturas: '++id, prefixo, obm',
      obms: '++id, nome, abreviatura',
      aeronaves: '++id, prefixo',
      outbox: '++id, timestamp',
    });
  }
}

export const db = new MySubClassedDexie();
