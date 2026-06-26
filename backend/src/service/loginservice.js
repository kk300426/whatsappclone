import { createEditDeleteContent } from "../schema/loginSchema.js";

export const createEditDeleteContents = {
  async createContents(username, email, password) {
    return await createEditDeleteContent.createContent({
      username,
      email,
      password
    });
  },
  async getAllContents() {
    return await createEditDeleteContent.getAllUsers();
  },

  async getContentById(id) {
    return await createEditDeleteContent.getUserById(id);
  },
  async getContentByEmail(email) {
    return await createEditDeleteContent.getUserByEmail(email);
  }
};