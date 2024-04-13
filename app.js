const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const router = express.Router();

// Tworzę nową instancję aplikacji Express.js (framework do tworzenia serwerów webowych w JavaScript). 'app' to obiekt, który reprezentuje aplikację, dzięki niemu mogę definiować routy albo obsługiwać żądania HTTP
const app = express();

// funkcje middleware
// parsuje dane przesyłane w formacie JSON w ciele żądania i umieszcza je w req.body
app.use(express.json());
// loguje informacje o żądaniach (adres URL, status HTTP) w konsoli. Tryb 'dev' jest bardziej szczegółowy
app.use(morgan("dev"));
// obsługuje nagłówki CORS (Cross-Origin Resource Sharing), które pozwalają na bezpieczne wykonywanie żądań między różnymi domenami
app.use(cors());

const contactsRouter = require("./routes/api/contacts");
app.use("/api/contacts", contactsRouter);

module.exports = {
  app,
  router,
};

// template GOIT
// const logger = require('morgan')

// const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short'

// app.use(logger(formatsLogger))

// app.use((req, res) => {
//   res.status(404).json({ message: 'Not found' })
// })

// app.use((err, req, res, next) => {
//   res.status(500).json({ message: err.message })
// })
