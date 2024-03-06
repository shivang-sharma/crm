import pinoPretty from "pino-pretty";
import pino from "pino";

const stream = pinoPretty({
  colorize: true,
});
export const logger = pino({}, stream);
