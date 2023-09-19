import React from 'react';
import {DeviceEventEmitter} from "react-native";
import {
   CLOSE_OPTION_SELECTOR,
   CLOSE_POPUP_PATROL,
   CLOSE_POPUP_STORE,
   UPDATE_BASE_PATROL,
   UPDATE_PATROL_DATA,
   UPDATE_PATROL_UNFINISHED,
   CLOSE_PREVIEW,
   UPDATE_PATROL_CACHE,
   REFRESH_STORE_INFO,
   REFRESH_STORE_DETAIL,
   UPDATE_BASE_STORE,
   CLOSE_PHOTEDITOR,
   REFRESH_TEMPORARY_REPORT,
   CLOSE_POPUP_EVENT, REFRESH_EVENT_INFO, REFRESH_NOTIFICATION, REFRESH_ANALYSIS_INFO,
   REFRESH_APPROVE_INFO, REFRESH_APPROVE_PAGE,
   REFRESH_STORE_LIST,
   REFRESH_SCHEDULE_INFO,
   UPDATE_BASE_CASHCHECK,
   UPDATE_CASHCHECK_CACHE,
   REFRESH_CASHCHECK_RECORD_LIST
} from "./Constant";

export default class EventBus{
   static closeModalAll(){
      this.closePopupStore();
      this.closePopupPatrol();
      this.closeOptionSelector();

      this.closePopupEvent();
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

   static closePopupEvent(){
      DeviceEventEmitter.emit(CLOSE_POPUP_EVENT);
   }

   static updatePatrolData(){
      DeviceEventEmitter.emit(UPDATE_PATROL_DATA);
   }

   static updatePatrolUnfinished(){
      DeviceEventEmitter.emit(UPDATE_PATROL_UNFINISHED);
   }

   static updateBaseStore(){
      DeviceEventEmitter.emit(UPDATE_BASE_STORE);
   }

   static updateBasePatrol(cache = true){
      DeviceEventEmitter.emit(UPDATE_BASE_PATROL, cache);
   }

   static updateBaseCashCheck(cache = true){
      DeviceEventEmitter.emit(UPDATE_BASE_CASHCHECK, cache);
   }

   static closePreview(){
      DeviceEventEmitter.emit(CLOSE_PREVIEW);
   }

   static updatePatrolCache(){
      DeviceEventEmitter.emit(UPDATE_PATROL_CACHE);
   }

   static updateCashCheckCache(){
      DeviceEventEmitter.emit(UPDATE_CASHCHECK_CACHE);
   }

   static refreshTemporary(){
      DeviceEventEmitter.emit(REFRESH_TEMPORARY_REPORT);
   }

   static refreshStoreInfo(){
      DeviceEventEmitter.emit(REFRESH_STORE_INFO);
   }

   static refreshStoreDetail(){
      DeviceEventEmitter.emit(REFRESH_STORE_DETAIL);
   }

   static closePhotoEditor(){
      DeviceEventEmitter.emit(CLOSE_PHOTEDITOR);
   }

   static refreshEventInfo(){
      DeviceEventEmitter.emit(REFRESH_EVENT_INFO);
   }

   static refreshNotification(){
      DeviceEventEmitter.emit(REFRESH_NOTIFICATION);
   }

   static refreshAnalysisInfo(){
      DeviceEventEmitter.emit(REFRESH_ANALYSIS_INFO);
   }

   static refreshApproveInfo(){
      DeviceEventEmitter.emit(REFRESH_APPROVE_INFO);
   }

   static refreshApprovePage(){
      DeviceEventEmitter.emit(REFRESH_APPROVE_PAGE);
   }

   static refreshStoreList(){
      DeviceEventEmitter.emit(REFRESH_STORE_LIST);
   }

   static refreshScheduleInfo(){
      DeviceEventEmitter.emit(REFRESH_SCHEDULE_INFO);
   }

   static refreshCashCheckRecordList(){
      DeviceEventEmitter.emit(REFRESH_CASHCHECK_RECORD_LIST);
   }
}
