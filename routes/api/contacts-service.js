const Joi = require("joi");
const nanoid = require("nanoid");

const { Schema, model } = require("mongoose");

const contacts = new Schema({
  name: {
    type: String,
    required: [true, "Set name for contact"],
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  favorite: {
    type: Boolean,
    default: false,
  },
});

const Contact = model("contacts", contacts);

// funkcje pomocnicze
const listContacts = async () => {
  return await Contact.find();
};

const getContactById = async (contactId) => {
  const contact = await Contact.findOne({ _id: contactId });
  if (!contact) {
    throw new Error("Contact not found");
  }
  return contact;
};

const removeContact = async (contactId) => {
  const removedContact = await Contact.findOneAndDelete({ _id: contactId });

  if (removedContact) {
    return removedContact;
  } else {
    throw new Error("Contact not found");
  }
};

const addContact = async (body) => {
  try {
  const newContact = await Contact.create({    
    id: nanoid.nanoid(),
    ...body,
  });
return newContact;
  } catch (error) {
    throw new Error('Could not create contact');
  }
  
};

const updateContact = async (contactId, body) => {
  try {
    const existingContact = await Contact.findById( 
   contactId);
  
  if (!existingContact) {
    throw new Error("Contact not found");
  }

  if (body.name) {
    existingContact.name = body.name;
  }
  if (body.phone) {
    existingContact.phone = body.phone;
  }
  if (body.email) {
    existingContact.email = body.email;
  }

  const updatedContact = await existingContact.save();
  return updatedContact;

} catch (error) {
  throw new Error(error.message);
}
};

const updateStatusContact = async (contactId, body) => {
  try {
    const existingContact = await Contact.findById(contactId);
  
    if (!existingContact) {
      throw new Error("Contact not found");
    }
  
    // sprawdzam, czy wartość pola favorite w ciele żądania body jest typu boolean
    if (typeof body.favorite !== 'boolean') {
      throw new Error("Invalid favorite value");
    }

    // jeśli warunki wyżej są spełnione, funkcja przypisuje wartość pola favorite z ciała żądania body do istniejącego kontaktu
    existingContact.favorite = body.favorite;
  
    // funkcja zapisuje zaktualizowany kontakt w bazie danych metodą save() na obiekcie kontaktu
    const updatedContact = await existingContact.save();
    return updatedContact;
  } catch (error) {
    throw new Error(error.message);
  }
};

const validateBoolean = (value) => typeof value === 'boolean';

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
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  validateUpdateContact,
  updateStatusContact,
  validateBoolean,
};
