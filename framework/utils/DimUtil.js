
import {Platform,StatusBar,Dimensions} from "react-native";
const screen = Dimensions.get('screen')
const height = (screen.width>screen.height?screen.height:screen.width);
const isLarge =  height >= 375?true:false;
let deviceH = Dimensions.get('screen').height;
let windowH = Dimensions.get('window').height;
let bottomNavBarH = deviceH - windowH;
export default class DimUtil{
    static isLarge(){
  //       console.log("Device Height"+height)
        return isLarge;
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

    //  console.log("DimUtl="+screen.width,screen.height,StatusBar.hidden,StatusBar.currentHeight)
      if(type=='landscape'){
        let width = (screen.width>screen.height?screen.width:screen.height) - (StatusBar.hidden?0:StatusBar.currentHeight);
        let height = (screen.width>screen.height?screen.height:screen.width);
        return {width:width,height}
      }
      else{
        let  height = (screen.width>screen.height?screen.width:screen.height) - (StatusBar.hidden?0:StatusBar.currentHeight) ;
        let  width = (screen.width>screen.height?screen.height:screen.width);
        return {width:width,height}
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

      //console.log("BottomNav="+bottomNavBarH)
      return (Platform.OS == 'android')?(bottomNavBarH>60?0:bottomNavBarH==48?24:bottomNavBarH):30;
    }
}
