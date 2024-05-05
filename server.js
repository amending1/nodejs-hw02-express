// Narzędzie dotenv jest używane do automatycznego ładowania zmiennych środowiskowych z pliku .env do obiektu process.env w Node.js. Dzięki temu uzyskujęć dostęp do tych zmiennych w kodzie poprzez process.env.NAZWA_ZMIENNEJ.
require('dotenv').config();
const app = require("./app.js");
const PORT = 3000;

const { connection } = require("./providers/db-provider.js");

connection
  .then(() => {
    console.log("Database connection successful");
    app.listen(PORT, function () {
      console.log(`Server running. Use our API on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Server not running. Error message: ${err.message}`);
    process.exit(1);
  });
