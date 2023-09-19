import compareVersions from 'compare-versions';
import {Environment} from '../../environments/Environment';

export default class VersionUtil {
    static data  = null;

    static setVersion(data){
        this.data = data;
    }

    static compare(newVer){
        let result = -1;
        try {
            let currentVer = Environment.APP_VERSION;
            if (this.isBeta(currentVer)){
                if (this.isBeta(newVer)){
                    let currentVerSplit  = currentVer.split('_');
                    let newVerSplit = newVer.split('_');
                    let versionCheck = compareVersions(newVerSplit[0].toLowerCase(),currentVerSplit[0].toLowerCase());
                    if (versionCheck === 1){
                        result = 1;
                    }
                    else if (versionCheck === 0){
                        result = (newVerSplit[1] > currentVerSplit[1] ? 1: -1);
                    }
                }
            }
            else {
               if (!this.isBeta(newVer)){
                   result = compareVersions(newVer.toLowerCase(),currentVer.toLowerCase());
               }
            }
        }
        catch (e) {

        }
        return result;
    }

    static isBeta(version){
        return version.endsWith('Beta');
    }
}
