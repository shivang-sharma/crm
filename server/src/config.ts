import convict from "convict";
import { ipaddress, url } from "convict-format-with-validator";
convict.addFormat(ipaddress);
convict.addFormat(url);

// Define a schema
const config = convict({
    env: {
        doc: "The application environment.",
        format: ["production", "development", "test"],
        default: "development",
        env: "NODE_ENV",
    },
    ip: {
        doc: "The IP address to bind.",
        format: "ipaddress",
        default: "127.0.0.1",
        env: "IP_ADDRESS",
    },
    port: {
        doc: "The port to bind.",
        format: "port",
        default: 8080,
        env: "PORT",
        arg: "port",
    },
    db: {
        uri: {
            doc: "Connection URI for mongo",
            format: "*",
            default: "mongodb://root:password@127.0.0.1:27017",
        },
    },
    corsOrigin: {
        doc: "CORS origin whitelist",
        format: "*",
        default: "*",
    },
    accessTokenSecret: {
        doc: "Access token secret",
        formate: String,
        default: "secret",
    },
    accessTokenExpiry: {
        doc: "Expiry for access token",
        format: String,
        default: "1d",
    },
    refreshTokenSecret: {
        doc: "Refresh token secret",
        format: String,
        default: "secret",
    },
    refreshTokenExpiry: {
        doc: "Refresh token expiry",
        format: String,
        default: "10d",
    },
});

// Load environment dependent configuration
const env = config.get("env");
config.loadFile("./config/" + env + ".json");

// Perform validation
config.validate({ allowed: "strict" });

export { config };
