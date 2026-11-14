# TUNE Web TV

Canal web contínuo cuja grade é administrada por uma planilha Google. O site lê o
endpoint público do Apps Script no servidor, calcula a posição atual da transmissão
e mantém todos os espectadores sincronizados.

## Administrar a grade

Na primeira coluna da planilha TUNE, mantenha `link` na célula A1 e cole um link
público do YouTube por linha a partir de A2. A coluna `título TUNE` aceita um nome
curto opcional. A ordem das linhas define a transmissão, e o início informado em
`D2` controla o horário-base usado pelo site. Início e término dos demais itens são
calculados automaticamente. Links repetidos, inválidos, privados ou sem permissão
para incorporação são ignorados pelo Apps Script.

O canal aguarda o primeiro horário configurado. Após iniciar, percorre a grade na
ordem da planilha e volta ao primeiro item ao chegar ao fim. O mesmo marco inicial
continua válido nos dias seguintes e só é substituído quando o horário da grade é
editado.

O Apps Script mantém os dados em cache por até cinco minutos. Enquanto a planilha
estiver vazia ou indisponível, o site usa automaticamente a programação de
contingência incluída no projeto.

## Audiência

O site envia dois eventos anônimos ao Apps Script: entrada no site e clique no
player. A aba privada `Audiência TUNE` consolida, por dia, quantos navegadores
diferentes entraram e quantos apertaram o player. Nenhuma métrica de audiência é
exibida publicamente.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>. A API da grade fica em
<http://localhost:3000/api/channel>.

## Verificações

```bash
npm run lint
npm run build
```

## Configuração e deploy

O endpoint atual já está configurado no código. Para substituir a implantação sem
alterar arquivos, copie `.env.example` para `.env.local` no desenvolvimento ou crie
`TUNE_SCHEDULE_URL` nas variáveis de ambiente do provedor de hospedagem.

Não é necessário manter um computador ligado: depois do deploy, o site consulta o
Google Apps Script diretamente. O projeto pode ser publicado em um provedor com
suporte ao Next.js, incluindo Netlify e Vercel.
