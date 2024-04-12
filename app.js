
const express = require('express')
const morgan = require("morgan");
const cors = require("cors");
const Joi = require("joi");
const nanoid = require("nanoid");

const router = express.Router()

// Tworzę nową instancję aplikacji Express.js (framework do tworzenia serwerów webowych w JavaScript). 'app' to obiekt, który reprezentuje aplikację, dzięki niemu mogę definiować routy albo obsługiwać żądania HTTP 
const app = express();

// funkcje middleware
// parsuje dane przesyłane w formacie JSON w ciele żądania i umieszcza je w req.body
app.use(express.json());
// loguje informacje o żądaniach (adres URL, status HTTP) w konsoli. Tryb 'dev' jest bardziej szczegółowy
app.use(morgan("dev"));
// obsługuje nagłówki CORS (Cross-Origin Resource Sharing), które pozwalają na bezpieczne wykonywanie żądań między różnymi domenami
app.use(cors());

const contacts = require("../models/contacts.json");


// funkcje pomocnicze
const listContacts = async () => {
  return contacts;
};

const getContactById = async (contactId) => {
  const contact = contacts.find((c) => c.id === contactId);
  if (!contact) {
    throw new Error("Contact not found");
  }
  return contact;
};

const removeContact = async (contactId) => {
  const index = contacts.findIndex((c) => c.id === contactId);
  if (index === -1) {
    throw new Error("Contact not found");
  }

  // usuwam jeden element, który jest pod wskazanym indeksem i zwracam tablicę z pierwszym i jedynym usuniętym elementem
  const removedContact = contacts.splice(index, 1)[0];
  return removedContact;
};

const addContact = async (body) => {
  const newContact = {
    id: nanoid(),
    ...body,
  };
  contacts.push(newContact);
  return newContact;
};

const updateContact = async (contactId, body) => {
  const index = contacts.findIndex((c) => c.id === contactId);
  if (index === -1) {
    throw new Error("Contact not found");
  }
  if (body.name) {
    contacts[index].email = body.email;
  }
  if (body.phone) {
    contacts[index].phone = body.phone;
  }
  return contacts[index];
};

// walidacja
const validateUpdateContact = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^[0-9]{9}$/),
  });
  return schema.validate(data);
};


module.exports = {
  app,
  router,
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  validateUpdateContact
};

// template GOIT
// const logger = require('morgan')

// const contactsRouter = require('./routes/api/contacts')

// const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short'

// app.use(logger(formatsLogger))

// app.use('/api/contacts', contactsRouter)

// app.use((req, res) => {
//   res.status(404).json({ message: 'Not found' })
// })

// app.use((err, req, res, next) => {
//   res.status(500).json({ message: err.message })
// })
