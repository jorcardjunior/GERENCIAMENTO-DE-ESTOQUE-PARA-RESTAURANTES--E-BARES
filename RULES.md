```markdown
# 🎯 ELITE AI ENGINEERING RULES
## Sistema de Diretrizes para Desenvolvimento de SaaS & Websites de Classe Mundial
- --
- ## 📋 ÍNDICE
1. [Filosofia de Desenvolvimento](#filosofia)
2. [Fluxo de Decisão Interativo](#fluxo-decisao)
3. [Stack Tecnológico](#stack)
4. [Arquitetura & Padrões](#arquitetura)
5. [Processo de Implementação](#processo)
6. [Qualidade & Testes](#qualidade)
7. [Segurança & Performance](#seguranca)
8. [UX/UI Premium](#uxui)
9. [Deployement & DevOps](#deployment)
10. [Checklist de Entrega](#checklist)
- --
- ## 🎭 FILOSOFIA DE DESENVOLVIMENTO {#filosofia}
- ### Princípios Fundamentais
- **Excelência sem Compromissos**: Cada linha de código deve ter propósito
- **Arquitetura Defensiva**: Pensar em falhas antes de implementar
- **Design Centrado em Conversão**: UI = Negócio, não apenas estética
- **Performance First**: Cada milissegundo importa
- **Segurança por Default**: Nunca confiar em entrada do usuário
- **Escalabilidade Estrutural**: Código que cresce sem quebrar
- **Documentação Viva**: Código que se documenta sozinho
- ### Mindset Obrigatório
```
❌ "Vai funcionar assim"
✅ "Por que vai funcionar? Testei em qual cenário? E se falhar?"
- ❌ "Fazer rápido"
✅ "Fazer certo, fazer rápido, fazer sustentável"
- ❌ "Copiar padrão"
✅ "Entender padrão, adaptar contexto, validar resultado"
```
- --
- ## 🤖 FLUXO DE DECISÃO INTERATIVO {#fluxo-decisao}
- ### ANTES DE QUALQUER IMPLEMENTAÇÃO, A IA DEVE FAZER:
- #### 1️⃣ DESCOBERTA PROFUNDA
- ```
┌─────────────────────────────────────────┐
│ FASE 1: ENTENDER O PROJETO              │
├─────────────────────────────────────────┤
│ ❓ Qual é o objetivo principal?         │
│ ❓ Quem são os usuários finais?         │
│ ❓ Qual é a métrica de sucesso?         │
│ ❓ Qual é o timeline?                   │
│ ❓ Orçamento: Grátis ou Investimento?   │
│ ❓ Escala esperada: MVP ou Escala?      │
│ ❓ Necessidades de Integração?          │
└─────────────────────────────────────────┘
```
- #### 2️⃣ RECOMENDAÇÕES BASEADAS EM RESPOSTAS
- **Exemplo de Fluxo Real:**
- ```
IA: "Você vai usar serviços GRATUITOS ou está disposto a investir?"
- OPÇÃO A: Totalmente Gratuito
├─ Frontend: Next.js (Vercel Free) ✅
├─ Backend: Supabase (Tier Free) ✅
├─ Database: PostgreSQL (Supabase) ✅
├─ Auth: Supabase Auth (Free) ✅
├─ Hosting: Vercel Free ✅
└─ Storage: Supabase Storage (Free) ✅
- OPÇÃO B: Investimento Mínimo ($20-50/mês)
├─ Frontend: Next.js (Vercel Pro) ⭐
├─ Backend: Supabase (Pro) ⭐
├─ Database: Neon (Paid) ⭐
├─ Auth: NextAuth.js + Supabase ⭐
├─ Hosting: Vercel Pro ⭐
└─ Storage: S3 AWS (Pay-as-you-go) ⭐
- OPÇÃO C: Enterprise Ready (Escalável)
├─ Frontend: Next.js (Vercel Enterprise) 🔥
├─ Backend: Supabase + Custom APIs 🔥
├─ Database: Neon + Redis Cache 🔥
├─ Auth: NextAuth.js + OAuth 🔥
├─ Hosting: Vercel + CDN Global 🔥
└─ Monitoramento: Sentry + DataDog 🔥
```
- --
- ## 💻 STACK TECNOLÓGICO {#stack}
- ### FRONTEND - MÚLTIPLAS OPÇÕES
- #### 🎯 Recomendação Principal (2025+)
```
Next.js 15+ ⭐⭐⭐⭐⭐
├─ App Router (não Pages)
├─ Server Components (padrão)
├─ Server Actions (manipulação de formulário)
├─ Incremental Static Regeneration (cache inteligente)
└─ API Routes apenas quando necessário
```
- #### 🔄 Alternativas Viáveis
```
1. React + Vite (Mais controle, menos abstrações)
2. Remix (Melhor para forms complexos)
3. SvelteKit (Performance extrema)
4. Astro (Conteúdo estático + Islands)
```
- #### 💅 Styling - Avaliação Prévia
- ```
IA PERGUNTA: "Qual é sua prioridade?"
- A) Desenvolvimento Mais Rápido Possível
   └─ Tailwind CSS + shadcn/ui ✅
- B) Customização Visual Extrema
   └─ CSS Modules + Tailwind CSS ✅
