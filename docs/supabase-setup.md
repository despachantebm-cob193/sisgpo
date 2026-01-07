# Setup do Supabase para SISGPO

Este documento descreve os passos para configurar o ambiente Supabase para o projeto SISGPO.

## 1. Credenciais do Projeto

**Projeto Criado:** `sisgpo-supabase`
**URL do Projeto:** `https://dwfamqoyvhbfxlupcnuh.supabase.co`
**Região:** `sa-east-1` (São Paulo)

### Chaves de Acesso (API Keys)

Você precisará das seguintes chaves para configurar o ambiente. Como a `SERVICE_ROLE_KEY` é sensível, ela não é retornada automaticamente e você deve pegá-la no dashboard.

1.  Acesse o Dashboard do Supabase: [https://supabase.com/dashboard/project/dwfamqoyvhbfxlupcnuh](https://supabase.com/dashboard/project/dwfamqoyvhbfxlupcnuh)
2.  Vá em **Project Settings** (ícone de engrenagem) -> **API**.
3.  Copie os valores:
    *   `Project URL` (já temos: `https://dwfamqoyvhbfxlupcnuh.supabase.co`)
    *   `anon` public key (já temos, veja abaixo)
    *   `service_role` secret key (**VOCÊ PRECISA COPIAR ESTA**)

**Chaves Recuperadas Automaticamente:**

*   **URL:** `https://dwfamqoyvhbfxlupcnuh.supabase.co`
*   **ANON KEY:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3ZmFtcW95dmhiZnhsdXBjbnVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NTMxOTYsImV4cCI6MjA4MzMyOTE5Nn0.dZs_pWs7aJ27ezHFWIdhLBPudkH7zr2lbiiWdh1Ec3I`

## 2. Configuração de Variáveis de Ambiente

### Backend (`sisgpo/.env`)

Adicione/Atualize as seguintes linhas no seu arquivo `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://dwfamqoyvhbfxlupcnuh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3ZmFtcW95dmhiZnhsdXBjbnVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NTMxOTYsImV4cCI6MjA4MzMyOTE5Nn0.dZs_pWs7aJ27ezHFWIdhLBPudkH7zr2lbiiWdh1Ec3I
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY_AQUI
```

### Frontend (`sisgpo-frontend/.env.local`)

Crie ou edite o arquivo `.env.local` no diretório do frontend:

```env
VITE_SUPABASE_URL=https://dwfamqoyvhbfxlupcnuh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3ZmFtcW95dmhiZnhsdXBjbnVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NTMxOTYsImV4cCI6MjA4MzMyOTE5Nn0.dZs_pWs7aJ27ezHFWIdhLBPudkH7zr2lbiiWdh1Ec3I
```

## 3. Próximos Passos

Após configurar as variáveis:
1.  Execute as migrações de banco de dados (Fase 2).
2.  O backend começará a usar o Supabase como banco de dados.
