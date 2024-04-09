const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const Joi = require("joi");
const nanoid = require("nanoid");

// Tworzę nową instancję aplikacji Express.js (framework do tworzenia serwerów webowych w JavaScript). 'app' to obiekt, który reprezentuje aplikację, dzięki niemu mogę definiować routy albo obsługiwać żądania HTTP 
const app = express();

// Ustala numer portu, na którym aplikacja będzie nasłuchiwać. Jeśli zmienna środowiskowa PORT jest ustawiona (np. przez dostawcę hostingu), użyj jej wartości. W przeciwnym razie użyj domyślnego portu 3000.
const PORT = process.env.PORT || 3000;

// funkcje middleware
// parsuje dane przesyłane w formacie JSON w ciele żądania i umieszcza je w req.body
app.use(express.json());
// loguje informacje o żądaniach (adres URL, status HTTP) w konsoli. Tryb 'dev' jest bardziej szczegółowy
app.use(morgan("dev"));
// obsługuje nagłówki CORS (Cross-Origin Resource Sharing), które pozwalają na bezpieczne wykonywanie żądań między różnymi domenami
app.use(cors());

const contacts = require("./contacts.json");

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

// routes
app.get("/api/contacts", async (req, res) => {
  try {
    const allContacts = await listContacts();
    res.status(200).json(allContacts);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/contacts", async (req, res) => {
  const { id } = req.params;
  try {
    const contact = await getContactById(parseInt(id));
    res.status(200).json(contact);
  } catch (error) {
    res.status(404).json({ message: "Not found" });
  }
});

app.post("/api/contacts", async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }
  try {
    const newContact = await addContact(req.body);
    res.status(201).json(newContact);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/api/contacts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await removeContact(parseInt(id));
    res.status(200).json({ message: "Contact deleted" });
  } catch (error) {
    res.status(404).json({ message: "Not found" });
  }
});

app.put("/api/contacts/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = validateUpdateContact(req.body);
  if (error) {
    res
      .status(400)
      .json({ message: "Invalid input data", error: error.details[0].message });
    return;
  }

  try {
    const updatedContact = await updateContact(parseInt(id), req.body);
    res.status(200).json(updatedContact);
  } catch (error) {
    res.status(404).json({ message: "Not found" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};
