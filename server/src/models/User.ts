import mongoose, { Schema, Document } from "mongoose";

// Best Practice: Define an interface for your document for type safety.
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string; // Optional for OAuth users
  authProvider?: string; // e.g., "github|12345"
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: false }, // Not required for GitHub login
    authProvider: { type: String },
  },
  { timestamps: true }
);

// The Fix: Use 'export default' instead of 'export const'.
// This pattern also prevents Next.js from recompiling the model on every hot-reload.
const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
