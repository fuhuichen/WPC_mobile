
import {Platform,StatusBar,Dimensions} from "react-native";
const screen = Dimensions.get('screen')
const height = (screen.width>screen.height?screen.height:screen.width);
const isLarge =  height >= 375?true:false;
const STATUSBAR_DEFAULT_HEIGHT = 20;
const STATUSBAR_X_HEIGHT = 44;
const STATUSBAR_IP12_HEIGHT = 47;
const STATUSBAR_IP12MAX_HEIGHT = 47;
const STATUSBAR_IP14PRO_HEIGHT = 49;

const X_WIDTH = 375;
const X_HEIGHT = 812;

const XSMAX_WIDTH = 414;
const XSMAX_HEIGHT = 896;

const IP12_WIDTH = 390;
const IP12_HEIGHT = 844;

const IP12MAX_WIDTH = 428;
const IP12MAX_HEIGHT = 926;

const IP14PRO_WIDTH = 393;
const IP14PRO_HEIGHT = 852;

const IP14PROMAX_WIDTH = 430;
const IP14PROMAX_HEIGHT = 932;

const {height: W_HEIGHT, width: W_WIDTH} = Dimensions.get('window');

let statusBarHeight = STATUSBAR_DEFAULT_HEIGHT;

if (Platform.OS === 'ios' && !Platform.isPad && !Platform.isTVOS) {
  if (W_WIDTH === X_WIDTH && W_HEIGHT === X_HEIGHT) {
    statusBarHeight = STATUSBAR_X_HEIGHT;
  } else if (W_WIDTH === XSMAX_WIDTH && W_HEIGHT === XSMAX_HEIGHT) {
    statusBarHeight = STATUSBAR_X_HEIGHT;
  } else if (W_WIDTH === IP12_WIDTH && W_HEIGHT === IP12_HEIGHT) {
    statusBarHeight = STATUSBAR_IP12_HEIGHT;
  } else if (W_WIDTH === IP12MAX_WIDTH && W_HEIGHT === IP12MAX_HEIGHT) {
    statusBarHeight = STATUSBAR_IP12MAX_HEIGHT;
  } else if (W_WIDTH === IP14PROMAX_WIDTH && W_HEIGHT === IP14PROMAX_HEIGHT) {
    statusBarHeight = STATUSBAR_IP14PRO_HEIGHT;
  } else if (W_WIDTH === IP14PRO_WIDTH && W_HEIGHT === IP14PRO_HEIGHT) {
    statusBarHeight = STATUSBAR_IP14PRO_HEIGHT;
  }
}


