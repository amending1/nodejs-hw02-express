const { router } = require("../app.js");

const {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  validateUpdateContact,
} = require("./contacts-controllers.js");

// routes
router.get("/", async (req, res, next) => {
  try {
    const allContacts = await listContacts();
    res.status(200).json(allContacts);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const contact = await getContactById(parseInt(id));
    res.status(200).json(contact);
  } catch (error) {
    res.status(404).json({ message: "Not found" });
  }
});

router.post("/", async (req, res, next) => {
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

router.delete("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    await removeContact(parseInt(id));
    res.status(200).json({ message: "Contact deleted" });
  } catch (error) {
    res.status(404).json({ message: "Not found" });
  }
});

router.put("/:id", async (req, res, next) => {
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
