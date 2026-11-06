# 🚌 Fillmore Mobile — Gestão de Transporte Escolar Informal (Recife/PE)

> **Disciplina:** Programação Web e Mobile / Aplicações Orientadas a Serviços (2026.2) — **UNICAP**  
> **Etapa 2:** Aplicativo Mobile em **React Native + Expo Router + Zustand + Axios + TanStack Query + React Native Paper** consumindo a API REST em Express 5 + PostgreSQL (NeonDB/Vercel).

---

## 👥 Integrantes da Equipe (5 Membros)

| Ordem (Etapa 2) | Nome Completo | RA | Módulo / Responsabilidade no App Mobile |
| :---: | :--- | :--- | :--- |
| **1º (Kick-off)** | **Sammuel** | `[PREENCHER_RA]` | Setup da Arquitetura Base (Expo Router, Zustand, Axios, TanStack Query, Paper), Telas Obrigatórias (`Home` e `Sobre`) e **CRUD Completo de Rotas Escolares (`Rota`)** |
| **2º** | **Samuel** | `[PREENCHER_RA]` | Autenticação Completa (`Login`, `Sign Up` Multi-perfil `MOTORISTA`/`RESPONSAVEL` com dados da Van e Pix, `Logout` com revogação de token) e **Gestão de Perfil (`Usuario`)** |
| **3º** | **Joao** | `[PREENCHER_RA]` | **CRUD Completo de Alunos (`Aluno`)** com guarda compartilhada e **Relacionamento 1 (`Rota ↔ Alunos`)** com validação de lotação máxima da van |
| **4º** | **Paulo** | `[PREENCHER_RA]` | **Módulo Financeiro (`Mensalidade`)**, **Relacionamento 2 (`Aluno ↔ Mensalidades`)**, Extrato de Inadimplência do Responsável + Cópia de Chave Pix e Cobrança em 1 Clique |
| **5º** | **Edmundo** | `[PREENCHER_RA]` | **Operação Diária**: Check-list Diário de Embarque (`Presenca`), Cancelamento de Viagens (`ViagemDiaria`) e Central de Avisos/Notificações (`Notificacao`) |

---

## 🛠️ Stack Tecnológica e Requisitos Atendidos

- **Framework & Navegação:** React Native + **Expo (SDK 58)** + **Expo Router** (file-based routing em `src/app/`).
- **Gerenciamento de Estado Global:** **Zustand** (`src/store/useAuthStore.js` com persistência automática em `AsyncStorage` e `src/store/useAppStore.js` para filtros globais de turno e feedbacks).
- **Cliente HTTP & Cache Assíncrono:** **Axios** (`src/api/client.js` com interceptors de `Authorization: Bearer <token>` e tratamento de erros 401/403/409/429) + **TanStack Query (React Query v5)** (`useQuery`, `useMutation` e `invalidateQueries`).
- **UI Kit:** **React Native Paper (Material Design 3)** + `@expo/vector-icons` com paleta personalizada de Transporte Escolar (`#F59E0B` Amarelo Escolar e `#1E293B` Azul Corporativo).

---

## 🚀 Como Executar o Projeto no Celular Físico (Expo Go)

> ⚠️ **Atenção para a Apresentação:** O professor exige demonstração em **celular físico** (emuladores não são permitidos).

### 1. Instalar as dependências
```bash
npm install
```

### 2. Configurar a variável de ambiente (`.env`)
Crie um arquivo `.env` na raiz do projeto (copiando de `.env.example`) apontando para o Back-end publicado na Vercel:

```bash
cp .env.example .env
```

Edite o `.env`:
```env
EXPO_PUBLIC_API_URL=https://sua-api-na-vercel.vercel.app
```
*(Importante: após criar ou editar o arquivo `.env`, sempre inicie o Expo com `npx expo start -c` para que o Metro Bundler recarregue a variável `EXPO_PUBLIC_API_URL`).*

### 3. Iniciar o servidor Expo
```bash
npx expo start
```
Caso a rede Wi-Fi da faculdade/sala de aula bloqueie conexões locais entre notebook e celular, inicie com tunnel:
```bash
npx expo start --tunnel
```

4. Abra o aplicativo **Expo Go** no seu celular Android ou iOS e escaneie o QR Code exibido no terminal.

---

## 📂 Estrutura de Pastas (`src/`)

```text
Fillmore-App/
├─ README.md                     -> Instruções de execução e identificação da equipe
├─ .env.example                  -> Exemplo de configuração da URL da API (Vercel)
├─ package.json
├─ app.json
└─ src/
   ├─ api/
   │   ├─ client.js              -> Instância Axios com Interceptors (Bearer Token + tratamento de erros)
   │   ├─ rotasApi.js            -> (Sammuel - PRONTO) CRUD de /rotas
   │   ├─ authApi.js             -> (Samuel) Login, SignUp, Logout e Perfil (/session e /users)
   │   ├─ alunosApi.js           -> (Joao) CRUD de /alunos e Relacionamento 1 (/rotas/:id/alunos)
   │   ├─ mensalidadesApi.js     -> (Paulo) Relacionamento 2 (/alunos/:id/mensalidades) e Pix
   │   └─ operacaoApi.js         -> (Edmundo) Presenças, Viagens e Notificacoes
   ├─ store/
   │   ├─ useAuthStore.js        -> Zustand Store persistida no AsyncStorage (user, token, customApiUrl)
   │   └─ useAppStore.js         -> Zustand Store para filtro global de turno (MANHA/TARDE) e Snackbar
   ├─ hooks/
   │   └─ useRotas.js            -> (Sammuel - PRONTO) Hooks TanStack Query (useRotasQuery + Mutations)
   ├─ theme/
   │   └─ index.js               -> Tema MD3 customizado do React Native Paper (cores Fillmore)
   ├─ components/
   │   ├─ RotaCard.js            -> (Sammuel - PRONTO) Card de rota escolar com barra de lotação da van
   │   └─ EmptyState.js          -> Componente reutilizável para listas vazias
   └─ app/                       -> File-based Routing (Expo Router)
      ├─ _layout.js              -> Root Layout (QueryClientProvider, PaperProvider, Auth Guard, Snackbar)
      ├─ (auth)/
      │   ├─ _layout.js
      │   ├─ login.js            -> Login funcional + Modo Dev/Quick Token (para Samuel expandir)
      │   └─ signup.js           -> Cadastro Multi-perfil estruturado (para Samuel finalizar)
      └─ (tabs)/
         ├─ _layout.js           -> Navegação Bottom Tabs (Início, Rotas, Alunos, Financeiro, Operação, Sobre)
         ├─ index.js             -> (Sammuel - PRONTO) Tela HOME com KPIs, filtro global e atalhos
         ├─ sobre.js             -> (Sammuel - PRONTO) Tela SOBRE com contexto de Recife, stack e equipe
         ├─ rotas/
         │   ├─ _layout.js
         │   ├─ index.js         -> (Sammuel - PRONTO) Lista de Rotas + busca + filtro + exclusão
         │   └─ form.js          -> (Sammuel - PRONTO) Criar/Editar Rota + presets geográficos de Recife
         ├─ alunos/
         │   └─ index.js         -> Placeholder guiado para Joao
         ├─ financeiro/
         │   └─ index.js         -> Placeholder guiado para Paulo
         └─ operacao/
             └─ index.js         -> Placeholder guiado para Edmundo
```
