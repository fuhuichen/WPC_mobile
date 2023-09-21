import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";


import en from '../../app/locales/en.json';
import zhCN from '../../app/locales/zh-CN.json';
import zhTW from '../../app/locales/zh-TW.json';

var mylanguage = 'en';
export default class LangUtil{
    static getLanguage(){
        return mylanguage;
    }

    static checkLanguage(lan){
      if (lan.includes('zh-TW') || lan.includes('zh-Hant-TW')){
         return 'zh-TW';
      }
      else if (lan.includes('zh')){
           return 'zh-CN';
      }
      return 'en';
    }

    static async init(){
        i18n.use(Backend)
            .use(initReactI18next)
            .init({
                compatibilityJSON: 'v3',
                resources: {
                    'zh-TW': {
                        'translation': zhTW
                    },
                    'zh-CN': {
                        'translation': zhCN
                    },
                    'en': {
                        'translation': en
                    }
                },
                /*backend: {
                    //網頁載入時去下載語言檔的位置
                    loadPath: "../../app/locales/{{lng}}.json",
                },*/
                // 當目前的語言檔找不到對應的字詞時，會用 fallbackLng (zh-TW) 作為預設語言
                fallbackLng: "zh-TW",
                // 預設語言
                lng: "zh-TW",
                interpolation: {
                   // 是否要讓字詞 escaped 來防止 xss 攻擊，這裡因為 React.js 已經做了，就設成 false即可
                   escapeValue: false,
                }
            })
    }

    static getStringByKey(key){
        return i18n.t(key);
    }

    static async changeAppLocale(locale){
        let transLocale = this.checkLanguage(locale);
        i18n.changeLanguage(transLocale);
        mylanguage = transLocale;
    }
}
