# Roteiro de Testes por Fase — Fillmore v2 (Redesign Motorista)

- **Branch de teste:** `feat/redesign-motorista-v2` *(separada por commits de cada fase; **não** foi feito merge na `main`)*
- **Back-end:** `https://fillmore-back-end-express.vercel.app`
- **Conta de Motorista pronta para teste:**
  - **E-mail:** `dona.olga@fillmore.app`
  - **Senha:** `olga1234`
- **Contas de Responsável (para testar o bloqueio de login de responsável na Fase 1):**
  - **E-mail:** `carlos.silva@fillmore.app` | **Senha:** `resp1234`
  - **E-mail:** `mariana.costa@fillmore.app` | **Senha:** `resp1234`

---

## Como rodar no celular para testar

```powershell
git checkout feat/redesign-motorista-v2
npx expo start -c
```

---

## Histórico de Commits por Fase na Branch `feat/redesign-motorista-v2`

1. **FASE 0 (`aa06e92`)** — `feat: fase 0 - fundacao de robustez (query client, validadores, formatadores, constantes, error boundary)`
2. **FASE 1 (`1a07093`)** — `feat: fase 1 - navegacao exclusiva para motorista com 4 abas e limpeza de perfil responsavel`
3. **FASE 2 (`8823416`)** — `feat: fase 2 - cadastro de motorista em 2 etapas com login automatico e card de onboarding`
4. **FASE 3 (`49278fc`)** — `feat: fase 3 - aba hoje com checklist de embarque, ausencia e avisos via whatsapp`
5. **FASE 4 (`1aea3f9`)** — `feat: fase 4 - detalhes de rota e aluno, duplicacao de turno e formularios em etapas`
6. **FASE 5 (`c7270d6`)** — `feat: fase 5 - financeiro com geracao de faturas em lote, cobranca whatsapp e perfil`
7. **FASE 6** — `chore: fase 6 - auditoria final de usabilidade e roteiro de testes por fase`

---

## O que testar em cada Fase

### FASE 0 — Fundação de Robustez
1. **Troca de conta sem vazamento de cache:**
   - Faça login com `dona.olga@fillmore.app` (`olga1234`), navegue pelas abas **Hoje**, **Rotas**, **Alunos** e **Financeiro**.
   - Abra o **Perfil** (ícone no canto superior direito) → **Sair da conta**.
   - Crie ou entre em outra conta de motorista e verifique que **nenhuma** rota, aluno ou mensalidade da Dona Olga aparece na nova sessão.
2. **Fuso horário local (`hojeLocal()`):**
   - Mesmo usando o aplicativo à noite (após 21h00 no horário de Brasília/Recife, quando UTC já virou o dia seguinte), a data exibida na aba **Hoje** e no **Trajeto** permanece no dia local correto.
3. **Paleta de status das mensalidades:**
   - Na aba **Financeiro** ou no **Detalhe do Aluno**, confirme que:
     - `PAGO` aparece em **verde** (`#166534` sobre `#DCFCE7`) com ícone `check-circle`.
     - `PENDENTE` aparece em **âmbar/laranja escuro** (`#9A3412` sobre `#FFEDD5`) com ícone `clock-outline` (diferente do amarelo do botão principal).
     - `ATRASADO` aparece em **vermelho** (`#991B1B` sobre `#FEE2E2`) com ícone `alert-circle`.
4. **Componente de erro (`ErrorState`):**
   - Ative o modo avião e puxe para atualizar em qualquer lista: deve surgir uma mensagem em português simples com botão **"Tentar novamente"**.

---

### FASE 1 — App Exclusivo para Motorista e 4 Abas
1. **Bloqueio de login para conta `RESPONSAVEL`:**
   - Na tela de Login, tente entrar com `carlos.silva@fillmore.app` e senha `resp1234`.
   - **Resultado esperado:** O app bloqueia o acesso, não salva sessão e exibe o aviso: *"Este app é para motoristas. Os avisos e cobranças são enviados aos pais diretamente pelo WhatsApp."*
