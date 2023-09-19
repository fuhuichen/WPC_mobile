/**
 * Router flux component.
 */

import React, { Component } from 'react';
import { Router, Scene , Actions} from 'react-native-router-flux';
import {ToastAndroid,NativeModules,Platform} from 'react-native';
import { Provider } from 'mobx-react'
import I18n from 'react-native-i18n';

import Launcher from '../Launcher';
import VideoMonitor from '../monitor/VideoMonitor';
import CreateEvent from  '../monitor/CreateEvent';
import SubmitSuccess from '../monitor/SubmitSuccess';
import SubmitFailture from "../monitor/SubmitFailture";
import StoreCenter from '../monitor/StoreCenter';
import LoginScreen from '../login/LoginScreen';
import AccountList from '../login/AccountList';
import Welcome from '../login/Welcome';
import LocalCheck from '../check/LocalCheck';
import RemoteCheck from '../check/RemoteCheck';
import CreateCheckEvent from '../check/CreateCheckEvent';
import EventDetail from "../unuse/EventDetail";
import VideoPlayer from "../components/VideoPlayer";
import PictureViewer from "../components/PictureViewer";
import PDFViewer from "../components/PDFViewer";
import InspectSuccess from '../check/InspectSuccess';
import EventEnd from "../unuse/EventEnd";
import AttachEvent from '../monitor/AttachEvent';
import ForgetPwd from '../login/ForgetPwd';
import AddTip from "../customer/AddTip";
import InspectList from '../check/InspectList';
import InspectInfo from '../check/InspectInfo';
import RNExitApp from 'react-native-exit-app';
import ImageCanvas from '../components/ImageCanvas';
import InspectSummary from '../check/InspectSummary';
import ServiceList from "../login/ServiceList";
import MessageList from "../unuse/MessageList";
import store from "../../mobx/Store";
import AffairDetail from '../affair/AffairDetail';
import AuditList from  '../affair/AuditList';
import DataList from  '../affair/DataList';
import AffairSearch from  '../affair/Search'
import PageIndex from "../../data/src/pages/PageIndex";
import PageDetailReport from "../../data/src/pages/PageDetailReport";
import PageStoresCompare from "../../data/src/pages/PageStoresCompare";
import PageCustom from "../../data/src/pages/PageCustom";
import PageItem from "../../data/src/pages/PageItem";
import PageReturn from "../../data/src/pages/PageReturn";
import PageAbstract from "../../data/src/pages/PageAbstract";
import PageSettingTarget from "../../data/src/pages/PageSettingTarget";
import PageSetting from "../../data/src/pages/PageSetting";
import PageSettingStore from "../../data/src/pages/PageSettingStore";
import PageSettingPos from "../../data/src/pages/PageSettingPos";
import PageSettingWeight from "../../data/src/pages/PageSettingWeight";
import PageSettingAccount from "../../data/src/pages/PageSettingAccount";
import PageSettingPwd from "../../data/src/pages/PageSettingPwd";
import PageForgetPwd from "../../data/src/pages/PageForgetPwd";
import PageSettingLan from "../../data/src/pages/PageSettingLan";
import PageSettingURL from "../../data/src/pages/PageSettingURL";
import PageSettingPush from "../../data/src/pages/PageSettingPush";
import PageSettingAbout from "../../data/src/pages/PageSettingAbout";
import PageSettingInspection from "../../data/src/pages/PageSettingInspection";
//import JMessage from "../notification/JMessage";
import PatrolList from "../affair/PatrolList";
import SignCanvas from "../check/SignCanvas";
import Analysis from "../unuse/Index";
import CustomerList from "../customer/Customer";
import CustomerDetail from "../customer/CustomerDetail";
import Register from "../customer/Register";
import RegisterResult from "../customer/RegisteResult"
import RouteMgr from "../notification/RouteMgr";
import TimeCycle from "../customer/TimeCycle";
import FaceAnalyse from  "../customer/FaceAnalyse";
import Visitor from "../customer/Visitor";
import VisitorPage from "../customer/Index";
import CustomerAnalysis from "../unuse/CustomerAnalysis";
import SearchFilter from "../components/SearchFilter"
import Package from "../entities/Package";
import RecordVideo from "../components/RecordVideo";
import CreateCameraEvent from "../check/CreateCameraEvent";
import Patrol from "../inspection/Patrol";
import StoreDetail from "../store/StoreDetail";
import PatrolSummary from "../inspection/PatrolSummary";
import StoreSearch from "../store/StoreSearch";
import EventBus from "../common/EventBus";
import Feedback from "../inspection/Feedback";
import PatrolUnfinished from "../inspection/PatrolUnfinished";
import ReportList from "../report/ReportList";
import ReportDetail from "../report/ReportDetail";
import ReportFilter from "../report/ReportFilter";
import PatrolResult from "../inspection/PatrolResult";
import EditAnalysisPage from "../unuse/EditAnalysisPage"
import PhotoEditor from "../components/comment/PhotoEditor";
import EventSearch from "../event/EventSearch";
import EventList from "../event/EventList";
import EventFilter from "../event/EventFilter";
import Notification from "../notification/Notification";
import PatrolVideo from "../inspection/PatrolVideo";
import PatrolScorePage from "../analysis/charts/PatrolScorePage";
import EventRatePage from "../analysis/charts/EventRatePage";
import PatrolRatePage from "../analysis/charts/PatrolRatePage";
import StoreNotPatrol from "../analysis/charts/StoreNotPatrol";
import StoreEventTimes from "../analysis/charts/StoreEventTimes";
import StoreReportTimes from "../analysis/charts/StoreReportTimes";
import AnalysisFilter from "../analysis/AnalysisFilter";
import PatrolSearch from "../inspection/PatrolSearch";
import PageReview from "../approve/PageReview";
import PageOverview from "../approve/PageOverview";
import ApproveSearch from "../approve/ApproveSearch";
import EventAdd from "../event/EventAdd";
import ApproveRejectDetail from "../approve/ApproveRejectDetail";
import ScheduleFilter from "../schedule/ScheduleFilter";
import CashCheckLauncher from '../cashcheck/Launcher';
import CashCheckStoreFilter from "../cashcheck/store/StoreFilter";
import RecordFilter from "../cashcheck/record/RecordFilter";
import RecordDetail from "../cashcheck/record/RecordDetail";
import CashChecking from "../cashcheck/checking/CashChecking";
import CashCheckSummary from "../cashcheck/checking/CashCheckSummary";
import StoreFilter from "../store/StoreFilter";

