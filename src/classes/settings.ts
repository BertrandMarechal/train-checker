import { FileUtils } from "../utils/file.utils";
import path from 'path';
import { LoggerUtils } from "../utils/logger.utils";

export interface Settings {
    journeys?: {from: string; to: string;}[],
    from?: string;
    to?: string;
}
export class SettingsService {
    static async saveJourney(from: string, to: string) {
        FileUtils.createFolderIfNotExistsSync(path.resolve(__dirname, '../temp'));
        let settings: Settings = await SettingsService.getSettings();

        if (settings.journeys) {
            if (!settings.journeys.find(x => x.from === from && x.to === to)) {
                settings.journeys.push({from: from, to: to});
            } else {
                LoggerUtils.warning({origin: 'Settings', message: 'This Journey has already been saved'});
                return;
            }
        } else {
            settings.journeys = [{from: from, to: to}];
        }
        await FileUtils.writeFileSync(path.resolve(__dirname, '../temp','settings.json'), JSON.stringify(settings, null, 2));
    }

    static async getSettings(): Promise<Settings> {
        let settings: Settings = {};
        if (FileUtils.checkIfFolderExists(path.resolve(__dirname, '../temp','settings.json'))) {
            settings = await FileUtils.readJsonFile(path.resolve(__dirname, '../temp','settings.json'));
        }
        return settings;
    }

    static async setFrom(from: string) {
        FileUtils.createFolderIfNotExistsSync(path.resolve(__dirname, '../temp'));
        let settings: Settings = await SettingsService.getSettings();
        settings.from = from;
        await FileUtils.writeFileSync(path.resolve(__dirname, '../temp','settings.json'), JSON.stringify(settings, null, 2));
    }
    static async setTo(to: string) {
        FileUtils.createFolderIfNotExistsSync(path.resolve(__dirname, '../temp'));
        let settings: Settings = await SettingsService.getSettings();
        settings.to = to;
        await FileUtils.writeFileSync(path.resolve(__dirname, '../temp','settings.json'), JSON.stringify(settings, null, 2));
    }
}
