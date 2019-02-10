"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class FileUtils {
    static getFileList(params) {
        const foldersToIgnore = params.foldersToIgnore || ['node_modules'];
        if (foldersToIgnore) {
            if (foldersToIgnore.indexOf('node_modules') === -1) {
                foldersToIgnore.push('node_modules');
            }
        }
        if (!fs.existsSync(params.startPath)) {
            console.log(params.startPath + ' does not exist');
            return Promise.resolve([]);
        }
        else {
            let fileNames = fs.readdirSync(params.startPath);
            let directories = fileNames.filter((x) => {
                let fileName = path.join(params.startPath, x);
                let stat = fs.lstatSync(fileName);
                if (stat.isDirectory()) {
                    return foldersToIgnore.filter(y => fileName.indexOf(y) > -1).length === 0;
                }
                return false;
            });
            let files = fileNames.filter((x) => {
                let fileName = path.join(params.startPath, x);
                let stat = fs.lstatSync(fileName);
                return !stat.isDirectory() && params.filter.test(fileName);
            });
            if (directories.length > 0) {
                return Promise.all(directories.map((x) => {
                    return FileUtils.getFileList({ startPath: params.startPath + '/' + x, filter: params.filter, foldersToIgnore: foldersToIgnore });
                })).then((fileLists) => {
                    let fileList = fileLists.reduce((current, item) => {
                        current = current.concat(item);
                        return current;
                    }, []);
                    fileList = fileList.concat(files.map((x) => params.startPath + '/' + x));
                    return new Promise((resolve) => {
                        resolve(fileList);
                    });
                });
            }
            else {
                return new Promise((resolve) => {
                    resolve(files.map((x) => params.startPath + '/' + x));
                });
            }
        }
    }
    static getFolderList(params) {
        const foldersToIgnore = params.foldersToIgnore || ['node_modules'];
        if (foldersToIgnore) {
            if (foldersToIgnore.indexOf('node_modules') === -1) {
                foldersToIgnore.push('node_modules');
            }
        }
        if (!fs.existsSync(params.startPath)) {
            console.log(params.startPath + ' does not exist');
            return Promise.resolve([]);
        }
        else {
            let fileNames = fs.readdirSync(params.startPath);
            let directories = fileNames.filter((x) => {
                let fileName = path.join(params.startPath, x);
                let stat = fs.lstatSync(fileName);
                if (stat.isDirectory()) {
                    return foldersToIgnore.filter(y => fileName.indexOf(y) > -1).length === 0;
                }
                return false;
            });
            return Promise.resolve(directories.map(x => params.startPath + '/' + x));
        }
    }
    static readFile(fileName) {
        return new Promise((resolve, reject) => {
            fs.readFile(fileName, (error, data) => {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                else {
                    resolve(data.toString('ascii'));
                }
            });
        });
    }
    static readFileSync(fileName) {
        return fs.readFileSync(fileName).toString('ascii');
    }
    static writeFileSync(fileName, content) {
        FileUtils.createFolderStructureIfNeeded(fileName);
        fs.writeFileSync(fileName, content);
    }
    static readJsonFile(fileName) {
        return new Promise((resolve, reject) => {
            fs.readFile(fileName, (error, data) => {
                if (error) {
                    reject(error);
                }
                else {
                    try {
                        resolve(JSON.parse(data.toString('ascii')));
                    }
                    catch (error) {
                        console.log(fileName);
                        reject(error);
                    }
                }
            });
        });
    }
    static createFolderIfNotExistsSync(folderName) {
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName);
        }
    }
    static checkIfFolderExists(folderName) {
        return fs.existsSync(folderName);
    }
    static createFolderStructureIfNeeded(path, depth = 0) {
        const splitPath = path.replace('//', '/').split('/');
        if (depth === splitPath.length - 1) {
            return;
        }
        else {
            FileUtils.createFolderIfNotExistsSync(splitPath.splice(0, depth + 1).join('/'));
            FileUtils.createFolderStructureIfNeeded(path, depth + 1);
        }
    }
    static renameFolder(from, to) {
        return new Promise((resolve, reject) => {
            fs.rename(from, to, (error) => {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    static copyFileSync(from, to) {
        const source = FileUtils.readFileSync(from);
        FileUtils.writeFileSync(to, source);
    }
    static deleteFileSync(fileName) {
        fs.unlinkSync(fileName);
    }
    /**
     * Deletes folders recursively
     * @param path folder path
     * @param sub (used for logging purpose only)
     */
    static deleteFolderRecursiveSync(path, sub = false) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach((file) => {
                const curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    FileUtils.deleteFolderRecursiveSync(curPath, true);
                }
                else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }
    ;
}
exports.FileUtils = FileUtils;
