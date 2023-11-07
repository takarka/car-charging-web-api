"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const routes_1 = require("./routes/routes");
// make sure to create an .env file in the root of the project!
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3476;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api", routes_1.router);
app.listen(port, () => {
    console.log(`Node.JS-Express API 📀 listening at http://localhost:${port}`);
});
