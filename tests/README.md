# Testes do formulário

Validação partilhada entre cliente e servidor:

```sh
node --test tests/registration-schema.test.mjs
```

Com a aplicação em execução e Playwright e Microsoft Edge disponíveis:

```sh
node tests/enrollment-selects.browser.mjs
node tests/mobile-selects.browser.mjs
```

Os testes também aceitam o caminho/URL do módulo Playwright como primeiro argumento
e `TEST_BASE_URL` para substituir `http://localhost:3000`. Precisa de inscrições
abertas e de pelo menos um curso e um centro activos. Não submete inscrições:
verifica selectores, teclado, erros, preservação dos dados e ausência de gravações
intermédias num ecrã de 390 px. O teste móvel usa emulação táctil e verifica
os selectores nativos, incluindo a dependência província/distrito.

## Nacionalidades

`lib/nationalities.json` contém os 249 códigos ISO 3166-1 (países e territórios),
com nomes em português de Portugal obtidos de `Intl.DisplayNames`. O formulário
pede o país da nacionalidade, não um gentílico. Moçambique mantém o valor
`Moçambicana` por compatibilidade com os registos existentes. A lista é estática
para manter os mesmos nomes e ordenação no servidor e no navegador.

Referências: https://www.iso.org/iso-3166-country-codes.html e
https://ui.shadcn.com/docs/components/base/select.
