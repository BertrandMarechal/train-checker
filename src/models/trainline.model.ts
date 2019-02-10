export type TrainStatus = 'On time' | 'Cancelled' | 'Delayed';

export interface TrainlineResponse {
    hasTrains: boolean;
    data?: StationStatus
}

export interface StationStatus {
    lastChecked: Date,
    from: string,
    to: string,
    index: number;
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
export interface CallingPoint {
    station: string;
    isOrigin: boolean;
    isDestination: boolean;
    estimatedAt: TrainStatus;
    scheduledAt: string;
    isSelected: boolean;
    isTrainHere: boolean;
    hasDeparted: boolean;
}

export interface JourneyDetails {
    checkedAt: string;
    operator: string;
    scheduledAt: string;
    callingPoints: CallingPoint[];
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