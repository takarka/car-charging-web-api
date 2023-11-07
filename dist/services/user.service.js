"use strict";
// import { DocumentDefinition } from 'mongoose';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const admin_1 = require("../firebase/admin");
function register(user) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const usersRef = admin_1.FirebaseDatabase.ref("users");
            yield usersRef
                .child(user.phoneNumber)
                .once("value")
                .then((snapshot) => __awaiter(this, void 0, void 0, function* () {
                const existingUser = snapshot.val();
                if (existingUser) {
                    //   res.status(409).send("Username already exists");
                    throw new Error(`User ${user.phoneNumber} already exists`);
                }
                else {
                    // Hash the password before saving it
                    //   const saltRounds = 10; // Adjust the number of salt rounds as needed
                    //   const hashedPassword = await bcrypt.hash(password, saltRounds);
                    // Add user to the 'users' node in Firebase Realtime Database
                    usersRef
                        .child(user.phoneNumber)
                        .set(user)
                        .catch(() => {
                        throw new Error("Something went wrong, please try again");
                    });
                    //   res.status(201).json(true);
                }
            }));
        }
        catch (error) {
            throw error;
        }
    });
}
exports.register = register;
function login(user) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if the user exists in the 'users' node
            const usersRef = admin_1.FirebaseDatabase.ref("users");
            const snapshot = yield usersRef.child(user.phoneNumber).once("value");
            const existingUser = snapshot.val();
            if (!existingUser) {
                throw new Error("Invalid credentials");
            }
            // Compare the hashed password with the provided password
            // const passwordMatch = await bcrypt.compare(password, user.password);
            // if (passwordMatch) {
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
            return existingUser;
        }
        catch (error) {
            throw error;
        }
    });
}
exports.login = login;