export default class DimUtil{
    static isLarge(){
  //       console.log("Device Height"+height)
        return isLarge;
    }
    static getStatusBarHeight() {
      return Platform.select({
        ios: statusBarHeight,
        android: StatusBar.currentHeight,
        default: 0,
      });
    }
    static getDimensions(type){
      let width,height;
      if(Platform.OS == 'android'){
        const screen = Dimensions.get('window')

        //  console.log("DimUtl="+screen.width,screen.height,StatusBar.hidden,StatusBar.currentHeight)
        if(type=='landscape'){
          let width = (screen.width>screen.height?screen.width:screen.height)
          let height = (screen.width>screen.height?screen.height:screen.width);
          return {width:width,height}
        }
        else{
          let  height = (screen.width>screen.height?screen.width:screen.height)
          let  width = (screen.width>screen.height?screen.height:screen.width);
          return {width:width,height}
        }


      }
      const screen = Dimensions.get('screen')

     console.log("DimUtl="+screen.width,screen.height,StatusBar.hidden,StatusBar.currentHeight)
      if(type=='landscape'){
        let width = (screen.width>screen.height?screen.width:screen.height) -this.getStatusBarHeight() ;
        let height = (screen.width>screen.height?screen.height:screen.width);
        return {width:width,height:height}
      }
      else{
        console.log("StatusBar.currentHeight="+StatusBar.currentHeight)
        let  height = (screen.width>screen.height?screen.width:screen.height)-this.getStatusBarHeight() ; ;
        let  width = (screen.width>screen.height?screen.height:screen.width);
        return {width:width,height:height}
      }
    }
    static isWide(){
      const screen = Dimensions.get('screen')
      let width = (screen.width>screen.height?screen.width:screen.height);
      let height = (screen.width>screen.height?screen.height:screen.width);
      return (width/height)>2
    }
    static isPad(){
      return Platform.isPad;
    }
    static isIphoneX(){
      const dimen = Dimensions.get('window');
      return (
       Platform.OS === 'ios' &&
       !Platform.isPad &&
       !Platform.isTVOS &&
       (dimen.height === 780 ||
         dimen.width === 780 ||
         dimen.height === 812 ||
         dimen.width === 812 ||
         dimen.height === 844 ||
         dimen.width === 844 ||
         dimen.height === 896 ||
         dimen.width === 896 ||
         dimen.height === 926 ||
         dimen.width === 926)
      );
    }
    static isMini(){
      const screen = Dimensions.get('screen')
      let height = (screen.width>screen.height?screen.width:screen.height);
      return (height<=667)
    }
    static isPlusMax(){
      const screen = Dimensions.get('screen')
    //  console.log('--> width: '+screen.width+', height: '+screen.height);
      let width = (screen.width>screen.height?screen.height:screen.width);
  //    console.log('--> width: '+width);
      return (width>=414)
    }
    static isMax(){
      const screen = Dimensions.get('screen')
    //  console.log('--> width: '+screen.width+', height: '+screen.height);
      let width = (screen.width>screen.height?screen.height:screen.width);
  //    console.log('--> width: '+width);
      return (width>414)
    }
    static hasNotch() {
      let w = (screen.width>screen.height?screen.height:screen.width);
      let h = (screen.width>screen.height?screen.width:screen.height);
      return (w==375&&h==812)||(w>=390&&h>736);
    }
    static hasIslandNotch() {
      let w = (screen.width>screen.height?screen.height:screen.width);
      let h = (screen.width>screen.height?screen.width:screen.height);
      return ((w==393&&h==852)||(w==430&&h==932));
    }
    static isDisplay375x667() {
      let w = (screen.width>screen.height?screen.height:screen.width);
      let h = (screen.width>screen.height?screen.width:screen.height);
      return (w<=375&&h<=667);
    }
    static isDisplay375x812() {
      let w = (screen.width>screen.height?screen.height:screen.width);
      let h = (screen.width>screen.height?screen.width:screen.height);
      return (w<=375&&h<=812);
    }
    static isDisplay390x844() {
      let w = (screen.width>screen.height?screen.height:screen.width);
      let h = (screen.width>screen.height?screen.width:screen.height);
      return (w<=390&&h<=844);
    }
    static isDisplay393x852() {
      let w = (screen.width>screen.height?screen.height:screen.width);
      let h = (screen.width>screen.height?screen.width:screen.height);
      return (w<=393&&h<=852);
    }
    static isDisplay414x736() {
      let w = (screen.width>screen.height?screen.height:screen.width);
      let h = (screen.width>screen.height?screen.width:screen.height);
      return (w<=414&&h<=736);
    }
    static isDisplay414x896() {
      let w = (screen.width>screen.height?screen.height:screen.width);
      let h = (screen.width>screen.height?screen.width:screen.height);
      return (w<=414&&h<=896);
    }
    static isDisplay428x926() {
      let w = (screen.width>screen.height?screen.height:screen.width);
      let h = (screen.width>screen.height?screen.width:screen.height);
      return (w<=428&&h<=926);
    }
    static isDisplay430x932() {
      let w = (screen.width>screen.height?screen.height:screen.width);
      let h = (screen.width>screen.height?screen.width:screen.height);
      return (w<=430&&h<=932);
    }
    static getTopPadding(){
      return Platform.OS === 'ios'?this.isIphoneX()?36:25:0;
    }
    static getBottomPadding(){
      return (Platform.OS == 'android')?20:30;
    }
}
