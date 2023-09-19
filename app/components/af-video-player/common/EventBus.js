import React from 'react';
import {DeviceEventEmitter} from "react-native";
import {
    CLOSE_OPTION_SELECTOR,
    CLOSE_POPUP_PATROL,
    CLOSE_POPUP_STORE, UPDATE_BASE_PATROL,
    UPDATE_PATROL_DATA,
    UPDATE_PATROL_UNFINISHED,
    CLOSE_PREVIEW, UPDATE_PATROL_CACHE,
} from "./Constant";

export default class EventBus{
   static closeModalAll(){
       this.closePopupStore();
       this.closePopupPatrol();
       this.closeOptionSelector();
   }

   static closeModalStore(){
       this.closePopupStore();
       this.closeOptionSelector();
   }

   static closePopupStore(){
       DeviceEventEmitter.emit(CLOSE_POPUP_STORE);
   }

   static closePopupPatrol(){
       DeviceEventEmitter.emit(CLOSE_POPUP_PATROL);
   }

   static closeOptionSelector(){
       DeviceEventEmitter.emit(CLOSE_OPTION_SELECTOR);
   }

    static updatePatrolData(){
        DeviceEventEmitter.emit(UPDATE_PATROL_DATA);
    }

   static updatePatrolUnfinished(){
       DeviceEventEmitter.emit(UPDATE_PATROL_UNFINISHED);
   }

   static updateBasePatrol(){
       DeviceEventEmitter.emit(UPDATE_BASE_PATROL);
   }

   static closePreview(){
       DeviceEventEmitter.emit(CLOSE_PREVIEW);
   }

   static updatePatrolCache(){
       DeviceEventEmitter.emit(UPDATE_PATROL_CACHE);
   }
}
