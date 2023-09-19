import {combineReducers} from 'redux'
import SelectionReducer from './SelectionReducer'
import PageListReducer from './PageListReducer'
import PageSelectionReducer from './PageSelectionReducer'
import WidgetListReducer from './WidgetListReducer'
import AccessTokenReducer from './AccessTokenReducer'
import ServerAddressReducer from './ServerAddressReducer'
import KPIWidgetReducer from './KPIWidgetReducer'
import DateSelectReducer from './DateSelectReducer'
import UserIdReducer from './UserIdReducer'
import UserInfoReducer from './UserInfoReducer'
import StoreListReducer from './StoreListReducer'
import SelectedStoreSettingReducer from './SelectedStoreSettingReducer'
import TempStoreSettingReducer from './TempStoreSettingReducer'
import CompareTimeReducer from './CompareTimeReducer'
import SelectedStoreListReducer from './SelectedStoreListReducer'
import LastPageReducer from './LastPageReducer'
import ComparationReducer from './ComparationReducer'
import LoginInfoReducer  from './LoginInfoReducer'
import SmallPhoneReducer from './SmallPhoneReducer'
import TempReportStoreReducer from './TempReportStoreReducer'
import AccountListReducer  from './AccountListReducer'
import NotifyInfoReducer from './NotifyInfoReducer'
export default combineReducers( {
  widgetList : WidgetListReducer,
  selectedLibraryId : SelectionReducer,
  pageList : PageListReducer,
  currentPage : PageSelectionReducer,
  token : AccessTokenReducer,
  userId : UserIdReducer,
  userInfo: UserInfoReducer,
  kaiWidget: KPIWidgetReducer,
  tempReportStore:TempReportStoreReducer,
  date: DateSelectReducer,
  storeList: StoreListReducer,
  selectedStoreList : SelectedStoreListReducer,
  compareTime:CompareTimeReducer,
  selectedStoreSetting:SelectedStoreSettingReducer,
  tempStoreSetting:TempStoreSettingReducer,
  lastPage : LastPageReducer,
  compareSetting : ComparationReducer,
  loginInfo: LoginInfoReducer,
  serverAddress:ServerAddressReducer,
  smallPhone:SmallPhoneReducer,
  accountList:AccountListReducer,
  notifyInfo:NotifyInfoReducer,
});
