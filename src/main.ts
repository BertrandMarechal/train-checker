#!/usr/bin/env node
import axios, { AxiosResponse } from 'axios';
import colors from 'colors';
import { FileUtils } from './utils/file.utils';
import path from 'path';
import { LoggerUtils } from './utils/logger.utils';
import { TrainlineResponse, JourneyDetails, LocationSerachResult, StationStatus, CallingPoint } from './models/trainline.model';
import { SettingsService, Settings } from './classes/settings';

const [,,...args] = process.argv;

const url = 'https://www.thetrainline.com/live/api/trains';

let index = 1;

async function status(mode: string) {
    try {
        let settings: Settings = await SettingsService.getSettings();
        let journeysToCheck: {from: string; to: string;}[] = [];

        if (settings.journeys) {
            journeysToCheck = settings.journeys;
        } else if (args[1] && args[2] && args[1].length === 3 && args[2].length === 3) {
            journeysToCheck = [{from: args[1], to: args[2]}];
        }
        if (journeysToCheck.length === 0) {
            throw 'No stations provided or no journey saved';
        }
        for (let i = 0; i < journeysToCheck.length; i++) {
            const stations = journeysToCheck[i];
            console.log(` ${index} - Trains ${mode} from ${stations.from} to ${stations.to}:`);
            const response = await getStationStatus(stations.from, stations.to, mode);
            let journeys: {journeys: StationStatus[]} = {journeys: []}
            if (FileUtils.checkIfFolderExists(path.resolve(__dirname, './temp','journeys.json'))) {
                journeys = await FileUtils.readJsonFile(path.resolve(__dirname, './temp','journeys.json'));
            }
            
            if (response.hasTrains && response.data && response.data.services && response.data.services.length > 0) {
                journeys.journeys.push({
                    ...response.data,
                    index: index
                });
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

                console.log(colors.cyan(`  Last checked ${lastChecked} ago`));
                const trainsStatuses = response.data.services.map((service, i) => {
                    let returnString = `  ${i + 1} - ${service.due} : ${service.origin}${service.destination ? (' -> ' + service.destination) : ''} : `;
                    if (service.expected === 'On time') {
                        returnString += colors.green(service.expected);
                    } else if (service.expected === 'Cancelled') {
                        returnString += colors.red(service.expected);
                    } else {
                        returnString += colors.yellow(service.expected);
                    }
                    return returnString;
                }).join('\n');
                console.log(trainsStatuses);
                
                FileUtils.createFolderIfNotExistsSync(path.resolve(__dirname, './temp'));
                await FileUtils.writeFileSync(path.resolve(__dirname, './temp','journeys.json'), JSON.stringify(journeys, null, 2));
            } else {
                console.log('  No trains '.yellow);
            }
            index++;
        }
    } catch (error) {
        console.log('Error when calling trainline'.red);
        console.error(error);
    }
}

async function getStationStatus(from: string, to: string, mode: string): Promise<TrainlineResponse> {
    // when checking for arrivals, we have to put from in origin, and to in destination
    try {
        const finalUrl = [
            url,
            `action=arrivals`,
            `destinationCode=${mode === 'arrivals' ? from : to}`,
            `originCode=${mode === 'arrivals' ? to : from}`
        ].join(';')
        const response: AxiosResponse = await axios.get(finalUrl);
        return {hasTrains: true, data: {...response.data, from: from, to: to}};
    } catch (error) {
        return {hasTrains: false};
    }
}

