# PRD — JairoBet

## 1. Visão geral

**JairoBet** é uma aplicação **pessoal** para organizar e acompanhar a operação financeira do Jairo. Não é um sistema financeiro corporativo, contábil ou de compliance — é uma ferramenta de **controle manual** para saber onde está o dinheiro e qual é o resultado da operação.

A operação movimenta recursos entre três tipos de conta:

- **Contas bancárias** (bancos, contas digitais, carteiras de pagamento);
- **Contas em corretoras e carteiras de cripto** (BRL, stablecoins, BTC e outras moedas);
- **Contas em casas de apostas** (depósitos, saques, cashback, bônus).

Também existem **valores em trânsito** (saque pendente, Pix em análise, transferência blockchain aguardando confirmação).

### O que o sistema deve responder

- Quanto dinheiro existe na operação e **onde** está;
- Quanto está em cada **conta bancária**, **corretora/carteira** ou **casa de apostas**;
- Quanto pertence a cada **titular** (pessoa vinculada à conta);
- Quanto foi aportado, retirado, recebido em cashback/bônus e gasto em taxas;
- Qual é o resultado líquido estimado;
- O que ainda está pendente ou em trânsito.

### O que o sistema **não** faz

- Não realiza apostas nem automatiza estratégias;
- Não recomenda operações;
- Não conecta-se automaticamente a bancos, corretoras ou casas de apostas (no MVP);
- Não armazena senhas, chaves privadas, seeds ou credenciais de terceiros.

> Uso de casas de apostas apenas por pessoas legalmente autorizadas e dentro das regras aplicáveis.

### Natureza do produto

- **Lançamentos manuais** — todos os dados são informados pelo operador;
- **Erros são esperados** — deve ser fácil **editar** e **excluir** lançamentos incorretos;
- **Sem rigor contábil** — não há exigência de logs imutáveis, trilha de auditoria corporativa ou bloqueio de exclusão;
- **Pragmático** — prioriza clareza e velocidade de uso no dia a dia.

---

## 2. Problema

Os recursos circulam por rotas variadas:

1. Banco → Corretora → Casa de apostas;
2. Casa de apostas → Corretora → Banco;
3. Banco → Casa de apostas (direto);
4. Casa de apostas → Banco (direto);
5. Corretora → Corretora;
6. Banco → Banco.

Além disso, a operação usa **contas de terceiros**: cada conta bancária, de cripto ou de casa de apostas pertence a uma pessoa (titular) diferente. Sem um lugar centralizado, fica difícil saber:

- Saldo total e saldo por titular;
- Se um valor ainda está em trânsito;
- O que foi transferência interna vs. lucro/prejuízo real;
- Quanto foi perdido em taxas e conversões;
- Cashback e bônus recebidos por plataforma;
- Se o que está no sistema bate com o saldo real da conta.

---

## 3. Objetivo do produto

Oferecer um painel simples para **registrar, corrigir e acompanhar** movimentações financeiras da operação.

O sistema deve diferenciar:

- Capital aportado (entrada externa na operação);
- Retirada pessoal (saída externa);
- Transferência entre contas da operação;
- Cashback;
- Bônus;
- Taxas e custos de conversão;
- Ajuste manual de saldo;
- Valores em trânsito.

### Regra principal

> Transferir dinheiro entre contas da operação **não** representa lucro nem prejuízo.

---

## 4. Usuários do sistema

Há dois conceitos distintos:

### 4.1 Operador (login do sistema)

Pessoa que acessa o JairoBet — inicialmente apenas o Jairo.

Pode:

- Cadastrar titulares;
- Cadastrar contas (banco, corretora/carteira, casa de apostas);
- Lançar, editar e excluir movimentações;
- Informar saldos e fazer conciliação;
- Consultar dashboard e relatórios;
- Exportar dados;
- Configurar moedas e categorias.

### 4.2 Titular (usuário da operação)

Pessoa **de terceiros** cuja conta é gerenciada na operação. Não faz login no sistema — é um cadastro de referência.

Exemplos:

- Titular A — dono de uma conta Nubank e de uma conta na BetX;
- Titular B — dono de uma carteira Binance e de uma conta Inter;
- Titular C — dono de duas casas de apostas e um banco.

**Toda conta financeira deve estar vinculada a um titular.**

Campos sugeridos do titular:

- Nome ou apelido;
- Observações;
- Status (ativo / inativo).

### Filtros e visões por titular

O sistema deve permitir:

- Listar contas por titular;
- Filtrar movimentações por titular;
- Ver patrimônio e resultado consolidado ou **por titular**;
- Comparar desempenho entre titulares (opcional no MVP, desejável depois).

---

## 5. Tipos de conta

### 5.1 Conta bancária

Contas em bancos, fintechs ou carteiras de pagamento.

