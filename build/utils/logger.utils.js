"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = __importDefault(require("colors"));
const readline = __importStar(require("readline"));
let _originMaxLength = 0;
let _spaces = '';
class LoggerUtils {
    static log(params) {
        if (params.origin.length > _originMaxLength) {
            _originMaxLength = params.origin.length,
                _spaces = ' '.repeat(_originMaxLength);
        }
        let typeColor;
        switch (params.type) {
            case "error":
                typeColor = 'red';
                break;
            case "info":
                typeColor = 'cyan';
                break;
            case "warning":
                typeColor = 'yellow';
                break;
            case "success":
                typeColor = 'green';
                break;
            default:
                typeColor = 'grey';
        }
        const origin = `[${params.origin}${_spaces}`.slice(0, _originMaxLength + 1) + ']';
        // [MSSQL] - Batch 60:Mark batch as FINISHED
        console.log(new Date().toISOString().substr(0, 19) +
            ' - ' +
            colors_1.default.cyan(origin) +
            ' : ' +
            `${params.type ? colors_1.default[typeColor]('**' + params.type.toUpperCase() + '** ') : ''}` +
            colors_1.default[params.color || 'grey'](params.message) +
            (params.batchId ? colors_1.default.cyan(` (batch: ${params.batchId})`) : ''));
    }
    static info(params) {
        LoggerUtils.log(Object.assign({}, params, { type: 'info' }));
    }
    static error(params) {
        LoggerUtils.log(Object.assign({}, params, { type: 'error' }));
    }
    static warning(params) {
        LoggerUtils.log(Object.assign({}, params, { type: 'warning' }));
    }
    static success(params) {
        LoggerUtils.log(Object.assign({}, params, { type: 'success' }));
    }
    static question(params) {
        const origin = `[${params.origin}${_spaces}`.slice(0, _originMaxLength + 1) + ']';
        const text = new Date().toISOString().substr(0, 19) +
            ' - ' +
            colors_1.default.cyan(origin) +
            ' : ' +
            params.text + '\n > ';
        return new Promise(resolve => {
            let rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question(text, (answer) => {
                resolve(answer);
                rl.close();
            });
        });
    }
}
exports.LoggerUtils = LoggerUtils;