let lastBackPressed = 0;
export default class RouterUtil extends Component {
    constructor(props){
        super(props);
        this.screens = [
            'customerList',
            'eventDetail',
            'messageList'
        ];
    }

    close(){
        //JMessage.close();
    }

    render() {
        return (
            <Provider store={store}>
                <Router backAndroidHandler={()=>{
                        if(Actions.state.index === 0) {
                            if(!store.userSelector.backDrawer){
                                   if ((lastBackPressed + 2000) >= Date.now()) {
                                          this.close();
                                          RNExitApp.exitApp();
                                          return false
                                      }
                                      ToastAndroid.show(Package.getBuildName(I18n.t('Exit app')), ToastAndroid.SHORT);
                                      lastBackPressed = Date.now();
                            }else{
                                   store.userSelector.backDrawer = false;
                            }
                        }else{
                            if(this.screens.findIndex(p => p === Actions.currentScene) !== -1){
                                RouteMgr.popRouter();
                            }else{
                                Actions.pop();
                            }
                        }
                        return true;
                }}>
                    <Scene key="root" headerMode='none'>
                        <Scene key="loginScreen"
                               component={LoginScreen}
                               hideNavBar={true}
                               initial={true}
                        />
                        <Scene key="homePage"
                               component={Launcher}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="accountList"
                               component={AccountList}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="welcome"
                               component={Welcome}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="videoMonitor"
                               component={VideoMonitor}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="createEvent"
                               component={CreateEvent}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="submitSuccess"
                               component={SubmitSuccess}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="submitFailture"
                               component={SubmitFailture}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="storeCenter"
                               component={StoreCenter}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="localCheck"
                               component={LocalCheck}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="remoteCheck"
                               component={RemoteCheck}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="eventDetail"
                               component={EventDetail}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="videoPlayer"
                               component={VideoPlayer}
                               hideNavBar={true}
                               initial={false}
                               onExit={()=>{
                                   EventBus.closePreview();
                               }}
                               panHandlers={Platform.select({ios:null,android:true})}
                        />
                        <Scene key="pictureViewer"
                               component={PictureViewer}
                               hideNavBar={true}
                               initial={false}
                               onExit={()=>{
                                   EventBus.closePreview();
                               }}
                               panHandlers={Platform.select({ios:null,android:true})}
                        />
                        <Scene key="pdfViewer"
                               component={PDFViewer}
                               hideNavBar={true}
                               initial={false}
                               onExit={()=>{
                                   EventBus.closePreview();
                               }}
                               panHandlers={Platform.select({ios:null,android:true})}
                        />
                        <Scene key="PhotoEditor"
                               component={PhotoEditor}
                               hideNavBar={true}
                               initial={false}
                               onExit={()=>{
                                   EventBus.closePhotoEditor();
                               }}
                        />
                        <Scene key="inspectSuccess"
                               component={InspectSuccess}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="eventEnd"
                               component={EventEnd}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="attachEvent"
                               component={AttachEvent}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="forgetPwd"
                               component={ForgetPwd}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="inspectList"
                               component={InspectList}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="inspectInfo"
                               component={InspectInfo}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="createCheckEvent"
                               component={CreateCheckEvent}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="imageCanvas"
                               component={ImageCanvas}
                               hideNavBar={true}
                               initial={false}
                               drawerLockMode='locked-closed'
                               gesturesEnabled={false}
                        />
                        <Scene key="inspectSummary"
                               component={InspectSummary}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="serviceList"
                               component={ServiceList}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="affairDetail"
                               component={AffairDetail}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="auditList"
                               component={AuditList}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="dataList"
                               component={DataList}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="affairSearch"
                               component={AffairSearch}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageIndex"
                               component={PageIndex}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageDetailReport"
                               component={PageDetailReport}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageStoresCompare"
                               component={PageStoresCompare}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageCustom"
                               component={PageCustom}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageItem"
                               component={PageItem}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageReturn"
                               component={PageReturn}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageAbstract"
                               component={PageAbstract}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageSettingTarget"
                               component={PageSettingTarget}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageSetting"
                               component={PageSetting}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageSettingStore"
                               component={PageSettingStore}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageSettingPos"
                               component={PageSettingPos}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageSettingWeight"
                               component={PageSettingWeight}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageSettingAccount"
                               component={PageSettingAccount}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageSettingPwd"
                               component={PageSettingPwd}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageForgetPwd"
                               component={PageForgetPwd}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageSettingLan"
                               component={PageSettingLan}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageSettingURL"
                               component={PageSettingURL}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageSettingPush"
                               component={PageSettingPush}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageSettingAbout"
                               component={PageSettingAbout}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageSettingInspection"
                               component={PageSettingInspection}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="patrolList"
                               component={PatrolList}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="signCanvas"
                               component={SignCanvas}
                               hideNavBar={true}
                               initial={false}
                               panHandlers={Platform.select({ios:null,android:true})}
                        />
                        <Scene key="analysis"
                               component={Analysis}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="messageList"
                               component={MessageList}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="addTip"
                               component={AddTip}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="customerList"
                               component={CustomerList}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="customerDetail"
                               component={CustomerDetail}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="register"
                               component={Register}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="registerResult"
                               component={RegisterResult}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="timeCycle"
                               component={TimeCycle}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="faceAnalyse"
                               component={FaceAnalyse}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="visitorPage"
                               component={VisitorPage}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="visitor"
                               component={Visitor}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="customerAnalysis"
                               component={CustomerAnalysis}
                               hideNavBar={true}
                               initial={false}
                        />
                         <Scene key="searchFilter"
                                component={SearchFilter}
                                hideNavBar={true}
                                initial={false}
                        />
                        <Scene key="recordVideo"
                                component={RecordVideo}
                                hideNavBar={true}
                                initial={false}
                        />
                       <Scene key="createCameraEvent"
                                component={CreateCameraEvent}
                                hideNavBar={true}
                                initial={false}
                        />
                        <Scene key="patrol"
                               component={Patrol}
                               hideNavBar={true}
                               initial={false}
                               onExit={()=>{EventBus.closePopupPatrol()}}
                               panHandlers={Platform.select({ios:null, android:true})}
                        />
                        <Scene key="storeDetail"
                               component={StoreDetail}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="patrolSummary"
                               component={PatrolSummary}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="storeSearch"
                               component={StoreSearch}
                               hideNavBar={true}
                               initial={false}
                               onExit={()=>{EventBus.closePopupStore()}}
                        />
                        <Scene key="feedback"
                               component={Feedback}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="patrolUnfinished"
                               component={PatrolUnfinished}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="reportList"
                               component={ReportList}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="reportDetail"
                               component={ReportDetail}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="reportFilter"
                               component={ReportFilter}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="patrolResult"
                               component={PatrolResult}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="editAnalysis"
                               component={EditAnalysisPage}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="eventSearch"
                               component={EventSearch}
                               hideNavBar={true}
                               initial={false}
                               onExit={()=>{EventBus.closePopupEvent()}}
                        />
                        <Scene key="eventList"
                               component={EventList}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="eventFilter"
                               component={EventFilter}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="notification"
                               component={Notification}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="patrolVideo"
                               component={PatrolVideo}
                               hideNavBar={true}
                               initial={false}
                               panHandlers={Platform.select({ios:null,android:true})}
                        />
                        <Scene key="patrolScore"
                               component={PatrolScorePage}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="patrolRate"
                               component={PatrolRatePage}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="eventRate"
                               component={EventRatePage}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="storeUnPatrol"
                               component={StoreNotPatrol}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="storeReportTimes"
                               component={StoreReportTimes}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="storeEventTimes"
                               component={StoreEventTimes}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="analysisFilter"
                               component={AnalysisFilter}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="patrolSearch"
                               component={PatrolSearch}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageReview"
                               component={PageReview}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="pageOverview"
                               component={PageOverview}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="approveSearch"
                               component={ApproveSearch}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="eventAdd"
                               component={EventAdd}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="ApproveRejectDetail"
                               component={ApproveRejectDetail}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="scheduleFilter"
                               component={ScheduleFilter}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="cashcheckhomePage"
                               component={CashCheckLauncher}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="cashcheckStorefilter"
                               component={CashCheckStoreFilter}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="cashcheckRecordfilter"
                               component={RecordFilter}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="recordDetail"
                               component={RecordDetail}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="cashchecking"
                               component={CashChecking}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="cashcheckSummary"
                               component={CashCheckSummary}
                               hideNavBar={true}
                               initial={false}
                        />
                        <Scene key="Storefilter"
                               component={StoreFilter}
                               hideNavBar={true}
                               initial={false}
                        />
                    </Scene>
                </Router>
            </Provider>
        );
    }
}
