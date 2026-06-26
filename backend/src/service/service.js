import { createEditDeleteContent } from "../schema/schema.js";

export const createEditDeleteContents = {
  async createContents(name, messages, lastMessage, time, date) {
    return await createEditDeleteContent.createContent({
      name,
      messages,
      lastMessage,
      time,
      date
    });
  },
  async getAllContents() {
    return await createEditDeleteContent.getAllContacts();
  },

  async getContentById(id) {
    return await createEditDeleteContent.getContactsById(id);
  },
  async getContentByName(name) {
    return await createEditDeleteContent.getContactsByname(name);
  }
};
