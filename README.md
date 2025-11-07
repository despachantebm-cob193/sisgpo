# sisgpo-api
API RESTful para o Sistema de Gestão do Poder Operacional (SISGPO) do CBMGO.

## Criar usuário administrador

Caso precise recriar o usuário administrador padrão execute:

```bash
node createAdminUser.js
```

Variáveis disponíveis para personalização (opcionais):

- `ADMIN_LOGIN`
- `ADMIN_PASSWORD`
- `ADMIN_EMAIL`
- `ADMIN_FULL_NAME`
- `ADMIN_NOME`
- `ADMIN_PERFIL`

Por padrão o script cria o login `admin` com a senha `cbmgo@2025`.
