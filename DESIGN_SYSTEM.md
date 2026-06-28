# Design System - World Cup Bets

Este documento descreve o design system do projeto, incluindo tokens de design, componentes, animações e padrões visuais.

## Tema e Identidade Visual

O projeto utiliza um tema inspirado na Copa do Mundo com duas variantes:

- **Dark Mode** (padrão): Fundo escuro com acentos em dourado e verde
- **Light Mode**: Fundo claro mantendo a identidade de cores

### Paleta de Cores

#### Cores Principais

| Token | Dark Mode | Light Mode | Uso |
|-------|-----------|------------|-----|
| `--primary` | `hsl(45, 93%, 47%)` | `hsl(45, 93%, 42%)` | Dourado/Troféu - CTAs, destaques |
| `--secondary` | `hsl(142, 70%, 35%)` | `hsl(142, 70%, 35%)` | Verde Campo - Elementos secundários |
| `--accent` | `hsl(199, 89%, 48%)` | `hsl(199, 89%, 48%)` | Azul Elétrico - Links, badges |
| `--destructive` | `hsl(0, 84%, 60%)` | `hsl(0, 84%, 60%)` | Vermelho - Erros, logout |

#### Cores de Superfície

| Token | Dark Mode | Light Mode | Uso |
|-------|-----------|------------|-----|
| `--background` | `hsl(222, 47%, 6%)` | `hsl(60, 9%, 98%)` | Fundo da página |
| `--card` | `hsl(222, 47%, 9%)` | `hsl(0, 0%, 100%)` | Cards, containers |
| `--muted` | `hsl(222, 30%, 15%)` | `hsl(210, 40%, 96%)` | Elementos desabilitados |
| `--border` | `hsl(222, 30%, 18%)` | `hsl(214, 32%, 91%)` | Bordas |

#### Cores Semânticas

| Token | Valor | Uso |
|-------|-------|-----|
| `--success` | `hsl(142, 70%, 45%)` | Sucesso, confirmações |
| `--warning` | `hsl(38, 92%, 50%)` | Alertas, pendências |
| `--destructive` | `hsl(0, 84%, 60%)` | Erros, ações destrutivas |

### Gradientes

```css
/* Gradiente Dourado - CTAs premium */
--gradient-gold: linear-gradient(135deg, hsl(45, 93%, 47%) 0%, hsl(38, 92%, 50%) 100%);

/* Gradiente Verde Campo */
--gradient-field: linear-gradient(135deg, hsl(142, 70%, 35%) 0%, hsl(142, 70%, 25%) 100%);

/* Gradiente Card */
--gradient-card: linear-gradient(180deg, hsl(222, 47%, 11%) 0%, hsl(222, 47%, 8%) 100%);

/* Gradiente Hero */
--gradient-hero: linear-gradient(180deg, hsl(222, 47%, 6%) 0%, hsl(222, 47%, 10%) 50%, hsl(222, 47%, 6%) 100%);
```

### Sombras

```css
/* Sombra Dourada - Destaque em CTAs */
--shadow-gold: 0 4px 20px -4px hsl(45 93% 47% / 0.3);

/* Sombra de Card */
--shadow-card: 0 4px 20px -4px hsl(0 0% 0% / 0.4);

/* Brilho - Efeito glow */
--shadow-glow: 0 0 40px hsl(45 93% 47% / 0.15);
```

## Tipografia

### Fontes

| Fonte | Uso | Pesos |
|-------|-----|-------|
| **Outfit** | Corpo do texto | 300, 400, 500, 600, 700, 800 |
| **Space Grotesk** | Títulos (h1-h6) | 400, 500, 600, 700 |
| **Bebas Neue** | Display, números grandes | 400 |

### Hierarquia de Texto

```css
/* Títulos */
h1 { font-family: 'Space Grotesk'; font-weight: bold; letter-spacing: tight; }
h2 { font-family: 'Space Grotesk'; font-weight: bold; }
h3-h6 { font-family: 'Space Grotesk'; font-weight: bold; }

/* Corpo */
body { font-family: 'Outfit'; }
```

### Classes de Texto

| Classe | Tamanho | Uso |
|--------|---------|-----|
| `text-xs` | 12px | Legendas, badges |
| `text-sm` | 14px | Texto secundário |
| `text-base` | 16px | Corpo padrão |
| `text-lg` | 18px | Destaque |
| `text-xl` | 20px | Subtítulos |
| `text-2xl+` | 24px+ | Títulos |

## Componentes UI (shadcn/ui)

### Componentes Disponíveis

```
src/shared/components/ui/
├── alert-dialog.tsx    # Diálogos de confirmação
├── badge.tsx           # Badges e tags
├── button.tsx          # Botões (variants: default, secondary, ghost, etc.)
├── card.tsx            # Cards container
├── dialog.tsx          # Modais
├── input.tsx           # Campos de entrada
├── label.tsx           # Labels de formulário
├── separator.tsx       # Separadores visuais
├── sheet.tsx           # Painéis laterais
├── skeleton.tsx        # Loading placeholders
├── sonner.tsx          # Toast notifications (Sonner)
├── tabs.tsx            # Navegação em abas
├── toast.tsx           # Toasts
├── toaster.tsx         # Container de toasts
├── toggle.tsx          # Toggle buttons
└── tooltip.tsx         # Tooltips
```

### Variantes de Botão

```tsx
<Button variant="default">  // Primário (dourado)
<Button variant="secondary"> // Verde campo
<Button variant="ghost">     // Transparente
<Button variant="outline">   // Com borda
<Button variant="destructive"> // Vermelho (logout, excluir)
```

