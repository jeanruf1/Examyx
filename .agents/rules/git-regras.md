---
trigger: model_decision
description: Padroniza o fluxo de versionamento seguindo Gitflow, garantindo organização de branches, consistência nos commits (pt-BR/inglês) e clareza no ciclo de desenvolvimento (features, fixes, releases e hotfixes).
---

# Git Flow Rules

## 🌱 Branching Strategy

Seguimos o padrão Gitflow com as seguintes branches:

- `main`: código em produção
- `develop`: integração contínua de features
- `feature/*`: novas funcionalidades
- `fix/*`: correções de bugs (não críticos)
- `hotfix/*`: correções urgentes em produção
- `release/*`: preparação para release

---

## 🚀 Criação de Branches

### Features
Sempre criar a partir da `develop`:

feature/nome-da-feature


Exemplo:

feature/login-com-google


---

### Fixes (bugs não críticos)
Criar a partir da `develop`:

fix/correcao-do-bug


Exemplo:

fix/erro-validacao-email


---

### Hotfix (produção)
Criar a partir da `main`:

hotfix/correcao-urgente


---

### Release
Criar a partir da `develop`:

release/v1.0.0


---

## 💬 Padrão de Commits

Os commits devem ser claros, curtos e podem ser em **PT-BR E em Inglês**, mas sempre consistentes e nas duas linguas.

### Estrutura:

tipo: descrição


### Tipos permitidos:
- `feat`: nova funcionalidade
- `fix`: correção de bug
- `chore`: tarefas internas
- `refactor`: refatoração sem mudança funcional
- `docs`: documentação
- `test`: testes

---

### Exemplos (PT-BR):

feat: adiciona login com Google
fix: corrige erro na validação de email
refactor: melhora lógica de autenticação


### Exemplos (EN):

feat: add Google login
fix: fix email validation bug
refactor: improve authentication logic


---

## 🔁 Fluxo de Merge

- `feature/*` → `develop`
- `fix/*` → `develop`
- `release/*` → `main` + `develop`
- `hotfix/*` → `main` + `develop`

---

## ⚠️ Boas Práticas

- Sempre abrir Pull Request (PR)
- Nunca commitar direto na `main`
- Manter commits pequenos e objetivos
- Atualizar a branch com `develop` antes do merge
- Nomear branches de forma descritiva

---

## ✅ Regra geral

Sempre que iniciar qualquer desenvolvimento:
- Criar uma `feature/*` para novas funcionalidades
- Criar uma `fix/*` para correções
- Nunca trabalhar diretamente em `develop` ou `main`