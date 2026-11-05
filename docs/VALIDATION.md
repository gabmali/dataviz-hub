# Validação do DataViz Hub

Revisão local em 5 de novembro de 2026, no Windows com Node 24 e Chromium do Playwright.

| Verificação | Resultado |
| --- | --- |
| `scripts/run.ps1 test` | 42 testes unitários e de integração aprovados |
| `scripts/run.ps1 test:e2e` | Build em `dist/` e 36 execuções aprovadas, 18 em desktop e 18 em celular emulado |
| Axe 4.10.3 | Zero violações automáticas nas regras WCAG 2.0 e 2.1 A/AA executadas em 13 estados de interface. Foram verificados os dois temas e larguras entre 320 e 1440 px |
| `python scripts/validate_datasets.py` | 10 pares CSV/XLSX equivalentes, 6.000 linhas e cobertura dos 24 meses de 2024 e 2025 na base de vendas |
| Agregações dos dashboards | 11.520 combinações de modelo, período, mês, região e canal conferidas. A receita fecha entre os recortes e coincide com a tabela nos modelos com indicador de receita |
| Temas Power BI | As 17 paletas exportadas passaram no esquema 2.159 da Microsoft. A validação usou uma cópia local com valores duplicados de `enum` removidos, sem alterar os valores permitidos. [Esquema oficial](https://github.com/microsoft/powerbi-desktop-samples/blob/main/Report%20Theme%20JSON%20Schema/reportThemeSchema-2.159.json) |
| Dependências | `pnpm audit --prod` não apontou vulnerabilidades conhecidas no momento da revisão |
| Configuração Vercel | `rewrites` e `headers` conferidos pelas propriedades do [esquema oficial](https://openapi.vercel.sh/vercel.json) |
| GitHub Pages | Build com `/dataviz-hub/` e HashRouter validado em servidor local. Rotas diretas, busca mobile, foco do link de atalho, menu, CSV e licença funcionaram |

## Correções verificadas

- O tema escuro aplica as cores de texto e fundo em toda a interface. A navegação mobile fecha com Escape e devolve o foco ao botão. Áreas roláveis da prévia, da tabela de dados e do código podem receber foco.
- A galeria mantém período, mês, região e canal em conjunto. O reset restaura indicadores e tabela iniciais. O Playwright confere os totais do modelo de vendas e a igualdade entre o indicador de receita e a linha quando um canal está selecionado.
- A tabela do construtor cabe no modelo padrão em 1280 × 720. O teste verifica o PNG real nessa resolução e a mensagem que impede exportar quando há componentes cortados. A suíte também cobre PNG em 1920 × 1080 e reimportação do projeto JSON.
- A busca funciona a partir das páginas internas no celular. A Home ordena os modelos mais abertos pelo histórico do próprio navegador, com persistência confirmada ao trocar de rota.
- A biblioteca SQL apresenta passos específicos por consulta. As interpretações dos KPIs foram revisadas por indicador. As medidas DAX temporais documentam os dados de 2024 e 2025 e suas dependências.

O relatório interativo dos testes de navegador fica em `playwright-report/index.html` após executar a suíte. A auditoria automática cobre os estados inspecionados. O escopo de navegador foi Chromium, e a compatibilidade de tema foi verificada pelo esquema, sem execução no Power BI Desktop. A publicação depende da configuração do repositório remoto ou da conta de hospedagem.