Exemplos: Nubank, Inter, Itaú, Mercado Pago.

Informações:

- Nome da conta;
- Titular (obrigatório);
- Instituição;
- Moeda principal;
- Saldo inicial e data;
- Saldo atual (calculado ou ajustado manualmente);
- Identificação mascarada (ex.: agência/conta parcial);
- Status (ativa, inativa, bloqueada, encerrada);
- Observações.

### 5.2 Corretora / carteira de cripto

Conta em exchange ou carteira on-chain usada na operação.

Pode ter **vários saldos** na mesma conta:

- BRL, USDT, USDC, BTC, ETH, etc.

Informações:

- Nome da corretora ou carteira;
- Titular (obrigatório);
- Moedas utilizadas;
- Rede preferencial (para transferências);
- Saldo por ativo;
- Status;
- Observações.

### 5.3 Casa de apostas

Conta em plataforma de apostas usada para depósito, saque, cashback e bônus.

Informações:

- Nome da casa de apostas;
- Titular (obrigatório);
- Identificação interna da conta (usuário, ID, apelido);
- Moeda utilizada;
- Formas de depósito e saque usadas na prática;
- Saldo disponível;
- Saldo pendente / em processamento;
- Status;
- Observações.

**Não armazenar:** senha, 2FA, cookies de sessão ou qualquer credencial de acesso.

### 5.4 Conta em trânsito (opcional / lógica)

Representação de valor que já saiu da origem mas ainda não chegou ao destino.

Exemplos: saque da casa de apostas em processamento, USDT enviado aguardando confirmação na rede, Pix em análise.

Pode ser:

- Uma conta dedicada do tipo "trânsito", ou
- Um **status** na transferência (mais simples no MVP).

---

## 6. Cadastro de contas

Cada conta possui:

| Campo | Obrigatório | Notas |
|-------|-------------|-------|
| Nome | Sim | Ex.: "Nubank Titular A" |
| Tipo | Sim | `bank` \| `crypto` \| `betting` \| `transit` |
| Titular | Sim | FK para titular |
| Instituição / plataforma | Sim | Nome do banco, corretora ou casa |
| Moeda padrão | Sim | Para exibição principal |
| Saldo inicial | Sim | Na criação |
| Data do saldo inicial | Sim | |
| Status | Sim | ativa / inativa / bloqueada / encerrada |
| Identificação mascarada | Não | Útil para diferenciar contas parecidas |
| Limite operacional | Não | Alerta visual se saldo ficar abaixo |
| Observações | Não | |

Contas de corretora/carteira podem ter **múltiplas moedas** com saldo separado por ativo.

Contas **encerradas** não recebem novos lançamentos (mas histórico permanece visível).

---

## 7. Movimentações financeiras

Todas as movimentações são **lançadas manualmente**. O operador pode **editar** ou **excluir** qualquer lançamento a qualquer momento (com confirmação simples).

### 7.1 Aporte de capital

Entrada de dinheiro externo na operação.

Exemplo: dinheiro pessoal → conta bancária da operação.

- Aumenta capital aportado;
- **Não** é lucro.

Campos: data, conta destino, valor, moeda, observação, comprovante (opcional).

### 7.2 Retirada de capital

Saída da operação para uso pessoal.

Exemplo: conta bancária → uso pessoal.

- Reduz capital na operação;
- **Não** é despesa.

### 7.3 Transferência entre contas

Movimentação entre contas da operação (podem ser de titulares diferentes — ainda assim é transferência interna no consolidado geral).

Campos:

- Conta origem e destino;
- Titular de cada conta (herdado do cadastro, exibido na tela);
- Valor enviado e moeda;
- Valor recebido e moeda (quando houver conversão);
- Taxa (opcional);
- Data de envio e recebimento;
- Status: agendada, enviada, em processamento, concluída, cancelada, falhou;
- Método (Pix, TED, rede TRC20, etc.);
- Identificador da transação (opcional, para evitar duplicata);
- Observação.

Efeito esperado:

1. Saída na origem;
2. Entrada no destino (ou em trânsito até confirmar recebimento).

### 7.4 Conversão de cripto / câmbio

Exemplo: R$ 1.000 → 190 USDT na corretora.

Campos: moedas, quantidades, cotação, taxa/spread, corretora, data.

O custo de taxa ou spread entra como despesa da operação.

### 7.5 Cashback

Registrado separado de transferência.

Campos: casa de apostas, titular, data, valor esperado/recebido, moeda, status (previsto, pendente, recebido, cancelado, etc.).

Só conta no resultado quando **efetivamente recebido**.

### 7.6 Bônus

Campos: casa de apostas, titular, tipo, valor informado, valor creditado, moeda, status, validade, observação.

Diferenciar bônus promocional (não retirável) de saldo retirável, quando fizer sentido.

### 7.7 Taxas

