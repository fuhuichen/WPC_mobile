import AsyncStorage from '@react-native-async-storage/async-storage';
import I18n from "react-native-i18n";
/*
import en from './locales/en';
import zhCN from './locales/zh-CN';
import zhTW from './locales/zh-TW';
*/
var   mylanguage = 'zh-TW';
export default class LangUtil{
    static getLanguage(){
        return mylanguage;
    }
    static checkLanguage(lan){
      console.log(" checkLanguage="+lan)
      if (lan.includes('zh-TW') || lan.includes('zh-Hant-TW')){
         return 'zh-TW';
      }
      else if (lan.includes('zh')){
           return 'zh-CN';
      }
      else if (lan=="ja"){
           return 'ja';
      }
      return 'en';
    }
    static async init(langs){
        I18n.fallbacks = true;
        I18n.translations = langs;
        let locale = I18n.locale;
        let currenLang = await AsyncStorage.getItem('language');
        if(currenLang){
          locale = currenLang;
        }
        let transLocale = this.checkLanguage(locale);
        I18n.locale = transLocale;
        mylanguage = transLocale;
        await AsyncStorage.setItem('language',transLocale);
        console.log("Set Lang Init "+transLocale)
    }
    static  getStringByKey(key){
        //console.log("Local="+I18n.locale+ " " + I18n.t(key))
        return I18n.t(key);
    }
    static async changeAppLocale(locale){
        console.log("Change Languae to"+locale)
        let transLocale = this.checkLanguage(locale);
        console.log("Change Languae to"+transLocale)
        await AsyncStorage.setItem('language',transLocale);
        I18n.locale = transLocale;
        mylanguage = transLocale;
    }
}