### Variantes de Badge

```tsx
<Badge variant="default">    // Primário
<Badge variant="secondary">  // Secundário
<Badge variant="outline">    // Com borda
<Badge variant="destructive"> // Destrutivo
```

## Componentes de Layout

```
src/shared/components/layout/
├── DesktopSidebar.tsx   # Sidebar fixa (desktop)
├── BottomNav.tsx        # Navegação inferior (mobile)
├── Header.tsx           # Cabeçalho com título e ações
├── PageContainer.tsx    # Container de página
└── index.ts             # Exports
```

### Estrutura de Página

```tsx
export default function Page() {
  return (
    <>
      <DesktopSidebar />
      <Header
        title="Título"
        icon={<Icon />}
        rightAction={<Button />}
      />
      <PageContainer>
        {/* Conteúdo */}
      </PageContainer>
      <BottomNav />
    </>
  );
}
```

## Animações

### Keyframes Disponíveis

```css
/* Float - Movimento suave para cima/baixo */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Slide Up - Entrada de baixo para cima */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Fade In - Aparecimento suave */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Shimmer - Skeleton loading */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Classes Utilitárias

```css
.animate-float       /* Flutuação contínua (6s) */
.animate-pulse-slow  /* Pulsação lenta (3s) */
.animate-slide-up    /* Entrada slide up (0.5s) */
.animate-fade-in     /* Fade in (0.3s) */
```

### Skeleton Loading

O projeto inclui componentes de skeleton com animação shimmer dourada:

```tsx
import { Skeleton, SkeletonCircle, SkeletonText } from '@/shared/components/ui/skeleton';

<Skeleton className="h-10 w-full" />        // Bloco retangular
<SkeletonCircle className="w-24 h-24" />    // Avatar circular
<SkeletonText className="h-4 w-32" />       // Linha de texto
```

#### Acessibilidade

```tsx
// Container com ARIA para screen readers
<div role="status" aria-busy="true" aria-label="Carregando...">
  <Skeleton />
</div>
```

#### Suporte a Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer {
    animation: none;
    background: hsl(var(--muted) / 0.6);
  }
}
```

## Classes Utilitárias Customizadas

### Glass Effect

```css
.glass-card {
  @apply bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl;
}
```

### Gradientes de Texto

```css
.text-gradient-gold {
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Backgrounds

```css
.gradient-gold   /* Fundo dourado */
.gradient-field  /* Fundo verde campo */
.gradient-card   /* Fundo de card com gradiente */
.bg-gradient-radial /* Gradiente radial */
```

### Sombras

```css
.shadow-gold  /* Sombra dourada para CTAs */
.shadow-glow  /* Efeito glow */
```

## Responsividade

### Breakpoints (Tailwind)

| Breakpoint | Tamanho | Uso |
|------------|---------|-----|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Desktop grande |
| `2xl` | 1536px | Monitores grandes |

### Padrões Responsivos

```tsx
// Mobile: bottom nav, Desktop: sidebar
<div className="lg:hidden">  {/* Mobile only */}
<div className="hidden lg:flex">  {/* Desktop only */}

// Padding responsivo
<div className="px-4 md:px-6 lg:px-8">

// Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## Scrollbar Customizada

```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: hsl(var(--muted));
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.5);
  border-radius: 3px;
}
```

## Boas Práticas

### 1. Uso de Cores

```tsx
// Correto - usar variáveis CSS
<div className="bg-background text-foreground" />
<div className="bg-card border-border" />
<div className="text-primary" />

// Evitar - cores hardcoded
<div className="bg-[#1a1a1a]" /> // Não fazer
```

### 2. Espaçamento

```tsx
// Usar escala do Tailwind
<div className="p-4 mb-6 gap-2" />

// Classes de espaçamento comuns
space-y-2   // Gap vertical entre filhos
space-x-4   // Gap horizontal entre filhos
gap-4       // Grid/flex gap
```

### 3. Bordas e Raios

```tsx
// Usar --radius
<div className="rounded-xl" />  // 0.75rem
<div className="rounded-lg" />  // 0.5rem
<div className="rounded-md" />  // 0.375rem
```

### 4. Acessibilidade

```tsx
// Sempre incluir em elementos interativos
<button aria-label="Fechar modal">
  <X className="w-4 h-4" />
</button>

// Loading states
<div role="status" aria-busy="true">
  <Skeleton />
</div>

// Focus visible
<button className="focus-visible:ring-2 focus-visible:ring-ring">
```

## Temas

### Alternância de Tema

O projeto usa `next-themes` para gerenciamento:

```tsx
import { useTheme } from '@/shared/components/ui/theme-switcher';

const { theme, setTheme } = useTheme();

// Toggle
setTheme(theme === 'dark' ? 'light' : 'dark');
```

### CSS Variables por Tema

As variáveis são definidas em `:root` (dark) e `.light`:

```css
:root {
  /* Dark theme variables */
}

.light {
  /* Light theme overrides */
}
```

## Ícones

Usamos [Lucide React](https://lucide.dev) para ícones:

```tsx
import { User, Home, Trophy, Settings, LogOut } from 'lucide-react';

<User className="w-5 h-5" />
<Home className="w-5 h-5 text-muted-foreground" />
```

### Tamanhos Padrão

| Tamanho | Uso |
|---------|-----|
| `w-4 h-4` | Em botões, inputs |
| `w-5 h-5` | Header, nav |
| `w-6 h-6` | Cards, destaques |
| `w-8 h-8+` | Ilustrações, hero |
