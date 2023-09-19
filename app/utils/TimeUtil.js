import I18n from 'react-native-i18n';
import PhoneInfo from "../entities/PhoneInfo";
import moment from "moment";

export default class TimeUtil {
    constructor(props) {
        this.state = {

        }
    }

    static getNowDay() {
        let start = moment().startOf('day').unix()*1000;
        let end = moment().endOf('day').unix()*1000;
        return [start, end];
    }

    static getTime(unixTime){
        if (unixTime == null){
            return null;
        }
        let diffTime = new Date().getTime() - unixTime;
        if (diffTime <= 3600000 && diffTime > 0){
            let minutesBefore = Math.floor(diffTime/60000);
            if (minutesBefore > 0){
                return minutesBefore + I18n.t('Minutes ago');
            }
            else {
                let secondsBefore = Math.ceil(diffTime/1000);
                return secondsBefore + I18n.t('Seconds ago');
            }
        }
        else {
            return this.getFullTime(unixTime);
        }
    }

    static getFullTime(unixTime){
        let date = new Date(unixTime);
        let y = date.getFullYear();
        let m = date.getMonth() + 1;
        m = m < 10 ? ('0' + m) : m;
        let d = date.getDate();
        d = d < 10 ? ('0' + d) : d;
        let h = date.getHours();
        h = h < 10 ? ('0' + h) : h;
        let minute = date.getMinutes();
        let second = date.getSeconds();
        minute = minute < 10 ? ('0' + minute) : minute;
        second = second < 10 ? ('0' + second) : second;
        return y+'/'+m+'/'+d+' '+' '+h+':'+minute;
    }

    static getCurrentDate(ts){
        let date = ts !== undefined ? new Date(ts) : new Date();
        let y = date.getFullYear();
        let m = date.getMonth() + 1;
        m = m < 10 ? ('0' + m) : m;
        let d = date.getDate();
        d = d < 10 ? ('0' + d) : d;
        let result = ts !== undefined ? (y+'/'+m+'/'+d) : (y+'-'+m+'-'+d);
        return result;
    }

    static getDetailTime(ts, fullWeek = false){
        let date = new Date(ts);
        let y = date.getFullYear();
        let m = date.getMonth() + 1;
        m = m < 10 ? ('0' + m) : m;
        let d = date.getDate();
        d = d < 10 ? ('0' + d) : d;
        let h = date.getHours();
        h = h < 10 ? ('0' + h) : h;
        let weeks = fullWeek ? [I18n.t('Sun'),I18n.t('Mon'),I18n.t('Tue'),I18n.t('Wed'),I18n.t('Thur'),I18n.t('Fri'),I18n.t('Sat')]
            : [I18n.t('SunDay'),I18n.t('MonDay'),I18n.t('TueDay'),I18n.t('WedDay'),I18n.t('ThurDay'),I18n.t('FriDay'),I18n.t('SatDay')];
        let w = date.getDay();
        w = weeks[w];
        let minute = date.getMinutes();
        let second = date.getSeconds();
        minute = minute < 10 ? ('0' + minute) : minute;
        second = second < 10 ? ('0' + second) : second;
        let year = y.toString().slice(2);
        return [
            year+'/'+m+'/'+d,
            h+':'+minute,
            m+'/'+d,
            y+'/'+m+'/'+d,
            h+':'+minute+':'+second,
            w + ' ' + h+':'+minute,
            w
        ]
    }

    static getThreeMonths(e) {
        const timeOne = new Date(e);
        let year = timeOne.getFullYear();
        const month = timeOne.getMonth() + 1;
        let day = timeOne.getDate();
        const hours = timeOne.getHours();
        const minutes = timeOne.getMinutes();
        const seconds = timeOne.getSeconds();
        // three month ago
        let ThreeMonths = month - 3;
        if (ThreeMonths <= 0) { year = year - 1; }
        if (ThreeMonths === -2) { ThreeMonths = 10; }
        if (ThreeMonths === -1) { ThreeMonths = 11; }
        if (ThreeMonths === 0) { ThreeMonths = 12; }
        const timeTow = new Date(year, ThreeMonths, 0, hours, minutes, seconds);
        const ThreeMonthsDay = timeTow.getDate();
        if (day > ThreeMonthsDay) { day = ThreeMonthsDay; }
        day = day < 10 ? '0' + day : day;
        const THREE_MONTHS_AGO = `${year}/${ThreeMonths}/${day} 00:00:00`;
        const THREE_STAMP = new Date(THREE_MONTHS_AGO).getTime();
        return THREE_STAMP;
      }
}
