# Como contribuir

Contribuições para o catálogo, acessibilidade, documentação e correções são bem-vindas.

1. Crie uma branch a partir de `main` e descreva o problema que pretende resolver.
2. Instale as dependências e execute `npm run dev`.
3. Preserve a interface em português brasileiro e as cores da marca. Verifique desktop e celular, teclado e os dois temas.
4. Catálogos ficam em `src/data/*.json`. Inclua ID único, nome, descrição, categoria, tags e data; use somente recursos originais ou compatíveis com MIT/ISC.
5. Edite `scripts/generate_catalog.mjs` se quiser que o recurso sobreviva à regeneração do catálogo. Para ícones, execute `node scripts/generate_icon_registry.mjs` após alterar metadados.
6. Datasets devem ser inteiramente sintéticos. Documente unidades, chaves, ausências e regras de consistência. Gere com `python scripts/generate_datasets.py` e valide com `python scripts/validate_datasets.py`.
7. Rode `npm test`, `npm run build` e `npm run test:e2e`. Inclua testes quando houver nova regra de negócio ou correção de comportamento.
8. Abra um pull request explicando o comportamento final e a validação executada. Para mudanças visuais, inclua capturas de tela.

Não inclua credenciais, arquivos de clientes, informações pessoais, arquivos `.env` ou capturas protegidas de dashboards de terceiros. Exemplos de código devem indicar dependências e não devem executar conteúdo importado na aplicação.

Ao contribuir, você concorda em disponibilizar seu código original sob a licença MIT do projeto.
