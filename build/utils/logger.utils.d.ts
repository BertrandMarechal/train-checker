export declare type LoggerType = 'info' | 'warning' | 'error' | 'success';
export declare type LoggerColors = 'red' | 'grey' | 'green' | 'blue' | 'cyan' | 'white' | 'yellow' | 'grey';
interface LoggingParams {
    origin: string;
    message: string;
    type?: LoggerType;
    color?: LoggerColors;
    batchId?: number;
}
export declare class LoggerUtils {
    static log(params: LoggingParams): void;
    static info(params: LoggingParams): void;
    static error(params: LoggingParams): void;
    static warning(params: LoggingParams): void;
    static success(params: LoggingParams): void;
    static question(params: {
        text: string;
        origin: string;
    }): Promise<string>;
}
export {};