async function searchStation(stationName: string) {
    const params = [
        {key: 'searchTerm', value: stationName},
        {key: 'lang', value: 'en'},
        {key: 'country', value: 'GB'},
        {key: 'locationType', value: 'station,stationGroup,city'},
        {key: 'scopes', value: 'atoconly,eurostaronly,sncf,benerail,trenitalia,renfe,ntv,busbud,flixbus,dbfull'},
        {key: 'size', value: '30'}
    ];
    const finalUrl = `https://www.thetrainline.com/api/locations-pot/search?${
        params.map(({key, value}) => `${key}=${encodeURIComponent(value)}`).join('&')
    }`;
    const axiosResponse: AxiosResponse = await axios.get(finalUrl);
    const data: LocationSerachResult = axiosResponse.data;
    const result = `Results for "${stationName}" :\n` +
    data.requestedCountry.map(x => `  ${colors.blue(x.name)} a.k.a. ${
        colors.white(
            x.aliases
                .filter(x => x.length === 3)
                .join(', ')
            )
        }`).join('\n');
    ;
    console.log(result);
    
}
async function getTrainDetails(indexes: string) {
    if (!/[0-9]+\-[0-9]+/.test(indexes)) {
        throw 'Please use the indexes of the status(i.e.: "1-2")';
    }
    if (!FileUtils.checkIfFolderExists(path.resolve(__dirname, './temp/journeys.json'))) {
        throw 'Please use the command "status" before checking a train';
    }
    const journeys: {journeys: StationStatus[]} = await FileUtils.readJsonFile(path.resolve(__dirname, './temp/journeys.json'));
    const [journeyId, trainId] = indexes.split('-').map(x => +x);
    let journey: StationStatus | undefined;
    if (journeys.journeys) {
        journey = journeys.journeys.find(x => x.index === journeyId);
    }
    if (!journey) {
        throw 'Invalid journey id';
    }
    let serviceId = '', from = '';
    if (journey && journey.services[trainId - 1]) {
        serviceId = journey.services[trainId - 1].id;
        from= journey.from;
    } else {
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
        const response: AxiosResponse = await axios.get(finalUrl);
        const journeyDetails: JourneyDetails = response.data;
        let status: string = `Train ${journeyDetails.scheduledAt} ${journeyDetails.operator} ${colors.cyan(`- Last checked ${journeyDetails.checkedAt}\n`)}`;
        const train = colors.rainbow(`[Tchou tchou]`);

        status += journeyDetails.callingPoints.map((callingPoint: CallingPoint) => {
            let callingPointInfo = `  ${callingPoint.station} - ${callingPoint.scheduledAt}`;
            if (callingPoint.isTrainHere && !callingPoint.hasDeparted) {
                callingPointInfo += ' - ' + train;
            }
            let callingPointStatus = '';
            if (callingPoint.hasDeparted) {
                callingPointStatus = colors.grey(callingPointInfo);
            } else {
                callingPointStatus = colors.white(callingPointInfo);
            }
            if (callingPoint.estimatedAt !== 'On time') {
                callingPointStatus += colors.yellow(` est. ${callingPoint.estimatedAt}`);
            }
            if (callingPoint.isTrainHere && callingPoint.hasDeparted) {
                callingPointStatus += '\n    ' + train;
            }
            return callingPointStatus;
        }).join('\n');
        console.log(status);
    } catch (error) {
        return null;
    }
}

async function main () {
    if (args[0] === 'save-journey') {
        SettingsService.saveJourney(args[1], args[2]);
    } else if (args[0] === 'search') {
        await searchStation(args[1]);
    } else if (args[0] === 'set-from') {
        await SettingsService.setFrom(args[1]);
        LoggerUtils.success({origin: 'train-checker', message: 'from station saved'});
    } else if (args[0] === 'set-to') {
        await SettingsService.setTo(args[1]);
        LoggerUtils.success({origin: 'train-checker', message: 'to station saved'});
    } else if (args[0] === 'clear') {
        FileUtils.deleteFolderRecursiveSync(path.resolve(__dirname, './temp'));
        LoggerUtils.success({origin: 'train-checker', message: 'Setting cleared'});
    } else if (args[0] === 'status') {
        if (FileUtils.checkIfFolderExists(path.resolve(__dirname, './temp/journeys.json'))) {
            FileUtils.deleteFileSync(path.resolve(__dirname, './temp/journeys.json'));
        }
        await status('departures');
        await status('arrivals');
        console.log('');
        console.log('To have details on one train, please call "train-status" <journey index>-<train index>');
    } else if (args[0] === 'train-status') {
        await getTrainDetails(args[1]);
    } else {
        const validOptions = [
            'save-journey',
            'search',
            'set-from',
            'set-to',
            'clear',
            'status',
            'train-status'
        ];
        LoggerUtils.info({
            origin: 'train-checker',
            message: `Invalid option provided. Valid options are :`
        });
        console.log(validOptions.map(x => `\t${x}`).join('\n'));
    }
}
main();