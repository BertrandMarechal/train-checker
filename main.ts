import axios, { AxiosResponse } from 'axios';
import colors from 'colors';
import { FileUtils } from './utils/file.utils';
import path from 'path';
import { LoggerUtils } from './utils/logger.utils';
import { TrainlineResponse, JourneyDetails, LocationSerachResult } from './models/trainline.model';
import { SettingsService, Settings } from './classes/settings';

const [,,...args] = process.argv;

const url = 'https://www.thetrainline.com/live/api/trains';

// https://www.thetrainline.com/api/locations-pot/search?searchTerm=brig&lang=en&scopes=atoconly%2Ceurostaronly%2Csncf%2Cbenerail%2Ctrenitalia%2Crenfe%2Cntv%2Cbusbud%2Cflixbus%2Cdbfull&size=30&country=GB&locationType=station%2CstationGroup%2Ccity

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
            console.log(`Trains ${mode} from ${stations.from} to ${stations.to}:`);
            const response = await getStationStatus(stations.from, stations.to, mode);

            if (response.hasTrains && response.data && response.data.services && response.data.services.length > 0) {
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
                const trainsStatuses = response.data.services.map(service => {
                    let returnString = `  ${service.due} : ${service.origin}${service.destination ? (' -> ' + service.destination) : ''} : `;
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
            } else {
                console.log('  No trains '.yellow);
            }
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
        return {hasTrains: true, data: response.data};
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
async function getTrainDetails(serviceId: string): Promise<JourneyDetails | null> {
    try {
        const finalUrl = [
            url,
            'action=details',
            'isDepartures=true',
            'selectedStationCode=EUS',
            `serviceId=${serviceId}`
        ].join(';');
        const response: AxiosResponse = await axios.get(finalUrl);
        return response.data;
    } catch (error) {
        return null;
    }
}

async function main () {
    if (args[0] === 'save-journey') {
        SettingsService.saveJourney(args[1], args[2]);
    } else if (args[0] === 'search') {
        searchStation(args[1]);
    } else if (args[0] === 'clear') {
        FileUtils.deleteFolderRecursiveSync(path.resolve(__dirname, './temp'));
    } else if (args[0] === 'status') {
        FileUtils.deleteFolderRecursiveSync(path.resolve(__dirname, './temp'));
    } else {
        await status('arrivals');
        await status('departures');
    }
}
main();