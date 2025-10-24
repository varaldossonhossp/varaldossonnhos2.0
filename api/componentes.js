import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const file = req.query.file;
    if (!file) return res.status(400).send("Parâmetro 'file' obrigatório");
    const caminho = path.join(process.cwd(), "componentes", file);
    const conteudo = fs.readFileSync(caminho, "utf8");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(conteudo);
  } catch (err) {
    res.status(404).send("Componente não encontrado: " + err.message);
  }
}
