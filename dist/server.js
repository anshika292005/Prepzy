"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    await (0, db_1.default)();
    app_1.default.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
    });
};
startServer().catch((error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
});
// ---------- Global Error Handlers ----------
process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message);
    process.exit(1);
});
