import PhoneInfo from "./PhoneInfo";
import {Environment} from "../../environments/Environment";

export default class Package {
    static defaultName = 'StoreVue';
    static replaceName = '店看看';

    static getBuildName(name){
        if (!Environment.isGlobal() && PhoneInfo.isCNLanguage()){
            name = name.replace(this.defaultName, this.replaceName);
        }

        return name;
    }
}
