import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView
} from 'react-native';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {AppContainer,
        PageContainer,
        Header,Container,
        Selection,
        Typography,
        Tab,
        BottomNav,
        IconButton,
        DataInput,
        COLORS,
        NormalButton} from '../../../framework'
import {LangUtil,StorageUtil,FilterUtil} from '../../../framework'
import { DeviceEventEmitter} from 'react-native';
import CcmAPI from "../../api/ccm"
import MainAPI  from "../../api/main"
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES,DEVICE_TYPES} from  "../../define"
import BottomNavigation from "../../components/BottomNavigation"
import SensorItem from '../../components/SensorItem'
import DeviceItem from '../../components/DeviceItem'
class PageDeviceAdd extends Component {
  constructor(props) {
    super(props);
    let  deviceType = null;
    this.state={
      events:[],
      probers:[],
      sensors:[],
      devices:[],
      isSensor:true,
      deviceType,
      deviceName:"",
      deviceSerial:"",
      deviceNo:"",
      store:{},
      dialog:null
    }
  }

  componentWillUnmount() {

  }
  async componentDidMount() {

    await this.fetchData()
    DeviceEventEmitter.addListener("DEVICE_TYPE_CHANGE", async(event)=>{
      this.setState({deviceType:event.deviceType,deviceSerial:"",deviceNo:""})
    })
    DeviceEventEmitter.addListener("DEVICE_CHANGE_INFO", async(event)=>{
      this.setState(event)
    })

  }
  async fetchData(ccmFilter){
    if(!ccmFilter){
      ccmFilter = this.props.ccmFilter;
    }
    const {loginInfo,storeList} = this.props;
    const {device} = ccmFilter.cache ;
    this.props.setLoading(true);
    let sensors=[];
    let devices =[];
    let mms = []
    let stores  = [];
    console.log("Store List")
    let r  = await MainAPI.getStoreList();
    if(r.status == ERROR_CODE.SUCCESS){
      console.log(r)
      stores = r.stores;
    }
    let st = stores.find(p=>p.store_id == device.store)
    this.setState({store:st})
    this.props.setLoading(false);

  }
  async showBrandSelect(){
    const {navigation} = this.props;
    navigation.push(PAGES.BRAND_SELECT)
  }
  async next(){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {deviceType,deviceName,deviceSerial,deviceNo,store} = this.state;
    //const {store} = route.params;
    console.log(store)
    if(deviceNo == deviceSerial){
      let dialog = {title:LangUtil.getStringByKey("service_need_add_title")
      ,msg1:"",msg2: LangUtil.getStringByKey("same_sn_deviceid")}
      this.setState({dialog})
      return;
    }
    var data ={
       product_sn:deviceSerial ,device_id:deviceNo,register_key:store.register_key,
       model_name:deviceType.model,device_name:deviceName ,name:deviceName}
    console.log(data)
    let result = await MainAPI.addDeviceTo(data);
    console.log(result)
    if(result.status == ERROR_CODE.SUCCESS){
      DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_adddev_success"),type:'success'})
      DeviceEventEmitter.emit("FILTER_STORE_CHANGE",{ccmFilter})
      navigation.pop(1)
    }
    else{
      DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_adddev_fail"),type:'error'})
    }

  }
  getRegion2Name(list ){
    if(!list)return null;
    let names = [];
    for(var k in list){
      names = names.concat(list[k])
    }

    return names;
  }
  doNameChange(e){
    this.setState({deviceName:e})
  }
  onlyAlphabets(t){
    var regexp = new RegExp(/^[a-zA-Z0-9 ]*$/);
    return regexp.test(t);
  }
  doSerialChange(text){
    const {deviceType,deviceName,deviceSerial,deviceNo} = this.state;
    var limitSN =  deviceType.limitSN;
    if(this.onlyAlphabets(text) &&  text.length<=limitSN){
      this.setState({deviceSerial:text.trim().toUpperCase()})
    }
  //(text)=>{if(this.onlyAlphabets(text))this.setState({snInputError:text.length<limitSN?true:false,productSN:text.trim().toUpperCase()})}

  }
  canSend(){
    const {deviceType,deviceName,deviceSerial,deviceNo} = this.state;
    if(!deviceType){
      return false;
    }
    var limitSN =  deviceType.limitSN;
    var limitID =  deviceType.limitID
    //console.log(deviceName)

    if(deviceName.length==0){
      //console.log("Fail Device Name="+ deviceName)
      return false;
    }
    //console.log("SN="+deviceSerial.length + "/" + limitSN)
    if(deviceSerial.length!=limitSN){
        return false;
    }

    console.log("ID="+deviceNo.length+ "/" + limitID)
    if(deviceNo.length !=limitID){
      return false;
    }
    return true;
  }
  doIDChange(text){
    const {deviceType,deviceName,deviceSerial,deviceNo} = this.state;
    var limitID =  deviceType.sepScan?deviceType.category=='s'?16:12:16;
    if(this.onlyAlphabets(text) &&  text.length<=limitID){
      this.setState({deviceNo:text.trim().toUpperCase()})
    }
  }
  render(){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {mode} = route.params;
    const {isSensor,sensors,devices} = this.state;
    const {deviceType,deviceName,deviceSerial,deviceNo,dialog} = this.state;
    let probers  = isSensor?sensors:devices;
    let filterData = probers;
    var limitSN =  deviceType? deviceType.limitSN :0;
    var limitID =  deviceType? deviceType.limitID : 0;
    var isLeoSensor = deviceType?deviceType.isLeoSensor:false
    return ( <PageContainer
                dialog={dialog}
                onCloseDialog={()=>this.setState({dialog:null})}
                introduction={this.state.introduction}
                onCloseIntroduction={()=>this.setState({introduction:null})}
                navigation={this.props.navigation}
                isHeader={true}>
                <Header
                  leftIcon={"header-back"}
                  onLeftPressed={()=>{navigation.pop(1)}}
                  text={LangUtil.getStringByKey("device_add")}
                />
                <KeyboardAvoidingView
                   behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                   style={{flex:1}}>
                <Container
                    fullwidth
                    scrollable
                    style={{marginTop:20}}
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}>
                    <Container
                          justifyContent={"flex-start"}
                          alignItems={"flex-start"}
                          flexDirection={'row'}
                        >
                        <Typography
                              style={{marginBottom:2}}
                              font={"subtitle04"}
                              text={LangUtil.getStringByKey("device_type")}
                              color='black'/>
                        <Typography
                              style={{marginBottom:2}}
                              font={"subtitle04"}
                              text={"*"}
                              color='error'/>
                    </Container>
                    <Selection
                              text={deviceType?deviceType.displayName:""}
                              onPress={async()=>{navigation.push(PAGES.DEVICE_ADD_LIST,{mode:0,deviceType})}}
                              hint={LangUtil.getStringByKey("common_please_select")}/>
                    <Container       style={{marginTop:20}}
                                    justifyContent={"flex-start"}
                                    alignItems={"flex-start"}
                                    flexDirection={'row'}>
                        <Typography
                          style={{marginBottom:2}}
                          font={"subtitle04"}
                          text={LangUtil.getStringByKey("device_custom_name")}
                          color='black'/>
                        <Typography
                          style={{marginBottom:2}}
                          font={"subtitle04"}
                          text={"*"}
                          color='error'/>
                    </Container>
                    <DataInput
                      placeholder={LangUtil.getStringByKey("common_input_hint")}
                      onChangeText={this.doNameChange.bind(this)}
                      style={{marginBottom:7}}
                      limit={20}
                      value={deviceName}/>
                    {deviceType&&!deviceType.sepScan?<NormalButton
                          style={{marginTop:20,backgroundColor:"white",
                          borderWidth:1,borderColor:COLORS.PRIMARY_BLUE}}
                          color="primary"
                          onPress={async()=>{navigation.push(PAGES.DEVICE_SCAN,{deviceType,mode:1,limitSN:limitSN, limitID:limitID  })}}
                          text={LangUtil.getStringByKey("device_scan_code")}/>:null}
                    <Container
                            style={{marginTop:30}}
                            justifyContent={"flex-start"}
                            alignItems={"flex-start"}
                            flexDirection={'row'}>
                              <Typography
                                style={{marginBottom:2}}
                                font={"subtitle04"}
                                text={LangUtil.getStringByKey("device_product_serial")}
                                color='black'/>
                              <Typography
                                style={{marginBottom:2}}
                                font={"subtitle04"}
                                text={"*"}
                                color='error'/>
                          </Container>
                          <DataInput
                            alert={deviceSerial.length>0 && deviceSerial.length<limitSN}
                            onPress={async()=>{navigation.push(PAGES.DEVICE_SCAN,{deviceType,mode:2,limit:limitSN})}}
                            mode={deviceType&&deviceType.sepScan?"scan":"default"}
                            placeholder={LangUtil.getStringByKey("common_input_hint")}
                            onChangeText={this.doSerialChange.bind(this)}
                            disabled={!deviceType}
                            style={{marginBottom:0}}
                            value={deviceSerial}/>
                            <Typography
                              style={{marginBottom:7,marginTop:2,marginLeft:10}}
                              font={"content04"}
                              text={!deviceType?"":(LangUtil.getStringByKey("device_input_desc").replace("{1}",limitSN))}
                              color='black'/>
                          <Container
                                            style={{marginTop:20}}
                                            justifyContent={"flex-start"}
                                            alignItems={"flex-start"}
                                            flexDirection={'row'}>
                                              <Typography
                                                style={{marginBottom:2}}
                                                font={"subtitle04"}
                                                text={isLeoSensor?LangUtil.getStringByKey("device_id_leo"):LangUtil.getStringByKey("device_id")}
                                                color='black'/>
                                              <Typography
                                                style={{marginBottom:2}}
                                                font={"subtitle04"}
                                                text={"*"}
                                                color='error'/>
                          </Container>
                          <DataInput
                            onPress={async()=>{navigation.push(PAGES.DEVICE_SCAN,{deviceType,mode:3,limit:limitID})}}
                            mode={deviceType&&deviceType.sepScan?"scan":"default"}
                            alert={deviceNo.length>0&& deviceNo.length<limitID}
                            placeholder={LangUtil.getStringByKey("common_input_hint")}
                            onChangeText={this.doIDChange.bind(this)}
                            disabled={!deviceType}
                            value={deviceNo}/>
                            <Typography
                              style={{marginBottom:7,marginTop:2,marginLeft:10}}
                              font={"content04"}
                              text={!deviceType?"":(LangUtil.getStringByKey("device_input_desc").replace("{1}",limitID))}
                              color='black'/>
                </Container>
                </KeyboardAvoidingView>
                <NormalButton
                  disabled={!this.canSend()}
                  style={{marginBottom:1}}
                  onPress={async()=>{await this.next()}}
                  text={LangUtil.getStringByKey("common_send")}/>

             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageDeviceAdd);
