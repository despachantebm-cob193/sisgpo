import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabase';
import { CreateUserDTO, UpdateUserDTO } from '../validators/userValidator';

export type UserRow = {
    id: number;
    login: string;
    senha_hash?: string;
    perfil: string;
    ativo: boolean;
    status?: string;
    nome_completo?: string | null;
    nome?: string | null;
    email?: string | null;
    perfil_desejado?: string | null;
    aprovado_por?: number | null;
    aprovado_em?: Date | string | null;
    created_at?: Date;
    updated_at?: Date;
    supabase_id?: string | null;
    unidade?: string | null;
    whatsapp?: string | null;
};

export class UserRepository {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = supabaseAdmin;
    }

    async findAll(): Promise<UserRow[]> {
        const { data, error } = await this.supabase
            .from('usuarios')
            .select('*')
            .order('login', { ascending: true });

        if (error) throw new Error(error.message);
        return data as UserRow[];
    }

    async findById(id: number): Promise<UserRow | null> {
        const { data, error } = await this.supabase
            .from('usuarios')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data as UserRow;
    }

    async findByLogin(login: string): Promise<UserRow | null> {
        const { data, error } = await this.supabase
            .from('usuarios')
            .select('*')
            .ilike('login', login)
            .single();

        if (error) return null;
        return data as UserRow;
    }

    async findByEmail(email: string): Promise<UserRow | null> {
        const { data, error } = await this.supabase
            .from('usuarios')
            .select('*')
            .ilike('email', email)
            .single();

        if (error) return null;
        return data as UserRow;
    }

    async findPending(): Promise<UserRow[]> {
        const { data, error } = await this.supabase
            .from('usuarios')
            .select('*')
            .eq('status', 'pending');

        if (error) throw new Error(error.message);
        return data as UserRow[];
    }

    async create(data: Partial<UserRow>): Promise<UserRow> {
        const payload = {
            ...data,
            created_at: new Date(),
            updated_at: new Date(),
        };
        const { data: created, error } = await this.supabase
            .from('usuarios')
            .insert(payload)
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar usuario: ${error.message}`);
        return created as UserRow;
    }

    async update(id: number, data: Partial<UserRow>): Promise<UserRow> {
        const payload = { ...data, updated_at: new Date() };
        const { data: updated, error } = await this.supabase
            .from('usuarios')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Erro ao atualizar usuario: ${error.message}`);
        return updated as UserRow;
    }

    async delete(id: number): Promise<boolean> {
        const { error } = await this.supabase
            .from('usuarios')
            .delete()
            .eq('id', id);

        if (error) return false;
        return true;
    }

    async exists(field: 'login' | 'email', value: string, excludeId?: number): Promise<boolean> {
        if (!value) return false;
        let query = this.supabase
            .from('usuarios')
            .select('id')
            .ilike(field, value);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query.single();
        // Se achou, data não é null. Se não achou, data é null ou error PgrstResultError (Row not found)
        return !!data;
    }
}

export default new UserRepository();