2. **Login de Motorista e 4 Abas:**
   - Faça login com `dona.olga@fillmore.app` (`olga1234`).
   - **Resultado esperado:** Redirecionamento direto para a aba **Hoje** (`/(tabs)/hoje`) e barra inferior com exatamente **4 abas**: **Hoje**, **Rotas**, **Alunos** e **Financeiro** (a antiga aba *Operação* foi removida).
3. **Acesso ao Perfil e Sobre:**
   - Toque no ícone de perfil no canto superior direito de qualquer aba → abre **Meu Perfil**.
   - Toque em **Sobre o Projeto** → verifique os **4 integrantes** (*João, Maria, Rodrigo e Sammuel*), sem menção a Edmundo e sem URL técnica da API no rodapé.

---

### FASE 2 — Cadastro de Motorista em 2 Etapas e Onboarding
1. **Wizard de Cadastro em 2 Etapas (`/(auth)/signup`):**
   - Na tela de login, toque em **Criar conta de motorista**.
   - Verifique que **não** existe seletor *Motorista vs Responsável*.
   - **Etapa 1 (Seus dados):** tente avançar com e-mail inválido, telefone incompleto ou senha menor que 6 caracteres e veja os erros inline abaixo de cada campo e a máscara `(81) 9xxxx-xxxx`. Preencha dados válidos e toque em **Continuar**.
   - **Etapa 2 (Sua van e Pix):** toque em **Voltar** e confirme que os dados da Etapa 1 continuam preenchidos. Avance novamente, teste a validação de Placa (`ABC-1234` ou Mercosul `ABC1D23`), Capacidade (`1..60`), CNH (`11 dígitos`) e Chave Pix.
   - Toque em **Criar conta e entrar** (botão amarelo `52 dp` com texto escuro `#0F172A`): o cadastro deve fazer **login automático** e abrir a aba **Hoje**.
2. **Card de Onboarding na aba Hoje:**
   - Em uma conta recém-criada (sem rotas/alunos), veja o card **"Primeiros passos da sua van"** com os 3 passos (*1. Cadastrar primeira rota*, *2. Cadastrar primeiro aluno*, *3. Vincular aluno à rota*).
   - Na conta da Dona Olga (que já possui rotas e alunos vinculados), confirme que o card de onboarding **some automaticamente**.

---

### FASE 3 — Aba Hoje (Checklist de Embarque, Ausência e WhatsApp)
1. **Seletor de Turno e Resumo do Dia:**
   - Na aba **Hoje**, alterne entre **Manhã** e **Tarde**.
   - Verifique o card **"Rota de hoje"** com nome da rota, resumo **"X de Y embarcaram"**, **"Z não vão hoje"** e o botão primário **"Iniciar trajeto"** (`52 dp`).
   - Se houver mensalidades vencidas, toque no alerta **"N mensalidade(s) em atraso"** e confirme que ele leva direto para a aba **Financeiro**.
2. **Check-in de Embarque em 1 toque + Desfazer:**
   - No checklist de alunos da rota, toque em **"Embarcou"**: o botão muda imediatamente para **"Embarcado (HH:MM)"** em verde e o contador no topo sobe.
   - Toque em **"Desfazer"** no Snackbar (ou toque novamente no botão verde) para reverter.
3. **Aviso "Van chegando" via WhatsApp:**
   - Toque em **"Van chegando"** em um aluno: o app registra a notificação na API e abre o WhatsApp (`wa.me`) com a mensagem pré-preenchida para o responsável.
4. **Marcar "Não vai hoje" + Reativar:**
   - Toque no menu `⋮` do card do aluno → **"Não vai hoje"** → informe um motivo opcional e confirme.
   - O aluno fica acinzentado na lista com a tag **"Ausente hoje"** e botão **"Reativar"** (além da opção **"Desfazer"** no Snackbar).

