export declare class FileUtils {
    static getFileList(params: {
        startPath: string;
        foldersToIgnore?: string[];
        filter: RegExp;
    }): Promise<any>;
    static getFolderList(params: {
        startPath: string;
        foldersToIgnore?: string[];
    }): Promise<string[]>;
    static readFile(fileName: string): Promise<string>;
    static readFileSync(fileName: string): string;
    static writeFileSync(fileName: string, content: string): void;
    static readJsonFile(fileName: string): Promise<any>;
    static createFolderIfNotExistsSync(folderName: string): void;
    static checkIfFolderExists(folderName: string): boolean;
    static createFolderStructureIfNeeded(path: string, depth?: number): void;
    static renameFolder(from: string, to: string): Promise<any>;
    static copyFileSync(from: string, to: string): void;
    static deleteFileSync(fileName: string): void;
    /**
     * Deletes folders recursively
     * @param path folder path
     * @param sub (used for logging purpose only)
     */
    static deleteFolderRecursiveSync(path: string, sub?: boolean): void;
}
