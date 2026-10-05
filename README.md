# Desafio 31 Dias

Uma rotina guiada de movimento, mobilidade e fortalecimento gradual (público 50+).
Aplicação web estática, sem build: abra `index.html` ou sirva a pasta (`python3 -m http.server`).

## Estrutura
- `js/data/exercises.js` — biblioteca de exercícios (**demonstrativa/placeholder**)
- `js/data/program.js` — fases, rotinas por fase, durações e descansos
- `js/data/content.js` — dicas, motivação e textos de saúde
- `js/progress.js` / `js/storage.js` — regras de progresso e persistência (localStorage)
- `js/components.js` — componentes reutilizáveis; `js/views/*` — telas; `js/app.js` — rotas

## Trocar pelos exercícios validados
1. Edite/adicione itens em `exercises.js` (use `imagem_ou_video` para mídia real).
2. Ajuste as sequências em `program.js`.
3. Após revisão profissional, defina `D31.CONTEUDO_VALIDADO = true` (remove o aviso de demonstração).

## Progresso
O calendário é ancorado na data de início. Dias perdidos ficam como "não concluído" sem apagar nada;
"Continuar a partir de hoje" reancora o calendário.