---

### FASE 4 — Rotas e Alunos (Detalhes, Duplicar Turno e Wizards)
1. **Lista e Detalhe da Rota (`/(tabs)/rotas` e `/(tabs)/rotas/detalhe`):**
   - Na aba **Rotas**, filtre por **Todas**, **Manhã** ou **Tarde** e veja a lotação (`ocupadas/capacidade`) em cada card.
   - Toque em um card para abrir o **Detalhe da Rota**.
   - Teste os botões **"Ver trajeto"**, **"Gerenciar alunos"**, **"Editar"** e **"Duplicar para o turno da Tarde/Manhã"** (deve criar a rota do turno oposto e abrir a tela de edição).
2. **Formulário de Rota em 3 Etapas (`/(tabs)/rotas/form`):**
   - Toque em **+ Nova Rota** e percorra as 3 etapas com barra de progresso: **(1) Nome e Turno** → **(2) Pontos Inicial e Final** (testando os chips de bairros de Recife) → **(3) Revisão e "Salvar rota"**.
3. **Lista e Detalhe do Aluno (`/(tabs)/alunos` e `/(tabs)/alunos/detalhe`):**
   - Na aba **Alunos**, teste a busca e o filtro **"Sem rota"**.
   - Toque em um aluno para abrir o **Detalhe do Aluno**: confira dados escolares, endereços de embarque/desembarque, botões **"WhatsApp"** e **"Ligar"** do responsável, mensalidades do aluno e o botão **"Vincular a uma rota"** (que mostra a ocupação `ocupadas/capacidade` antes de confirmar e bloqueia vínculo se a van estiver lotada).
4. **Formulário de Aluno em 4 Etapas + Novo Responsável Inline (`/(tabs)/alunos/form`):**
   - Toque em **+ Novo Aluno**:
     - **Etapa 1:** Nome e Escola.
     - **Etapa 2:** Selecione um responsável existente **ou** toque em **"Cadastrar novo responsável"** (cadastre nome + WhatsApp no modal sem sair do formulário e veja-o ser selecionado automaticamente) + escolha a Modalidade.
     - **Etapa 3:** Endereço de embarque e desembarque (teste o switch *"Mesmo endereço para ida e volta"*).
     - **Etapa 4:** Dia de vencimento (`1..31`), revisão completa e **"Salvar aluno"**.

---

### FASE 5 — Financeiro (Lote, Cobrança WhatsApp/Pix, Desfazer) e Perfil
1. **Resumo Financeiro e Filtros (`/(tabs)/financeiro`):**
   - Confira o card no topo com os totais em `R$` de **Recebido**, **Pendente** e **Atrasado**, além do botão **"Copiar Pix"**.
   - Filtre por **Todas**, **Pendentes**, **Atrasadas** e **Pagas**, e também pelos chips de alunos.
2. **Registrar Pagamento com "Desfazer":**
   - Em uma fatura pendente ou atrasada, toque em **"Registrar pagamento"**.
   - Veja o status mudar para **PAGO** e o Snackbar exibir a ação **"Desfazer"** (toque em *Desfazer* para confirmar que a fatura volta para `PENDENTE`).
3. **Cobrar com Notificação + WhatsApp Pix:**
   - Em uma fatura em aberto, toque em **"Cobrar"**: o app dispara a cobrança na API e abre o WhatsApp do responsável com o valor, data de vencimento e a **chave Pix do motorista** pré-preenchidos.
4. **Gerar Faturas do Mês em Lote:**
   - Toque em **"Gerar faturas do mês"** no card superior.
   - Informe o mês/ano (ex.: `12/2026`) e o valor padrão (podendo ajustar o valor individualmente por aluno na lista).
   - Confirme e acompanhe a barra de progresso criar as faturas apenas para os alunos que ainda não tinham lançamento naquele mês/ano.
   - Abra **"Gerar faturas do mês"** novamente para o mesmo mês/ano e verifique que o app informa que todos os alunos já possuem fatura (evitando duplicatas).
