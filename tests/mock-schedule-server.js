const http = require("node:http");

const epoch = Date.now() - 15 * 60 * 1000;
const baseItems = [
  { id: "iYWwYvhtkVE", title: "Conteúdo em exibição", duration: 1043, badge: "NOVO", rating: "14" },
  { id: "jc_zeW4gpTI", title: "A seguir na programação", duration: 1097, badge: "RECOMENDADO", rating: "12" },
  { id: "5edUdAn58Bc", title: "Depois na grade", duration: 1159, badge: "ESTREIA", rating: "16" },
];
const definitions = [
  ["play", "PLAY", "TUNE PLAY", "tune-play.png"],
  ["wild", "WILD", "TUNE WILD", "tune-wild.png"],
  ["cinema", "CINEMA", "TUNE CINEMA", "tune-cinema.png"],
  ["animes", "ANIMES", "TUNE ANIMES", "tune-animes.png"],
  ["curtas", "CURTAS", "TUNE CURTAS", "tune-curtas.png"],
];

const payload = {
  status: "ok",
  epoch,
  channels: definitions.map(([id, label, name, logo], channelIndex) => ({
    id,
    label,
    name,
    logo,
    epoch,
    items: baseItems.map((item, itemIndex) => ({
      ...item,
      title: `${name.replace("TUNE ", "")} — ${item.title}`,
      badge: itemIndex === channelIndex % baseItems.length ? item.badge : "",
      rating: id === "cinema" || id === "animes" ? item.rating : "L",
    })),
  })),
};

http.createServer((_request, response) => {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}).listen(3300, "127.0.0.1", () => {
  console.log("Grade TUNE de demonstração: http://127.0.0.1:3300");
});
