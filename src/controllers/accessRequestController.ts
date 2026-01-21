import { Request, Response } from 'express';
import crypto from 'crypto';
import AppError from '../utils/AppError';
import nodemailer from 'nodemailer';
import UserRepository from '../repositories/UserRepository';

type PendingCode = {
  code: string;
  expiresAt: number;
  attempts: number;
};

type VerifiedToken = {
  email: string;
  expiresAt: number;
};

// Armazenamento simples em memória para prototipação
const codeStore = new Map<string, PendingCode>(); // chave: email
const tokenStore = new Map<string, VerifiedToken>(); // chave: token

const CODE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutos
const MAX_ATTEMPTS = 5;

const generateCode = () => {
  return String(crypto.randomInt(0, 999999)).padStart(6, '0');
};

const generateToken = () => crypto.randomUUID();

const sendEmailCode = async (to: string, code: string) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!host || !port || !user || !pass || !from) {
    console.warn('[AccessRequest] SMTP não configurado. Código:', code, 'Destino:', to);
    throw new AppError('Servidor de e-mail não configurado. Defina SMTP_HOST/PORT/USER/PASS/FROM.', 500);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to,
    subject: 'Código de verificação - SISGPO',
    text: `Seu código de verificação é: ${code}`,
    html: `<p>Seu código de verificação é: <strong>${code}</strong></p><p>Ele expira em ${CODE_TTL_MS / 60000} minutos.</p>`,
  });
};

export const accessRequestController = {
  sendCode: async (req: Request, res: Response) => {
    const { email } = req.body as { email?: string };

    if (!email) {
      throw new AppError('E-mail é obrigatório.', 400);
    }

    const emailLower = email.trim().toLowerCase();
    if (!emailLower.endsWith('@gmail.com')) {
      throw new AppError('Use um e-mail @gmail.com para receber o código.', 400);
    }

    // Gera e armazena o código
    const code = generateCode();
    codeStore.set(emailLower, { code, expiresAt: Date.now() + CODE_TTL_MS, attempts: 0 });

    await sendEmailCode(emailLower, code);

    return res.status(200).json({
      message: 'Código enviado para o e-mail informado.',
      expiresInSeconds: CODE_TTL_MS / 1000,
    });
  },

  verifyCode: async (req: Request, res: Response) => {
    const { email, code } = req.body as { email?: string; code?: string };
    if (!email || !code) {
      throw new AppError('E-mail e código são obrigatórios.', 400);
    }

    const emailLower = email.trim().toLowerCase();

    const stored = codeStore.get(emailLower);
    if (!stored) {
      throw new AppError('Código não encontrado ou expirado.', 400);
    }

    if (stored.expiresAt < Date.now()) {
      codeStore.delete(emailLower);
      throw new AppError('Código expirado. Solicite um novo.', 400);
    }

    if (stored.attempts >= MAX_ATTEMPTS) {
      codeStore.delete(emailLower);
      throw new AppError('Limite de tentativas excedido. Solicite um novo código.', 429);
    }

    stored.attempts += 1;
    if (stored.code !== code) {
      throw new AppError('Código inválido.', 400);
    }

    // Código OK: gera token de verificação
    const token = generateToken();
    tokenStore.set(token, { email: emailLower, expiresAt: Date.now() + TOKEN_TTL_MS });
    // Após verificar, remove o código para evitar reuso
    codeStore.delete(emailLower);

    return res.status(200).json({
      message: 'E-mail verificado com sucesso.',
      verificationToken: token,
      expiresInSeconds: TOKEN_TTL_MS / 1000,
    });
  },

  submitRequest: async (req: Request, res: Response) => {
    const { fullName, email, login, whatsapp, obmCity } = req.body as {
      fullName?: string;
      email?: string;
      login?: string;
      whatsapp?: string;
      obmCity?: string;
    };

    if (!fullName || !email || !login || !whatsapp || !obmCity) {
      throw new AppError('Dados incompletos.', 400);
    }

    const emailLower = email.trim().toLowerCase();
    const loginTrimmed = login.trim();

    // Verifica se ja existe usuario com este email ou login
    const existingEmail = await UserRepository.findByEmail(emailLower);
    if (existingEmail) {
      throw new AppError('Este e-mail já possui uma solicitação ou cadastro.', 400);
    }

    const existingLogin = await UserRepository.findByLogin(loginTrimmed);
    if (existingLogin) {
      throw new AppError('Este login/nome já está em uso.', 400);
    }

    // Persiste na tabela usuarios com status 'pending'
    await UserRepository.create({
      login: loginTrimmed,
      nome_completo: fullName.trim(),
      email: emailLower,
      whatsapp: whatsapp.trim(),
      unidade: obmCity.trim(),
      status: 'pending',
      ativo: false,
      perfil: 'user',
      // senha_hash tera o default da migration se nao passado, 
      // mas como o login sera via Google SSO, o login por senha nao sera prioritario
    });

    console.log('[AccessRequest] Nova solicitação registrada no banco:', { emailLower, loginTrimmed });

    return res.status(200).json({ message: 'Solicitação registrada com sucesso. Aguarde aprovação.' });
  },
};

export default accessRequestController;
