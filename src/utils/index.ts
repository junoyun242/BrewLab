import { v4 as uuidv4 } from "uuid";

export const generateId = () =>
  crypto?.randomUUID ? crypto.randomUUID() : uuidv4();
