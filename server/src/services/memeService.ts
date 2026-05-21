import fs from "fs";
import path from "path";

export type CryptoMeme = {
  id: string;
  title: string;
  imageUrl: string;
  caption: string;
};

let cachedMemes: CryptoMeme[] | null = null;

const loadCryptoMemes = (): CryptoMeme[] => {
  if (cachedMemes) {
    return cachedMemes;
  }

  const candidates = [
    path.join(__dirname, "../data/crypto-memes.json"),
    path.join(process.cwd(), "src/data/crypto-memes.json"),
  ];

  const filePath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!filePath) {
    throw new Error("crypto-memes.json not found");
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
    memes: CryptoMeme[];
  };

  cachedMemes = parsed.memes;
  return cachedMemes;
};

export const getCryptoMeme = (): CryptoMeme => {
  const memes = loadCryptoMemes();
  return memes[Math.floor(Math.random() * memes.length)];
};