5. **Perfil do Motorista (`/(tabs)/perfil`):**
   - Confira as seções **Dados Pessoais** e **Dados da Van e Pix**.
   - Toque em **Editar perfil e dados da van**, altere telefone/placa/capacidade/Pix com validação e salve.
   - Verifique os diálogos de confirmação de **Sair da conta** e **Excluir minha conta** (que cita o nome do motorista).

---

### FASE 6 — Auditoria Final de Usabilidade e Qualidade (Tabela Tela × Item)

| Tela / Módulo | 1. Sem `toISOString` p/ hoje | 2. Constantes centralizadas | 3. Validadores e máscaras | 4. Botão `#F59E0B` texto `#0F172A` 52dp | 5. `PENDENTE` `#9A3412`/`#FFEDD5` | 6. Áreas >= 48dp / máx 3 ações | 7. Ações c/ confirmação ou Desfazer | 8. `FlatList` + `EmptyState` | 9. `ErrorState` c/ retry | 10. Sem arquivos/logs mortos |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `src/app/(auth)/login.js` | OK | OK | OK | OK | N/A | OK | OK | N/A | OK | OK |
| `src/app/(auth)/signup.js` | OK | OK | OK | OK | N/A | OK | OK | N/A | OK | OK |
| `src/app/(tabs)/hoje.js` | OK (`hojeLocal`) | OK (`TURNOS`) | OK | OK | N/A | OK | OK (`Desfazer`) | OK (`FlatList`) | OK (`ErrorState`) | OK |
| `src/app/(tabs)/rotas/index.js` | OK | OK (`TURNOS`) | OK | OK | N/A | OK | OK | OK (`FlatList`) | OK (`ErrorState`) | OK |
| `src/app/(tabs)/rotas/detalhe.js` | OK | OK (`TURNOS`) | OK | OK | N/A | OK | OK (`Dialog`) | OK | OK (`ErrorState`) | OK |
| `src/app/(tabs)/rotas/form.js` | OK | OK (`TURNOS`) | OK | OK | N/A | OK | OK | N/A | OK | OK |
| `src/app/(tabs)/rotas/trajeto.js` | OK (`hojeLocal`) | OK | OK | OK | N/A | OK | OK | OK | OK (`ErrorState`) | OK |
| `src/app/(tabs)/alunos/index.js` | OK | OK (`MODALIDADES`) | OK | OK | N/A | OK | OK | OK (`FlatList`) | OK (`ErrorState`) | OK |
| `src/app/(tabs)/alunos/detalhe.js` | OK | OK (`STATUS_MENSALIDADE`) | OK | OK | OK | OK | OK (`Desfazer` / `Dialog`) | OK | OK (`ErrorState`) | OK |
| `src/app/(tabs)/alunos/form.js` | OK | OK (`MODALIDADES`) | OK | OK | N/A | OK | OK | N/A | OK | OK |
| `src/app/(tabs)/alunos/lotacao.js` | OK | OK | OK | OK | N/A | OK | OK (`Dialog`) | OK (`FlatList`) | OK | OK |
| `src/app/(tabs)/financeiro/index.js` | OK (`hojeLocal`) | OK (`STATUS_MENSALIDADE`) | OK | OK | OK | OK | OK (`Desfazer` / `Dialog`) | OK (`FlatList`) | OK (`ErrorState`) | OK |
| `src/app/(tabs)/perfil/index.js` | OK | OK | OK | OK | N/A | OK | OK (`Dialog` c/ nome) | N/A | OK | OK |
| `src/app/(tabs)/sobre.js` | OK | OK | N/A | N/A | N/A | OK | N/A | N/A | N/A | OK |