Taxa bancária, Pix, saque, depósito, rede blockchain, corretagem, spread, taxa da casa de apostas, outros.

Toda taxa **reduz** o resultado.

### 7.8 Ajuste de saldo

Quando o saldo no sistema não bate com o saldo real visto na instituição.

Campos: conta, moeda, diferença, motivo (texto livre), data, saldo anterior, novo saldo.

Ajustes podem ser editados ou excluídos como qualquer outro lançamento.

---

## 8. Fluxos suportados

| # | Fluxo | Etapas típicas |
|---|-------|----------------|
| 1 | Banco → Corretora → Casa de apostas | Transferência, conversão (se necessário), depósito na casa |
| 2 | Casa de apostas → Corretora → Banco | Saque, recebimento na corretora, conversão, transferência ao banco |
| 3 | Banco → Casa de apostas | Pix ou depósito direto |
| 4 | Casa de apostas → Banco | Saque direto |
| 5 | Corretora → Corretora | Envio de cripto/fiat entre exchanges |
| 6 | Banco → Banco | Transferência entre contas bancárias |

O sistema deve permitir registrar cada etapa separadamente ou agrupar em uma "rota" visual (evolução futura). No MVP, lançamentos individuais são suficientes.

---

## 9. Conciliação de saldo

Processo **manual e opcional**, para conferir se o sistema está alinhado com a realidade.

1. Sistema mostra saldo calculado;
2. Operador informa saldo visto na instituição;
3. Sistema mostra diferença;
4. Operador corrige lançamentos **ou** cria ajuste de saldo.

Registrar: conta, data, saldo calculado, saldo informado, diferença, observação.

Dashboard pode destacar contas sem conciliação recente (alerta visual, sem bloqueio).

---

## 10. Cálculo do resultado

Valores em moeda estrangeira ou cripto são convertidos para **BRL** usando cotação **informada manualmente** no momento do lançamento (ou cotação padrão do dia).

### 10.1 Patrimônio operacional

```text
Patrimônio =
  saldos bancários
+ saldos em corretoras/carteiras
+ saldos em casas de apostas
+ valores em trânsito
```

### 10.2 Capital líquido aportado

```text
Capital líquido = total de aportes − total de retiradas
```

### 10.3 Resultado acumulado

```text
Resultado = patrimônio atual − capital líquido aportado
```

### 10.4 ROI

```text
ROI = (resultado ÷ capital líquido aportado) × 100
```

(Quando capital líquido for zero, ROI não é exibido.)

### 10.5 Resultado por casa de apostas

```text
Resultado da casa =
  saldo final
− saldo inicial
− depósitos recebidos
+ saques realizados
+ cashback recebido
+ bônus creditados (retiráveis)
− taxas
```

Apresentar também totais de cashback, bônus, taxas e ajustes.

### 10.6 Resultado por titular

Mesma lógica do consolidado, filtrando contas e movimentações do titular.

---

## 11. Dashboard

Visão inicial consolidada, com opção de filtrar por titular.

### Indicadores principais

- Patrimônio total;
- Patrimônio por titular (resumo);
- Capital líquido aportado;
- Resultado acumulado;
- Resultado no mês;
- ROI;
- Cashback e bônus recebidos;
- Total em taxas;
- Valor em trânsito;
- Contas com possível divergência;
- Quantidade de contas ativas por tipo (banco / cripto / casa de apostas).

### Distribuição

Gráficos ou cards por:

- Tipo de conta;
- Titular;
- Instituição / casa de apostas / corretora;
- Moeda.

### Evolução no tempo

Gráfico com patrimônio, capital aportado e resultado — filtros: 7 dias, 30 dias, mês, ano, período customizado.

---

## 12. Tela de contas

Lista em cards ou tabela:

- Nome, tipo, titular, instituição;
- Saldo na moeda original e equivalente em BRL;
- Pendências / em trânsito;
- Última conciliação;
- Status.

Detalhe da conta:

- Saldo atual por moeda;
- Histórico de movimentações;
- Transferências pendentes;
- Conciliações anteriores;
- Ações: novo lançamento, conciliar, editar conta.

---

## 13. Tela de movimentações

Lista cronológica com filtros:

- Período;
- Titular;
- Conta;
- Tipo (aporte, transferência, taxa, cashback, etc.);
- Status;
- Moeda;
- Casa de apostas / banco / corretora.

Cada linha: data, descrição, origem → destino, titular(es), valor, moeda, BRL equivalente, status.

Ações: **editar**, **excluir** (com confirmação).

---

## 14. Tela de transferências

Fluxo simples:

1. Origem;
2. Destino;
3. Valor e moeda enviados;
4. Valor esperado no destino;
5. Taxas;
6. Método e status;
7. Confirmar recebimento depois (se ficou pendente).

Alertas visuais (não bloqueantes):

