import {NativeModules,ToastAndroid,Platform} from 'react-native';

var RCTToastAndroid = Platform.OS === 'android' ? ToastAndroid : NativeModules.LRDRCTSimpleToast;

var SimpleToast = {
    // Toast duration constants
    SHORT: RCTToastAndroid.SHORT,
    LONG: RCTToastAndroid.LONG,

    // Toast gravity constants
    TOP: RCTToastAndroid.TOP,
    BOTTOM: RCTToastAndroid.BOTTOM,
    CENTER: RCTToastAndroid.CENTER,


    show: function (message, duration) {
        if (this.timer != null && this.message === message){
        }
        else {
            this.timer = setTimeout(() => {
                this.timer && clearTimeout(this.timer);
                this.timer = null;
            }, 5000);
            this.message = message;
            RCTToastAndroid.show(message, duration === undefined ? this.SHORT : duration);
        }
    },

    showWithGravity: function (message, duration, gravity) {
        if (this.timer != null && this.message === message){
        }
        else {
            this.timer = setTimeout(() => {
                this.timer && clearTimeout(this.timer);
                this.timer = null;
            }, 5000);
            this.message = message;
            RCTToastAndroid.showWithGravity(message, duration === undefined ? this.SHORT : duration, gravity);
        }
    },
};

export default SimpleToast;
