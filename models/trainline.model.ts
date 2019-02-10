export type TrainStatus = 'On time' | 'Cancelled' | 'Delayed';

export interface TrainlineResponse {
    hasTrains: boolean;
    data?: StationStatus
}

export interface StationStatus {
    lastChecked: Date,
    services: {
        id: string;
        due: string
        expected: TrainStatus;
        platform: string;
        operator: string;
        destination: string;
        origin: string
    }[];
}

export interface JourneyDetails {
    checkedAt: string;
    operator: string;
    scheduledAt: string;
    callingPoints: {
        station: string;
        isOrigin: boolean;
        isDestination: boolean;
        estimatedAt: TrainStatus;
        scheduledAt: string;
        isSelected: boolean;
        isTrainHere: boolean;
    }[];
}

export interface Location {
    code: string;
    longitude: number;
    latitude: number;
    defaultLanguage: string;
    locationType: string;
    name: string;
    shortName: string;
    aliases: string[];
    id: string;
    city: string;
    cityLocal: string;
    scopes: string[];
    countryCode: string;
    properties: any[];
}
export interface LocationSerachResult {
    requestedCountry: Location[];
    restOfTheWorld: Location[];
    createdAt: number;
}