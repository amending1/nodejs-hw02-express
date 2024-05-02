// Narzędzie dotenv jest używane do automatycznego ładowania zmiennych środowiskowych z pliku .env do obiektu process.env w Node.js. Dzięki temu uzyskujęć dostęp do tych zmiennych w kodzie poprzez process.env.NAZWA_ZMIENNEJ.
require("dotenv").config();

const express = require("express");
// Morgan - middleware do logowania żądań HTTP w aplikacjach Node.js, szczególnie tych opartych na Express.js
const morgan = require("morgan");
// CORS - mechanizm, który umożliwia przeglądarkom internetowym wykonywanie żądań AJAX do innych domen niż ta, z której pochodzi strona internetowa. Bez CORS przeglądarki blokują takie żądania ze względów bezpieczeństwa. Middleware CORS w Express.js pozwala na konfigurację zasad dostępu do zasobów między różnymi domenami
const cors = require("cors");

// Tworzę nową instancję aplikacji Express.js (framework do tworzenia serwerów webowych w JavaScript). 'app' to obiekt, który reprezentuje aplikację, dzięki niemu mogę definiować routy albo obsługiwać żądania HTTP
const app = express();

// funkcje middleware
// parsuje dane przesyłane w formacie JSON w ciele żądania i umieszcza je w req.body
app.use(express.json());

// loguje informacje o żądaniach (adres URL, status HTTP) w konsoli. Tryb 'dev' jest bardziej szczegółowy
app.use(morgan("dev"));
// obsługuje nagłówki CORS (Cross-Origin Resource Sharing), które pozwalają na bezpieczne wykonywanie żądań między różnymi domenami
app.use(cors());

const userRouter = require("./routes/api/users-controllers.js");
app.use("/api/users", userRouter);

const contactsRouter = require("./routes/api/contacts-controllers.js");
app.use("/api/contacts", contactsRouter);

const path = require('path');
// ta linia kodu ustawia folder public jako katalog, z którego serwuje się pliki statyczne.  path.resolve() jest używane do uzyskania pełnej ścieżki do katalogu public
app.use(express.static(path.resolve(__dirname, 'public')));

module.exports = app;