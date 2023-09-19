/**
 * Reference: react-native-status-bar-color
 */
import {
    StatusBar,
    Platform,
    Dimensions
} from 'react-native';
import {isIphoneX,getStatusBarHeight,getBottomSpace} from "react-native-iphone-x-helper";
const {width, height} = Dimensions.get('window');

export function statusBarHeight(){
    let height = 0;

    if(Platform.OS === 'ios'){
        height = isIphoneX() ? getStatusBarHeight() : 20;
    }

    return height;
}

export function isAndroid() {
    if(Platform.OS === 'ios') {
        return false;
    }

    return true;
}

export function defaultStatusHeight() {
    let height = StatusBar.currentHeight;

    if(Platform.OS === 'ios'){
        height = isIphoneX() ? getStatusBarHeight() : 20;
    }

    return height;
}

export function dashVideoHeight() {
    return 200;
}

export function defaultBottomSpace() {
    return isIphoneX() ? getBottomSpace() : 0;
}

export function defaultMarginTop() {
    return isIphoneX() ? 36 : 50;
}

/**
 * Login screen
 */
export function defaultLogoMargin() {
    return (height <= 604) ? (85-defaultStatusHeight()) : (110-defaultStatusHeight());
}

export function defaultLoginMargin() {
    return (height <= 604) ? 50 : 85
}

export function defaultOffsetY() {
    return (height <=604) ? 372 : 432;
}

export function paddingHorizontal() {
    return (width <= 360) ? 16 : 24
}
