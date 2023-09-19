import I18n from "react-native-i18n";

export default class GroupInfo{
    static groups = null;

    static get(id){
        this.groups = [
            {
                name: I18n.t('Member'),
                color: '#f58323'
            },
            {
                name: I18n.t('VIP'),
                color: '#f8bc1c'
            },
            {
                name: I18n.t('Black list'),
                color: '#444c5f'
            },
            {
                name: I18n.t('Employee'),
                color: '#6097f4'
            }
        ];

        return (id != null) ? this.groups[id] : this.groups[0];
    }

}