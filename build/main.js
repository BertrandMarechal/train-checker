#!/usr/bin/env node
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
const axios_1 = __importDefault(require("axios"));
const colors_1 = __importDefault(require("colors"));
const file_utils_1 = require("./utils/file.utils");
const path_1 = __importDefault(require("path"));
const logger_utils_1 = require("./utils/logger.utils");
const settings_1 = require("./classes/settings");
const [, , ...args] = process.argv;
const url = 'https://www.thetrainline.com/live/api/trains';
let index = 1;
function status(mode) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let settings = yield settings_1.SettingsService.getSettings();
            let journeysToCheck = [];
            if (settings.journeys) {
                journeysToCheck = settings.journeys;
            }
            else if (args[1] && args[2] && args[1].length === 3 && args[2].length === 3) {
                journeysToCheck = [{ from: args[1], to: args[2] }];
            }
            if (journeysToCheck.length === 0) {
                throw 'No stations provided or no journey saved';
            }
            for (let i = 0; i < journeysToCheck.length; i++) {
                const stations = journeysToCheck[i];
                console.log(` ${index} - Trains ${mode} from ${stations.from} to ${stations.to}:`);
                const response = yield getStationStatus(stations.from, stations.to, mode);
                let journeys = { journeys: [] };
                if (file_utils_1.FileUtils.checkIfFolderExists(path_1.default.resolve(__dirname, './temp', 'journeys.json'))) {
                    journeys = yield file_utils_1.FileUtils.readJsonFile(path_1.default.resolve(__dirname, './temp', 'journeys.json'));
                }
                if (response.hasTrains && response.data && response.data.services && response.data.services.length > 0) {
                    journeys.journeys.push(Object.assign({}, response.data, { index: index }));
                    const lastCheckedNumber = new Date().getTime() - new Date(response.data.lastChecked).getTime();
                    let hours = 0, minutes = 0, secondes = 0;
                    hours = Math.floor(lastCheckedNumber / 3600000);
                    minutes = Math.floor((lastCheckedNumber - hours * 3600000) / 60000);
                    secondes = Math.floor((lastCheckedNumber - hours * 3600000 - minutes * 60000) / 1000);
                    const lastChecked = [{
                            caption: 'hours',
                            value: hours
                        }, {
                            caption: 'minutes',
                            value: minutes
                        }, {
                            caption: 'secondes',
                            value: secondes
                        }].map(x => x.value ? `${x.value} ${x.caption}` : null).filter(Boolean).join(' ');
                    console.log(colors_1.default.cyan(`  Last checked ${lastChecked} ago`));
                    const trainsStatuses = response.data.services.map((service, i) => {
                        let returnString = `  ${i + 1} - ${service.due} : ${service.origin}${service.destination ? (' -> ' + service.destination) : ''} : `;
                        if (service.expected === 'On time') {
                            returnString += colors_1.default.green(service.expected);
                        }
                        else if (service.expected === 'Cancelled') {
                            returnString += colors_1.default.red(service.expected);
                        }
                        else {
                            returnString += colors_1.default.yellow(service.expected);
                        }
                        return returnString;
                    }).join('\n');
                    console.log(trainsStatuses);
                    file_utils_1.FileUtils.createFolderIfNotExistsSync(path_1.default.resolve(__dirname, './temp'));
                    yield file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(__dirname, './temp', 'journeys.json'), JSON.stringify(journeys, null, 2));
                }
                else {
                    console.log('  No trains '.yellow);
                }
                index++;
            }
        }
        catch (error) {
            console.log('Error when calling trainline'.red);
            console.error(error);
        }
    });
}
function getStationStatus(from, to, mode) {
    return __awaiter(this, void 0, void 0, function* () {
        // when checking for arrivals, we have to put from in origin, and to in destination
        try {
            const finalUrl = [
                url,
                `action=arrivals`,
                `destinationCode=${mode === 'arrivals' ? from : to}`,
                `originCode=${mode === 'arrivals' ? to : from}`
            ].join(';');
            const response = yield axios_1.default.get(finalUrl);
            return { hasTrains: true, data: Object.assign({}, response.data, { from: from, to: to }) };
        }
        catch (error) {
            return { hasTrains: false };
        }
    });
}
function searchStation(stationName) {
    return __awaiter(this, void 0, void 0, function* () {
        const params = [
            { key: 'searchTerm', value: stationName },
            { key: 'lang', value: 'en' },
            { key: 'country', value: 'GB' },
            { key: 'locationType', value: 'station,stationGroup,city' },
            { key: 'scopes', value: 'atoconly,eurostaronly,sncf,benerail,trenitalia,renfe,ntv,busbud,flixbus,dbfull' },
            { key: 'size', value: '30' }
        ];
        const finalUrl = `https://www.thetrainline.com/api/locations-pot/search?${params.map(({ key, value }) => `${key}=${encodeURIComponent(value)}`).join('&')}`;
        const axiosResponse = yield axios_1.default.get(finalUrl);
        const data = axiosResponse.data;
        const result = `Results for "${stationName}" :\n` +
            data.requestedCountry.map(x => `  ${colors_1.default.blue(x.name)} a.k.a. ${colors_1.default.white(x.aliases
                .filter(x => x.length === 3)
                .join(', '))}`).join('\n');
        ;
        console.log(result);
    });
}
function getTrainDetails(indexes) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!/[0-9]+\-[0-9]+/.test(indexes)) {
            throw 'Please use the indexes of the status(i.e.: "1-2")';
        }
        if (!file_utils_1.FileUtils.checkIfFolderExists(path_1.default.resolve(__dirname, './temp/journeys.json'))) {
            throw 'Please use the command "status" before checking a train';
        }
        const journeys = yield file_utils_1.FileUtils.readJsonFile(path_1.default.resolve(__dirname, './temp/journeys.json'));
        const [journeyId, trainId] = indexes.split('-').map(x => +x);
        let journey;
        if (journeys.journeys) {
            journey = journeys.journeys.find(x => x.index === journeyId);
        }
        if (!journey) {
            throw 'Invalid journey id';
        }
        let serviceId = '', from = '';
        if (journey && journey.services[trainId - 1]) {
            serviceId = journey.services[trainId - 1].id;
            from = journey.from;
        }
        else {
            throw 'Invalid service id';
        }
        // serviceId: string
        try {
            const finalUrl = [
                url,
                'action=details',
                'isDepartures=true',
                `selectedStationCode=${from}`,
                `serviceId=${serviceId}`
            ].join(';');
            const response = yield axios_1.default.get(finalUrl);
            const journeyDetails = response.data;
            let status = `Train ${journeyDetails.scheduledAt} ${journeyDetails.operator} ${colors_1.default.cyan(`- Last checked ${journeyDetails.checkedAt}\n`)}`;
            const train = colors_1.default.rainbow(`[Tchou tchou]`);
            status += journeyDetails.callingPoints.map((callingPoint) => {
                let callingPointInfo = `  ${callingPoint.station} - ${callingPoint.scheduledAt}`;
                if (callingPoint.isTrainHere && !callingPoint.hasDeparted) {
                    callingPointInfo += ' - ' + train;
                }
                let callingPointStatus = '';
                if (callingPoint.hasDeparted) {
                    callingPointStatus = colors_1.default.grey(callingPointInfo);
                }
                else {
                    callingPointStatus = colors_1.default.white(callingPointInfo);
                }
                if (callingPoint.estimatedAt !== 'On time') {
                    callingPointStatus += colors_1.default.yellow(` dep. ${callingPoint.estimatedAt}`);
                }
                if (callingPoint.isTrainHere && callingPoint.hasDeparted) {
                    callingPointStatus += '\n    ' + train;
                }
                return callingPointStatus;
            }).join('\n');
            // console.log(JSON.stringify(journeyDetails.callingPoints, null, 2))
            console.log(status);
        }
        catch (error) {
            return null;
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (args[0] === 'save-journey') {
            settings_1.SettingsService.saveJourney(args[1], args[2]);
        }
        else if (args[0] === 'search') {
            yield searchStation(args[1]);
        }
        else if (args[0] === 'set-from') {
            yield settings_1.SettingsService.setFrom(args[1]);
            logger_utils_1.LoggerUtils.success({ origin: 'train-checker', message: 'from station saved' });
        }
        else if (args[0] === 'set-to') {
            yield settings_1.SettingsService.setTo(args[1]);
            logger_utils_1.LoggerUtils.success({ origin: 'train-checker', message: 'to station saved' });
        }
        else if (args[0] === 'clear') {
            file_utils_1.FileUtils.deleteFolderRecursiveSync(path_1.default.resolve(__dirname, './temp'));
            logger_utils_1.LoggerUtils.success({ origin: 'train-checker', message: 'Setting cleared' });
        }
        else if (args[0] === 'status') {
            if (file_utils_1.FileUtils.checkIfFolderExists(path_1.default.resolve(__dirname, './temp/journeys.json'))) {
                file_utils_1.FileUtils.deleteFileSync(path_1.default.resolve(__dirname, './temp/journeys.json'));
            }
            yield status('departures');
            yield status('arrivals');
            console.log('');
            console.log('To have details on one train, please call traun-status <journey index>-<train index>');
        }
        else if (args[0] === 'train-status') {
            yield getTrainDetails(args[1]);
        }
        else {
            const validOptions = [
                'save-journey',
                'search',
                'set-from',
                'set-to',
                'clear',
                'status',
                'train-status'
            ];
            logger_utils_1.LoggerUtils.info({
                origin: 'train-checker',
                message: `Invalid option provided. Valid options are :`
            });
            console.log(validOptions.map(x => `\t${x}`).join('\n'));
        }
    });
}
main();
