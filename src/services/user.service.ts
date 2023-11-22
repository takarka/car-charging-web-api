import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { FirebaseDatabase } from "../firebase/admin";
import { IUser } from "../models/user.model";
import { SECRET_KEY } from "../middleware/auth";

export async function register(user: IUser): Promise<void> {
  try {
    if (!user.password || !user.phoneNumber) {
      throw new Error("Password and PhoneNumber is required!");
    }

    const usersRef = FirebaseDatabase.ref("users");

    await usersRef
      .child(user.phoneNumber)
      .once("value")
      .then(async (snapshot) => {
        const existingUser = snapshot.val();

        if (existingUser) {
          throw new Error(`User ${user.phoneNumber} already exists`);
        } else {
          // Hash the password before saving it
          const saltRounds = 10; // Adjust the number of salt rounds as needed
          const hashedPassword = await bcrypt.hash(user.password!, saltRounds);
          user.password = hashedPassword;
          // Add user to the 'users' node in Firebase Realtime Database
          await usersRef
            .child(user.phoneNumber)
            .set(user)
            .catch(() => {
              throw new Error("Something went wrong, please try again");
            });
        }
      });
  } catch (error) {
    throw error;
  }
}

export async function login(user: IUser) {
  try {
    if (!user.password || !user.phoneNumber) {
      throw new Error("Password and PhoneNumber is required!");
    }

    // Check if the user exists in the 'users' node
    const usersRef = FirebaseDatabase.ref("users");
    const snapshot = await usersRef.child(user.phoneNumber).once("value");
    const foundUser: IUser = snapshot.val();

    if (!foundUser || !foundUser.password) {
      throw new Error("Invalid credentials, user not found!");
    }

    // Compare the hashed password with the provided password
    const isMatch = bcrypt.compareSync(user.password, foundUser.password);

    if (isMatch) {
      const { password, ...foundUserWithoutPass } = foundUser;

      const token = jwt.sign(foundUserWithoutPass, SECRET_KEY, {
        expiresIn: "1h",
      });

      return { ...foundUserWithoutPass, token: token };
    } else {
      throw new Error("Invalid credentials");
    }
  } catch (error) {
    throw error;
  }
}
