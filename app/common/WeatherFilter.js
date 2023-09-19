import {Environment} from '../../environments/Environment';
import I18n from "react-native-i18n";

export function getWeatherIconUrl(weatherType) {
    let url = '', icon = 'unknown.png';
    switch(weatherType) {
        case 100:
        case 102:
            icon = 'sunny_day.png';
        break;
        case 150:
        case 152:
            icon = 'sunny_night.png';
        break;
        case 101:
        case 103:
            icon = 'cloudy_day.png';
        break;
        case 151:
        case 153:
            icon = 'cloudy_night.png';
        break;
        case 104:
        case 154:
            icon = 'overcast.png';
        break;
        case 307:
        case 300:
        case 301:
        case 305:
        case 306:
        case 308:
        case 309:
        case 311:
        case 312:
        case 313:
        case 314:
        case 315:
        case 316:
        case 317:
        case 318:
        case 350:
        case 351:
        case 399:
            icon = 'shower.png';
        break;
        case 302:
        case 303:
            icon = 'thunder_storm.png';
        break;
        case 402:
        case 400:
        case 401:
        case 403:
        case 404:
        case 405:
        case 406:
        case 407:
        case 408:
        case 409:
        case 410:
        case 456:
        case 457:
        case 499:
            icon = 'snow.png';
        break;
        case 501:
        case 500:
        case 509:
        case 510:
        case 514:
        case 515:
            icon = 'frost.png';
        break;
        case 502:
        case 511:
        case 512:
        case 513:
            icon = 'smog.png';
        break;
        case 507:
        case 503:
        case 504:
        case 508:
            icon = 'sand_dust.png';
        break;
        case 900:
            icon = 'hot.png';
        break;
        case 901:
            icon = 'cold.png';
        break;
        case 999:
            icon = 'unknown.png';
        break;
    }
    url = Environment.onWebSite().replace('/api/','') + '/weather/' + icon;
    return url;
}

export function getWeatherList() {
    let weatherList = [];
    weatherList.push({weatherType: 100, iconUrl: Environment.onWebSite().replace('/api/','') + '/weather/sunny_day.png', name: I18n.t('Sunny day')});
    weatherList.push({weatherType: 150, iconUrl: Environment.onWebSite().replace('/api/','') + '/weather/sunny_night.png', name: I18n.t('Sunny night')});
    weatherList.push({weatherType: 101, iconUrl: Environment.onWebSite().replace('/api/','') + '/weather/cloudy_day.png', name: I18n.t('Cloud day')});
    weatherList.push({weatherType: 151, iconUrl: Environment.onWebSite().replace('/api/','') + '/weather/cloudy_night.png', name: I18n.t('Cloud night')});
    weatherList.push({weatherType: 104, iconUrl: Environment.onWebSite().replace('/api/','') + '/weather/overcast.png', name: I18n.t('Overcast')});
    weatherList.push({weatherType: 307, iconUrl: Environment.onWebSite().replace('/api/','') + '/weather/shower.png', name: I18n.t('Shower')});
    weatherList.push({weatherType: 302, iconUrl: Environment.onWebSite().replace('/api/','') + '/weather/thunder_storm.png', name: I18n.t('Thunderstorm')});
    weatherList.push({weatherType: 402, iconUrl: Environment.onWebSite().replace('/api/','') + '/weather/snow.png', name: I18n.t('Snow')});
    weatherList.push({weatherType: 501, iconUrl: Environment.onWebSite().replace('/api/','') + '/weather/frost.png', name: I18n.t('Frost')});
    weatherList.push({weatherType: 502, iconUrl: Environment.onWebSite().replace('/api/','') + '/weather/smog.png', name: I18n.t('Smog')});
    weatherList.push({weatherType: 507, iconUrl: Environment.onWebSite().replace('/api/','') + '/weather/sand_dust.png', name: I18n.t('Sand dust')});
    weatherList.push({weatherType: 900, iconUrl: Environment.onWebSite().replace('/api/','') + '/weather/hot.png', name: I18n.t('Hot')});
    weatherList.push({weatherType: 901, iconUrl: Environment.onWebSite().replace('/api/','') + '/weather/cold.png', name: I18n.t('Cold')});
    return weatherList;
}