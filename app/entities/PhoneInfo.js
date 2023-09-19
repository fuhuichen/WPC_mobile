import {AsyncStorage} from "react-native";
import I18n from "react-native-i18n";
import {LocaleConfig} from "react-native-calendars";
import * as RNLocalize from "react-native-localize";
import StringLocal from "../../data/src/utils/StringLocal";

/**
 * Phone information.
 */

export default class PhoneInfo{
    static language = 'en';

    static getLanguage(){
        return this.language;
    }

    static isEnLanguage(){
        return this.language.includes('en');
    }

    static isCNLanguage(){
        return this.language.includes('zh-CN');
    }

    static isJALanguage(){
        return this.language.includes('ja');
    }

    static isKOLanguage(){
        return this.language.includes('ko');
    }

    static isIDLanguage(){
        return this.language.includes('id');
    }

    static isTHLanguage(){
        return this.language.includes('th');
    }

    static isVNLanguage(){
        return this.language.includes('vn');
    }

    static isJAKOLanguage(){
        return (this.isJALanguage() || this.isKOLanguage())
    }

    static isSimpleLanguage(){
        return (this.isEnLanguage() || this.isJALanguage() || this.isKOLanguage()) ? false : true;
    }
    static isLongLanguage(){
        //console.log(this.isEnLanguage(),this.isIDLanguage() ,this.isTHLanguage(),this.isVNLanguage())
        return (this.isEnLanguage() || this.isIDLanguage() || this.isTHLanguage()|| this.isVNLanguage()) ? true :false;
    }

    static checkLanguage(lan){
        if (lan.includes('zh')){
            if(lan.includes('CN') || lan.includes('Hans')){
               return 'zh-CN';
            }
            else{
               return 'zh-TW';
            }
        }
        else if (lan.includes('ja')){
            return 'ja';
        }
        else if (lan.includes('ko')){
            return 'ko';
        }
        else if (lan.includes('vn')){
            return 'vn';
        }
        else if (lan.includes('id')){
            return 'id';
        }
        else if (lan.includes('th')){
            return 'th';
        }
        return 'en';
    }

    static async setAppLocale(){
        let locale = I18n.locale;
        let getLocal = await AsyncStorage.getItem('language');
        if( getLocal != null){
            locale = JSON.parse(getLocal);
        }
        let transLocale = this.checkLanguage(locale);
        console.log('************ locale set ' + transLocale);
        I18n.locale = transLocale;
        this.language = transLocale;
        StringLocal.setLanguage(transLocale);
        this.setDefaultLocal();
    }

    static setSystemLocale(){
        let nowlocale = RNLocalize.getLocales()[0].languageTag;
        let transLocale = this.checkLanguage(nowlocale);
        if (transLocale == this.language){
            return false;
        }
        else{
            I18n.locale = transLocale;
            this.language = transLocale;
            StringLocal.setLanguage(transLocale);
            this.setDefaultLocal();
            return true;
        }
    }

    static getLocale(){
        let lan = this.language;
        if (lan == 'en'){
            return 'en-US';
        }
        else if (lan == 'ja'){
            return 'ja-JP';
        }
        else if (lan == 'ko'){
            return 'ko-KR';
        }
        return lan;
    }

    static setDefaultLocal(){
        let monthNames = ['Jan.', 'Feb.', 'Mar', 'Apr.', 'May.', 'Jun', 'Jul.', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
        let dayNames = [I18n.t('SunDay'),I18n.t('MonDay'),I18n.t('TueDay'),I18n.t('WedDay'),I18n.t('ThurDay'),I18n.t('FriDay'),I18n.t('SatDay')];
        LocaleConfig.locales['en'] = {
            monthNames: monthNames,
            monthNamesShort: monthNames,
            dayNames: dayNames,
            dayNamesShort: dayNames
        };
        LocaleConfig.defaultLocale = 'en';
    }
}
