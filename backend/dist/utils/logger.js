"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    static getTimestamp() {
        return new Date().toISOString();
    }
    static formatMessage(level, message, meta) {
        const timestamp = this.getTimestamp();
        const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
    }
    static info(message, meta) {
        console.log(this.formatMessage('info', message, meta));
    }
    static error(message, meta) {
        console.error(this.formatMessage('error', message, meta));
    }
    static warn(message, meta) {
        console.warn(this.formatMessage('warn', message, meta));
    }
    static debug(message, meta) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(this.formatMessage('debug', message, meta));
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map