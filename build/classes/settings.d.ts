export interface Settings {
    journeys?: {
        from: string;
        to: string;
    }[];
    from?: string;
    to?: string;
}
export declare class SettingsService {
    static saveJourney(from: string, to: string): Promise<void>;
    static getSettings(): Promise<Settings>;
    static setFrom(from: string): Promise<void>;
    static setTo(to: string): Promise<void>;
}
