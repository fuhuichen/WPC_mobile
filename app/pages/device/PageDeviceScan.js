import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity
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
        LineChart,
        DimUtil,
        Icon,
        TouchCard,
        NormalButton} from '../../../framework'
import {LangUtil,StorageUtil} from '../../../framework'
import { RNCamera } from 'react-native-camera';
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES} from  "../../define"
import BottomNavigation from "../../components/BottomNavigation"
import { DeviceEventEmitter,ScrollView} from 'react-native';
import CcmAPI from '../../api/ccm'
import moment from 'moment'
import DataTable from '../../components/DataTable'
import QRCodeScanner from 'react-native-qrcode-scanner';
import Slider from '@react-native-community/slider';
class PageEventDetail extends Component {
  constructor(props) {
    super(props);
    this.state={
      alert:false,
      group:[],
      comment:"",
      alert_records:[],
      block:false,
      data:[],
      label:[],
      status:[],
      tableData:[],
      sensorId:"",
      flash:false,
      zoom:0,
    }
  }

  componentWillUnmount() {

  }
  async componentDidMount() {


  }
  onlyAlphabets(t){
    var regexp = new RegExp(/^[a-zA-Z0-9 ]*$/);
    return regexp.test(t);
  }
  onReadQRCode(e){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    console.log(route.params)
    //let mode = 0;
    const {mode,limit,limitSN,limitID} = route.params;
    var str = e.data;
    console.log("On Read str" +str)
    if(str.length>0){
      if(mode == 1){
          let tokens = str.split(";")
          console.log(tokens)
          if(tokens.length==2){
            console.log(tokens[0].length,tokens[1].length)
            console.log(this.onlyAlphabets(tokens[0]), this.onlyAlphabets(tokens[1]))
            if(this.onlyAlphabets(tokens[0]) && this.onlyAlphabets(tokens[1]) ){
              console.log("Check success")
              if(tokens[0].length == limitSN && tokens[1].length  == limitID){
                  console.log(tokens[0],tokens[1])
                    DeviceEventEmitter.emit("DEVICE_CHANGE_INFO",{deviceSerial:tokens[0].toUpperCase(),deviceNo:tokens[1].toUpperCase()})
                    return navigation.pop(1);
              }
              if(tokens[0].length == limitID && tokens[1].length ==  limitSN ){
                  console.log(tokens[0].length ,tokens[1].length )
                  DeviceEventEmitter.emit("DEVICE_CHANGE_INFO",{deviceSerial:tokens[1].toUpperCase(),deviceNo:tokens[0].toUpperCase()})
                  return navigation.pop(1);
              }
            }

          }
      }
      else if(mode == 2){
          if(this.onlyAlphabets(str) && str.length==limit){
            DeviceEventEmitter.emit("DEVICE_CHANGE_INFO",{deviceSerial:str.toUpperCase()})
            return navigation.pop(1);
          }
      }
      else if(mode == 3){
        console.log("LEn="+str.length)
        if(this.onlyAlphabets(str) && str.length==limit){
          DeviceEventEmitter.emit("DEVICE_CHANGE_INFO",{deviceNo:str.toUpperCase()})
          return navigation.pop(1);
        }
      }

    }

  }
  render(){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {mode} = route.params;
    const {flash,zoom} =this.state
    const SCANCODE = require('../../../framework/assets/images/scan-qrcode.png')
    const BARCODE = require('../../../framework/assets/images/scan-barcode.png')
    return ( <PageContainer style={{paddingLeft:0,paddingRight:0,paddingTop:60}}
                        navigation={this.props.navigation}
                        black
                        isHeader={true}>
                    <Container flexDirection="row"
                        alignItems="center"
                        style={{height:48,width:'100%',backgroundColor:"#333"}}>
                        <IconButton
                          text={"text03"}
                          style={{position:'absolute',left:16}}
                          type="header-back"
                          iconStyle={{width:24,height:24}}
                          onPress={()=>{navigation.pop(1)}}
                          text={""}/>
                    </Container>
                    <View style={{flex:1,width:'100%'}}>
                    <QRCodeScanner
                        reactivate={true}
                        reactivateTimeout={2000}
                        flashMode={flash?RNCamera.Constants.FlashMode.torch:RNCamera.Constants.FlashMode.off}
                        cameraProps={{zoom:Platform.OS=="android"?zoom/100:zoom/100*zoom/100}}
                        cameraStyle={{height:'100%',width:"100%"}}
                        onRead={(e)=>this.onReadQRCode(e)}
                    />
                    <Image  style={{height:'100%',width:'100%',position:'absolute'}}
                        resizeMode={'stretch'}  source={mode==1?SCANCODE:BARCODE} />
                    </View>
                    <View style={{flexDirection:'row',position:'absolute',bottom:200,justifyContent:'center',width:'100%'}}>
                      <Slider
                         maximumValue={100}
                         minimumValue={0}
                         thumbTintColor={"#006AB7"}
                         style={{width:"80%",height:40}}
                         minimumTrackTintColor={"#CCC"}
                         maximumTrackTintColor={"#CCC"}
                         step={5}
                         value={zoom}
                         onValueChange={
                           (zoom) => this.setState({zoom})
                         }
                       />
                     <TouchableOpacity onPress={()=>this.setState({flash:!flash})}>
                     <Image  style={{width:36,height:36}}
                     resizeMode={'contain'}
                     source={flash?require('../../../framework/assets/images/icon_flash_on.png'):require('../../../framework/assets/images/icon_flash_off.png')} />
                     </TouchableOpacity>
                   </View>
                   <Container style={{height:100,width:'100%',backgroundColor:"#000"}}>
                   <Typography
                    　color={"white"}
                     font="text04"
                     text={LangUtil.getStringByKey("device_scan_add_device")}/>
                     <Typography
                      　color={"white"}
                       font="text01"
                       style={{marginTop:10}}
                       text={LangUtil.getStringByKey("device_scan_info")}/>
                  </Container>
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo};
};
export default connect(mapStateToProps, actions)(PageEventDetail);
