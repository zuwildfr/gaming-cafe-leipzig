import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "api/data.json");

export default function handler(req, res) {
  if (req.method === "POST") {
    const { type } = req.body; // "yes" oder "no"
    if (!["yes", "no"].includes(type)) {
      return res.status(400).json({ error: "Ungültiger Vote-Typ" });
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    data.votes[type]++;
    data.lastVoteTimestamp = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    return res.status(200).json(data);
  } else if (req.method === "GET") {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return res.status(200).json(data);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
