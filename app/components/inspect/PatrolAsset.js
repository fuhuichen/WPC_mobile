import I18n from "react-native-i18n";

export default class PatrolAsset {
    static status = null;
    static mode = null;

    static getStatus(){
        this.status = [
            I18n.t('Dangerous'),
            I18n.t('Improve'),
            I18n.t('Good')
        ];

        return this.status;
    }

    static getMode(){
        this.mode = [
            I18n.t('Remote patrol'),
            I18n.t('Onsite patrol')
        ];

        return this.mode;
    }
}
