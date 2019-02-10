"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const file_utils_1 = require("../utils/file.utils");
const path_1 = __importDefault(require("path"));
const logger_utils_1 = require("../utils/logger.utils");
class SettingsService {
    static saveJourney(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            file_utils_1.FileUtils.createFolderIfNotExistsSync(path_1.default.resolve(__dirname, '../temp'));
            let settings = yield SettingsService.getSettings();
            if (settings.journeys) {
                if (!settings.journeys.find(x => x.from === from && x.to === to)) {
                    settings.journeys.push({ from: from, to: to });
                }
                else {
                    logger_utils_1.LoggerUtils.warning({ origin: 'Settings', message: 'This Journey has already been saved' });
                    return;
                }
            }
            else {
                settings.journeys = [{ from: from, to: to }];
            }
            yield file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(__dirname, '../temp', 'settings.json'), JSON.stringify(settings, null, 2));
        });
    }
    static getSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            let settings = {};
            if (file_utils_1.FileUtils.checkIfFolderExists(path_1.default.resolve(__dirname, '../temp', 'settings.json'))) {
                settings = yield file_utils_1.FileUtils.readJsonFile(path_1.default.resolve(__dirname, '../temp', 'settings.json'));
            }
            return settings;
        });
    }
    static setFrom(from) {
        return __awaiter(this, void 0, void 0, function* () {
            file_utils_1.FileUtils.createFolderIfNotExistsSync(path_1.default.resolve(__dirname, '../temp'));
            let settings = yield SettingsService.getSettings();
            settings.from = from;
            yield file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(__dirname, '../temp', 'settings.json'), JSON.stringify(settings, null, 2));
        });
    }
    static setTo(to) {
        return __awaiter(this, void 0, void 0, function* () {
            file_utils_1.FileUtils.createFolderIfNotExistsSync(path_1.default.resolve(__dirname, '../temp'));
            let settings = yield SettingsService.getSettings();
            settings.to = to;
            yield file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(__dirname, '../temp', 'settings.json'), JSON.stringify(settings, null, 2));
        });
    }
}
exports.SettingsService = SettingsService;
