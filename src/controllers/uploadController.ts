import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import AppError from '../utils/AppError';
import crypto from 'crypto';

const uploadController = {
    uploadPhoto: async (req: Request, res: Response) => {
        try {
            if (!req.files || Object.keys(req.files).length === 0) {
                throw new AppError('Nenhum arquivo foi enviado.', 400);
            }

            const file = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;

            if (!file) {
                throw new AppError('Arquivo inválido.', 400);
            }

            // Validar tipo de arquivo
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                throw new AppError('Apenas imagens (JPG, PNG, WEBP) são permitidas.', 400);
            }

            const fileExtension = file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExtension}`;
            const filePath = `militares/${fileName}`;

            // Upload para Supabase Storage
            const { data, error } = await supabaseAdmin
                .storage
                .from('fotos-militares')
                .upload(filePath, file.data, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (error) {
                console.error('Erro Supabase Storage:', error);
                throw new AppError('Erro ao salvar a imagem no armazenamento.', 500);
            }

            // Gerar URL pública
            const { data: publicUrlData } = supabaseAdmin
                .storage
                .from('fotos-militares')
                .getPublicUrl(filePath);

            return res.status(200).json({
                url: publicUrlData.publicUrl,
                path: filePath
            });

        } catch (error: any) {
            console.error('Erro no upload de foto:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(error.message || 'Erro interno ao processar upload.', 500);
        }
    }
};

export default uploadController;
