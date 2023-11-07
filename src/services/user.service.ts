import { FirebaseDatabase } from "../firebase/admin";
import { IUser } from "../models/user.model";
import bcrypt from "bcrypt";

export async function register(user: IUser): Promise<void> {
  try {
    const usersRef = FirebaseDatabase.ref("users");

    await usersRef
      .child(user.phoneNumber)
      .once("value")
      .then(async (snapshot) => {
        const existingUser = snapshot.val();

        if (existingUser) {
          //   res.status(409).send("Username already exists");
          throw new Error(`User ${user.phoneNumber} already exists`);
        } else {
          // Hash the password before saving it
          const saltRounds = 10; // Adjust the number of salt rounds as needed
          const hashedPassword = await bcrypt.hash(user.password, saltRounds);
          user.password = hashedPassword;
          // Add user to the 'users' node in Firebase Realtime Database
          usersRef
            .child(user.phoneNumber)
            .set(user)
            .catch(() => {
              throw new Error("Something went wrong, please try again");
            });
          //   res.status(201).json(true);
        }
      });
  } catch (error) {
    throw error;
  }
}

export async function login(user: IUser) {
  try {
    // Check if the user exists in the 'users' node
    const usersRef = FirebaseDatabase.ref("users");
    const snapshot = await usersRef.child(user.phoneNumber).once("value");
    const foundUser = snapshot.val();

    if (!foundUser) {
      throw new Error("Invalid credentials");
    }

    // Compare the hashed password with the provided password
    const isMatch = bcrypt.compareSync(user.password, foundUser.password);

    if (isMatch) {
      console.log("Password match");
      return foundUser;
    } else {
      console.log("Password mismatch");
      throw new Error("Invalid credentials");
    }
    // Generate a JWT token
    //   const { password, ...userDataWithoutPassword } = user;
    //   const token = sign(userDataWithoutPassword, process.env.SESSION_SECRET, {
    //     expiresIn: "1h",
    //   });

    //   res.status(200).json({
    //     user: userDataWithoutPassword,
    //     token: token,
    //   });
    // } else {
    //   res.status(401).send("Invalid credentials");
    // }
  } catch (error) {
    throw error;
  }
}