- Pendente há muito tempo;
- Valor recebido menor que o esperado;
- Saldo negativo na origem;
- Possível duplicata (mesmo identificador).

---

## 15. Relatórios e exportação

### Relatórios

- Resultado consolidado e por titular;
- Por casa de apostas;
- Por conta (banco / cripto / apostas);
- Transferências (concluídas, pendentes, canceladas).

### Exportação

- **MVP:** CSV;
- **Depois:** Excel, PDF.

---

## 16. Regras de negócio

1. Transferências entre contas da operação não alteram o lucro consolidado.
2. Aportes não são receita; retiradas pessoais não são despesa.
3. Taxas reduzem o resultado.
4. Cashback só entra no resultado quando recebido.
5. Bônus promocional e saldo retirável devem ser distinguíveis quando relevante.
6. Valores em trânsito não podem ser contados duas vezes (origem e destino ao mesmo tempo).
7. Toda conta deve ter um titular vinculado.
8. Lançamentos podem ser editados e excluídos pelo operador.
9. Saldo negativo gera alerta visual, mas não bloqueia o lançamento.
10. Contas encerradas não recebem novos lançamentos.
11. Moedas diferentes de BRL precisam de cotação para exibir equivalente (manual no MVP).
12. Duplicata por identificador de transação: alertar, não necessariamente bloquear.

---

## 17. Alertas (in-app)

Alertas simples, sem e-mail ou push no MVP:

- Transferência/saque pendente;
- Conta sem conciliação há X dias;
- Divergência de saldo;
- Bônus perto do vencimento;
- Saldo abaixo do limite definido;
- Cotação não informada.

---

## 18. Requisitos não funcionais

### Segurança (nível adequado a app pessoal)

- Login com e-mail e senha (Supabase Auth);
- Sessão protegida;
- Dados isolados por operador (RLS no banco);
- Backup automático do Supabase;
- 2FA: desejável, não obrigatório no MVP.

**Nunca armazenar:** senhas de bancos, corretoras ou casas de apostas; chaves privadas; seed phrases; códigos 2FA de plataformas externas.

### Usabilidade

- Interface responsiva (desktop e celular);
- Cadastro rápido de lançamentos;
- Cores para entrada, saída, pendência e divergência;
- Dark mode como padrão (conforme design system).

### Dados e correções

- Edição e exclusão livres de movimentações;
- Sem exigência de auditoria imutável ou histórico de versões;
- Recálculo de saldos após editar/excluir (automático no sistema).

### Desempenho

- Dashboard fluido com alguns milhares de lançamentos (paginação e índices).

---

## 19. Escopo do MVP

1. Login do operador;
2. Cadastro de **titulares**;
3. Cadastro de contas: **banco**, **corretora/carteira**, **casa de apostas** (vinculadas ao titular);
4. Cadastro de moedas e cotação manual;
5. Saldo inicial por conta;
6. Lançamento de aportes e retiradas;
7. Transferências entre contas (com status pendente/concluída);
8. Conversão de moedas;
9. Cashback, bônus e taxas;
10. Ajuste de saldo;
11. Editar e excluir qualquer lançamento;
12. Conciliação manual simples;
13. Dashboard consolidado e **por titular**;
14. Listagem de contas e movimentações com filtros;
15. Resultado por período e por casa de apostas;
16. Exportação CSV.

Tudo manual. Sem integrações automáticas.

---

## 20. Evoluções futuras (pós-MVP)

- Importação CSV/OFX de extratos;
- Cotação automática de cripto;
- Agrupamento visual de rotas (banco → corretora → casa);
- Relatórios PDF/Excel;
- Upload de comprovantes;
- Alertas por e-mail;
- Comparativo de taxas entre rotas;
- App mobile dedicado.

Integrações sempre **somente leitura**, quando existirem.

---

## 21. Fora do escopo

- Apostas automatizadas ou recomendações;
- Armazenamento de credenciais;
- Automação para burlar regras de plataformas ou KYC;
- Contabilidade formal, SPED, obrigações fiscais;
- Multi-operador / equipe com permissões granulares (por enquanto);
- Sistema financeiro auditável tipo ERP.

---

## 22. Critérios de sucesso

O JairoBet é útil quando o operador responde em poucos cliques:

- Quanto dinheiro tenho na operação?
- Onde está (banco, cripto ou casa de apostas)?
- De qual titular é cada conta?
- Quanto aportei e quanto retirei?
- Quanto veio de cashback e bônus?
- Quanto gastei em taxas?
- O que está em trânsito?
- Qual o resultado líquido estimado?
- Qual conta está desatualizada ou divergente?
- Qual casa de apostas performou melhor?

E quando errar um lançamento, consegue **corrigir ou apagar** sem burocracia.

---

*Projeto: **JairoBet** — versão PRD 2.0 — Junho/2026*