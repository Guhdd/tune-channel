# TUNE Web TV

Rede web de canais contínuos administrada por uma planilha Google. O site mantém
um único player e permite sintonizar `TUNE PLAY`, `TUNE WILD`, `TUNE CINEMA`,
`TUNE ANIMES` e `TUNE CURTAS`. Cada canal possui grade e loop independentes.

## Administrar a grade

Cole um link público do YouTube por linha e escolha o canal na coluna `canal`.
`título TUNE`, `selo` e `classificação` são opcionais. A ordem das linhas dentro de
cada canal define sua transmissão; o painel lateral controla o horário-base usado
por todas as grades. Início e término são calculados separadamente para cada canal.
Links repetidos no mesmo canal, inválidos, privados ou sem permissão para
incorporação são ignorados pelo Apps Script.

Os selos aceitos são `NOVO`, `RECOMENDADO`, `ESTREIA` e `EXCLUSIVO`. As
classificações aceitas são `L`, `10`, `12`, `14`, `16` e `18`.

Cada canal aguarda o horário configurado. Após iniciar, percorre sua própria grade
e volta ao primeiro item ao chegar ao fim. O mesmo marco inicial continua válido
nos dias seguintes e só é substituído quando o horário é editado.

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
