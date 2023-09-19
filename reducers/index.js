import {combineReducers} from 'redux'
import StoreListReducer from './StoreListReducer'
import LoadingReducer from './LoadingReducer'
import LoginInfoReducer from './LoginInfoReducer'
import CcmFilterReducer from './CcmFilterReducer'
export default combineReducers( {
  storeList: StoreListReducer,
  loading:LoadingReducer,
  loginInfo: LoginInfoReducer,
  ccmFilter:CcmFilterReducer,
});
