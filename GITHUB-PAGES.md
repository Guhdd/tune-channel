# Publicar a TUNE no GitHub Pages

Esta edição gera uma versão estática da TUNE, consulta a grade diretamente no
Google Apps Script e registra os eventos anônimos de audiência no mesmo endpoint.
Não é necessário manter um computador ligado.

## Primeira publicação

1. Extraia o ZIP `TUNE-GITHUB-PAGES`.
2. No repositório criado no GitHub, envie **o conteúdo da pasta extraída**. Não
   envie o arquivo ZIP.
3. Confirme o envio em `Commit changes`.
4. Abra `Settings` > `Pages`.
5. Em `Build and deployment`, selecione `GitHub Actions` como fonte.
6. Abra a aba `Actions` e aguarde o fluxo `Publicar TUNE no GitHub Pages` ficar
   verde.
7. Volte a `Settings` > `Pages` para copiar o endereço público.

O endereço normalmente segue o formato:

```text
https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
```

## Atualizações futuras

Envie os arquivos alterados ao mesmo repositório. Cada alteração na branch
`main` dispara uma nova publicação automaticamente.

## Testar a geração localmente

```bash
npm install
npm run build:github
```

Os arquivos publicados serão criados na pasta `dist`.