- C) Design System Próprio
   └─ CSS-in-JS (Styled Components) ✅
- D) Máxima Performance
   └─ Tailwind CSS + PostCSS otimizado ✅
```
- #### 🎬 Animações & Interatividade
- ```
Opção A: Animações Simples
└─ CSS Animations + Tailwind
- Opção B: Transições Suaves (Recomendada)
└─ Framer Motion ⭐⭐⭐⭐⭐
- Opção C: 3D & Complexas
└─ Three.js + React Three Fiber
- Opção D: Máxima Performance
└─ React Spring (hooks-based)
```
- ### BACKEND - ESCOLHA ESTRATÉGICA
- ```
IA PERGUNTA: "Qual tipo de aplicação?"
- A) MVP Rápido (Startup)
   ├─ Supabase (Gratuito + Escalável)
   ├─ Firebase (Alternativa)
   └─ PlanetScale (MySQL serverless)
- B) SaaS Profissional
   ├─ Supabase Pro ⭐⭐⭐⭐⭐
   ├─ Neon (PostgreSQL)
   └─ Railway (Deploy integrado)
- C) Aplicação Complexa
   ├─ Supabase + Custom APIs
   ├─ Node.js + Express
   └─ Python + FastAPI
- D) Enterprise
   ├─ Supabase Enterprise
   ├─ Database Próprio (PostgreSQL)
   └─ Infraestrutura dedicada
```
- ### DATABASE - DECISÃO CRÍTICA
- ```
IA PERGUNTA: "Prioridade?"
- 📊 RELACIONAL (SQL)
│
├─ Supabase ⭐⭐⭐⭐⭐ (Recomendado)
│  └─ PostgreSQL + RLS + Auth integrada
│
├─ Neon
│  └─ PostgreSQL serverless, grátis até 3GB
│
├─ PlanetScale
│  └─ MySQL serverless, foco em escalabilidade
│
└─ Firebase (NoSQL)
   └─ Realtime Database, melhor para app mobile
- 🚀 PERFORMANCE
│
├─ Redis (Cache)
│  └─ Upstash (Gratuito + Serverless)
│
└─ Elasticsearch
   └─ Buscas complexas
- 📍 GEOLOCALIZAÇÃO
│
└─ PostGIS (PostgreSQL Extension)
```
- --
- ## 🏗️ ARQUITETURA & PADRÕES {#arquitetura}
- ### ESTRUTURA DE PASTAS - PADRÃO OURO
- ```
projeto-saas/
│
├── 📁 app/                          # Next.js App Router
│   ├── (auth)/                      # Layout compartilhado auth
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/                 # Layout dashboard
│   │   ├── dashboard/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   │
│   ├── api/                         # API Routes (apenas se necessário)
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── webhooks/stripe/route.ts
│   │
│   ├── layout.tsx                   # Layout global
│   ├── page.tsx                     # Home
│   └── globals.css                  # Estilos globais
│
├── 📁 components/                   # Componentes Reutilizáveis
│   ├── ui/                          # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── modal.tsx
│   │
│   ├── sections/                    # Seções de página
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   └── pricing.tsx
│   │
│   ├── layout/                      # Componentes de layout
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   │
│   ├── forms/                       # Formulários complexos
│   │   ├── login-form.tsx
│   │   └── payment-form.tsx
│   │
│   └── common/                      # Componentes comuns
│       ├── loading.tsx
│       ├── error.tsx
│       └── empty-state.tsx
│
├── 📁 lib/                          # Utilitários e funções
│   ├── supabase/                    # Cliente Supabase
│   │   ├── client.ts
│   │   └── server.ts
│   │
│   ├── utils/                       # Funções utilitárias
│   │   ├── cn.ts                    # classNames merger
│   │   ├── format.ts
│   │   └── validators.ts
│   │
│   ├── constants/                   # Constantes
│   │   ├── config.ts
│   │   └── routes.ts
│   │
│   └── auth/                        # Lógica de autenticação
│       ├── session.ts
│       └── permissions.ts
│
├── 📁 hooks/                        # React Hooks customizados
│   ├── use-auth.ts
│   ├── use-fetch.ts
│   ├── use-form.ts
│   └── use-pagination.ts
│
├── 📁 types/                        # TypeScript types
│   ├── database.ts                  # Types do banco
│   ├── api.ts                       # Types de API
│   └── common.ts                    # Types comuns
│
├── 📁 services/                     # Lógica de negócio
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── payment.service.ts
│   └── email.service.ts
│
├── 📁 database/                     # Migrations & Seeds
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
│
├── 📁 public/                       # Arquivos estáticos
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── 📁 docs/                        # Documentação do projeto
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── USAGE.md
│
└── README.md                       # Documentação principal do projeto
```
- --
- ## ✔️ CHECKLIST DE ENTREGA {#checklist}
- ### ANTES DO LANÇAMENTO:
- [ ] Revisão de Código Completa
- [ ] Testes Automatizados (100% cobertura)
- [ ] Documentação Atualizada
- [ ] Auditoria de Segurança
- [ ] Performance Testada (GTmetrix, Lighthouse)
- [ ] Feedback de Usuário Incorporado
- [ ] Backup Completo da Base de Dados
```

