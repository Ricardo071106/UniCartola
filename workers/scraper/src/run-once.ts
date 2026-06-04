import { runFullScrape } from "./sync";

runFullScrape()
  .then((r) => {
    console.log("Scrape done:", r);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
