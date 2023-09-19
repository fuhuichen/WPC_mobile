import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import UshopRestClient from '../utils/webclient';
import DialogHandler from '../utils/DialogHandler'
import {Dimensions, Keyboard, Platform, ScrollView, View, Text,DeviceEventEmitter} from 'react-native';
import UTitleBarText from '../components/UTitleBar'
import PosRestClient from '../utils/posclient'
import SettingInput from '../components/SettingInputEx'
import SettingSelect from '../components/SettingSelectEx'
import DataHandler from '../utils/DataHandler'
import moment from 'moment'
import Spinner from '../components/Spinner';

import {inject, observer} from 'mobx-react'
import {Actions} from "react-native-router-flux";
import Navigation from "../../../app/element/Navigation";
import {ColorStyles} from "../../../app/common/ColorStyles";
import PhoneInfo from '../../../app/entities/PhoneInfo';

@inject('store')
@observer
export default class PageSettingWeight extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    var stores = []
    var storeIndex=-1;
    const tempReportStore = this.props.store.storeSelector.tempReportStoreBI;
    const storeList = this.props.store.storeSelector.storeListBI.slice();
    if(storeList) {
      for(var k in storeList) {
        var item = {
          store_id:storeList[k].store_id,
          name:storeList[k].store_name,
          store_name:storeList[k].store_name,
          descr:storeList[k].descr,
          country:storeList[k].country,
          province:storeList[k].province,
          city:storeList[k].city,
          address:storeList[k].address,
          tel:storeList[k].tel,
          extension: (storeList[k].extension && storeList[k].extension.weight) ? storeList[k].extension : {
      			weight: {
      				revenue: "20",
      				turninrate: "20",
      				visitors: "20",
      				transactions: "20",
      				revenuepertransaction: "20"
      			}
          },
          index:k,
        }
        stores.push(item);
        if(tempReportStore && storeList[k].store_id == tempReportStore.store_id) {
          storeIndex = k;
        }
      }
    }
    this.state = {
      loading:false,
      stores,
      storeIndex,
      revenue: (stores[storeIndex] ? stores[storeIndex].extension.weight.revenue : '20'),
      revenuepertransaction: (stores[storeIndex] ? stores[storeIndex].extension.weight.revenuepertransaction : '20'),
      transactions: (stores[storeIndex] ? stores[storeIndex].extension.weight.transactions : '20'),
      turninrate: (stores[storeIndex] ? stores[storeIndex].extension.weight.turninrate : '20'),
      visitors: (stores[storeIndex] ? stores[storeIndex].extension.weight.visitors : '20')
    };
  }

  componentDidMount() {
    //DeviceEventEmitter.emit('onStatusBar', '#24293d');
  }

  componentWillUnmount() {
    //DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_BACKGROUND_BLUE);
  }

  onTextInput(){

  }

  doSave(){
    Keyboard.dismiss();
    if(this.checkWeightCountError()) { return; }
    var des = I18n.t("bi_confirm_modify")
    const screen = Dimensions.get('window')
    DialogHandler.openConfirmDialog(screen.width-100, '', des, this, {type:'next'});
  }

  onChangeStore(){
    var stores ={ index:this.state.storeIndex, list:this.state.stores };
    const screen = Dimensions.get('window');
    DialogHandler.openStoresDialog(screen.width-40, I18n.t('Store select'), stores, this, {type:'store'});
  }

  onNextPressed(param) {
    const {stores} = this.state;
    if(param.type=='next') {
      this.updateStoreWeight();
    } else if(param.type=='store') {
      this.setState({
        storeIndex: param.index,
        revenue: (stores[param.index] ? stores[param.index].extension.weight.revenue : '20'),
        revenuepertransaction: (stores[param.index] ? stores[param.index].extension.weight.revenuepertransaction : '20'),
        transactions: (stores[param.index] ? stores[param.index].extension.weight.transactions : '20'),
        turninrate: (stores[param.index] ? stores[param.index].extension.weight.turninrate : '20'),
        visitors: (stores[param.index] ? stores[param.index].extension.weight.visitors : '20')
      });
    }
  }

  updateStoreWeight(){
    const {stores,storeIndex,revenue,revenuepertransaction,transactions,turninrate,visitors} = this.state;
    var selectStore = stores[storeIndex];
    selectStore.extension.weight.revenue = revenue;
    selectStore.extension.weight.revenuepertransaction = revenuepertransaction;
    selectStore.extension.weight.transactions = transactions;
    selectStore.extension.weight.turninrate = turninrate;
    selectStore.extension.weight.visitors = visitors;
    var req ={
      user_id : this.props.store.userSelector.userId,
      token : this.props.store.userSelector.token,
      store : selectStore
    };
    const api = new UshopRestClient();
    this.setState({loading:true});
    api.updateStore(req).then(response => response)   // Successfully logged in
        .then(response=> this.onStoreUpdateSuccess(response))    // Remember your credentials
        .catch(err => this.onStoreUpdateFail(err.message));  // Catch any error
  }

  onStoreUpdateSuccess(response) {
    this.setState({loading:false});
    if(response.status==1 ) {
      Actions.pop();
    }
  }

  onStoreUpdateFail(msg) {
    this.setState({loading:false});
    Actions.pop();
    console.log("updateStore Fail " + msg );
  }

  checkInteger(v){
    var pv = parseInt(v);
    if(pv) return pv + '';
    return '';
  }

  checkWeightCountError() {
    const {revenue,revenuepertransaction,transactions,turninrate,visitors} = this.state;
    if( parseInt(revenue) +
        parseInt(revenuepertransaction) +
        parseInt(transactions) +
        parseInt(turninrate) +
        parseInt(visitors) == 100) {
      return false;
    } else {
      return true;
    }
  }

  render(){
    const {stores,storeIndex} = this.state;
    const smallPhone= this.props.store.phoneSelector.smallPhone;
    var titleWidth = (I18n.locale == 'en') ? 80 : 50;
    const screen = Dimensions.get('window');
    
    let fontSize = 14, marginTop = 6;
    screen.width <= 360 && (fontSize = 13);
    PhoneInfo.isVNLanguage() && (fontSize = 10);
    PhoneInfo.isVNLanguage() && (marginTop = 8);
    let titleStyle = {
        fontSize:fontSize,
        marginTop: Platform.select({
            ios: marginTop,
            android: marginTop
        })
    }
    return (
      <View style={{paddingTop:0,
        backgroundColor:VALUES.COLORMAP.dkk_background,
        height:screen.height,width:screen.width}}>
          <Navigation
                    onLeftButtonPress={()=>Actions.pop()}
                    title={I18n.t("bi_abastract_kpi_setup")}
                    titleStyle={titleStyle}
                    rightButtonTitle={I18n.t('Save')}
                    onRightButtonPress={()=>{this.doSave()}}
          />
        <ScrollView style={{marginBottom:50}}>
          <SettingSelect title={I18n.t("Select Store")} unit={''} onPress={()=>this.onChangeStore()} value={stores[storeIndex].store_name}/>
          <SettingInput title={I18n.t("bi_sale_values")} unit={I18n.t('Points')}
            titleWidth={titleWidth}
            keyboardType={'numeric'}
            onTextInput={(v)=>this.onTextInput({v})}
            onChangeText={(revenue)=>this.setState({revenue:this.checkInteger(revenue)})}
            value={this.state.revenue}/>
          <SettingInput title={I18n.t("bi_people_single_buy")} unit={I18n.t('Points')}
            titleWidth={titleWidth}
            keyboardType={'numeric'}
            onTextInput={(v)=>this.onTextInput({v})}
            onChangeText={(revenuepertransaction)=>this.setState({revenuepertransaction:this.checkInteger(revenuepertransaction)})}
            value={this.state.revenuepertransaction}/>
          <SettingInput title={I18n.t("bi_shopper_count")} unit={I18n.t('Points')}
            titleWidth={titleWidth}
            keyboardType={'numeric'}
            onTextInput={(v)=>this.onTextInput({v})}
            onChangeText={(transactions)=>this.setState({transactions:this.checkInteger(transactions)})}
            value={this.state.transactions}/>
          <SettingInput title={I18n.t("bi_people_in")} unit={I18n.t('Points')}
            titleWidth={titleWidth}
            keyboardType={'numeric'}
            onTextInput={(v)=>this.onTextInput({v})}
            onChangeText={(visitors)=>this.setState({visitors:this.checkInteger(visitors)})}
            value={this.state.visitors}/>
          <SettingInput title={I18n.t("bi_turnin_rate")} unit={I18n.t('Points')}
            titleWidth={titleWidth}
            keyboardType={'numeric'}
            onTextInput={(v)=>this.onTextInput({v})}
            onChangeText={(turninrate)=>this.setState({turninrate:this.checkInteger(turninrate)})}
            value={this.state.turninrate}/>
          {this.checkWeightCountError() ? <Text style={{textAlign:'right',marginRight:12,fontSize:12,color:VALUES.COLORMAP.deadline_red}}>
            {I18n.t(I18n.t("bi_5rules"))}
          </Text> : null}
        </ScrollView >
        <Spinner visible={this.state.loading} />
      </View>
    )
  }
}
