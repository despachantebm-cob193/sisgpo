#!/bin/bash

# --- SCRIPT DE SINCRONIZAÇÃO DE BANCO DE DADOS (VERSÃO SIMPLIFICADA) ---
# Descrição: Baixa o banco de dados da nuvem (Render) e o restaura no ambiente local.
# ATENÇÃO: Esta versão tenta limpar o banco de dados existente em vez de recriá-lo.

# --- CONFIGURAÇÕES - PREENCHA COM SUAS CREDENCIAIS ---

# 1. Credenciais do Banco de Dados de PRODUÇÃO (Render)
PROD_USER="sisgpo_db_user"
PROD_HOST="dpg-d2o8cs3ipnbc73becvg0-a.oregon-postgres.render.com"
PROD_PORT="5432"
PROD_DB="sisgpo_db"

# 2. Credenciais do Banco de Dados LOCAL (seu computador)
LOCAL_USER="postgres"
LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_DB="sisgpo_db"

# 3. Nome do arquivo de backup
BACKUP_FILE="producao_backup.dump"

# --- FIM DAS CONFIGURAÇÕES ---


# --- INÍCIO DO SCRIPT ---

# Define cores para os logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sem Cor

echo -e "${GREEN}Iniciando o script de sincronização...${NC}"
echo "-------------------------------------------"

# ETAPA 1: Exportar o banco de dados de PRODUÇÃO (pg_dump)
echo -e "${YELLOW}ETAPA 1: Exportando o banco de produção (${PROD_DB})...${NC}"

# Pede a senha da produção de forma segura
export PGPASSWORD=$(read -sp "Digite a senha do banco de PRODUÇÃO e pressione Enter: " val && echo "$val")
echo # Adiciona uma nova linha após a inserção da senha

# Executa o pg_dump
pg_dump -h "$PROD_HOST" -p "$PROD_PORT" -U "$PROD_USER" -d "$PROD_DB" -F c -b -v -f "$BACKUP_FILE"

# Verifica se o pg_dump foi bem-sucedido
if [ $? -ne 0 ]; then
    echo -e "\n${RED}ERRO: A exportação (pg_dump) falhou. Verifique a senha ou a conexão com a produção.${NC}"
    unset PGPASSWORD
    exit 1
fi

echo -e "\n${GREEN}Exportação concluída com sucesso! Arquivo '${BACKUP_FILE}' criado.${NC}"
echo "-------------------------------------------"

# ETAPA 2: Restaurar no banco de dados LOCAL (pg_restore)
echo -e "${YELLOW}ETAPA 2: Restaurando para o banco local (${LOCAL_DB})...${NC}"
echo -e "${YELLOW}AVISO: O conteúdo do banco '${LOCAL_DB}' será substituído!${NC}"

# Pede a senha local de forma segura
export PGPASSWORD=$(read -sp "Digite a senha do banco LOCAL e pressione Enter: " val && echo "$val")
echo

# Executa o pg_restore com a flag --clean para tentar limpar o banco antes de restaurar.
# Esta é a lógica do script original "caipirao".
pg_restore --verbose --clean --no-acl --no-owner -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -d "$LOCAL_DB" "$BACKUP_FILE"

# Verifica se o pg_restore foi bem-sucedido
if [ $? -ne 0 ]; then
    echo -e "\n${RED}ERRO: A restauração (pg_restore) falhou. Verifique a senha ou o nome do banco local.${NC}"
    unset PGPASSWORD
    rm -f "$BACKUP_FILE" # Remove o backup em caso de falha
    exit 1
fi

# Limpeza final
unset PGPASSWORD
rm "$BACKUP_FILE" # Remove o arquivo de backup temporário após o sucesso

echo -e "\n${GREEN}SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!${NC}"
echo "O banco de dados local '${LOCAL_DB}' foi atualizado."
