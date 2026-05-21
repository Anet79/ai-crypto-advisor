export const getMarketNews = (coins: string[]) => {
  return coins.map((coin) => ({
    id: `${coin}-news`,
    title: `${coin.toUpperCase()} market update`,
    summary: `Latest market sentiment and updates related to ${coin}.`,
    source: "Static fallback",
  }));
};
