import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {AppContainer,
        PageContainer,
        Header,Container,
        Selection,
        Typography,
        Tab,
        Brand,
        RegionSelection,
        NormalButton} from '../../framework';
import {LangUtil,StorageUtil} from '../../framework';
import {ERROR_CODE,ENVIRONMENT,PAGES, STORAGES} from  "../define";
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
class PageQRCodeScanner extends Component {
  constructor(props) {
    super(props);
    this.state={
      scan: false
    }
  }

  componentWillUnmount() {

  }
  async componentDidMount() {
    this.open = false;
  }

  async showBrandSelect(){
    const {navigation} = this.props;
    if(this.open)return;
    this.open =true;
    setTimeout(function(){
      this.open = false;
    }.bind(this),1000)
    navigation.push(PAGES.BRAND_SELECT)

  }
  
  scanSwitch() {
    this.setState({scan: !this.state.scan});
  }

  scanStop(data) {
    console.log("scan data : ", JSON.stringify(data));
    this.setState({scan: false});
  }

  render(){
    const {loginInfo,navigation} = this.props;
    let {scan} = this.state;
    let accountName = null ;
    if(loginInfo && loginInfo.accountList && loginInfo.accountId){
      let account  =loginInfo.accountList.find(p=>p.id == loginInfo.accountId);
      if(account)accountName =account.name
    }
    return ( <PageContainer
                  backgrouncImage
                  isHeader={false} style={{paddingTop:50}}>
                {!scan && <Container fullwidth
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"} style={{flex:1}}>
                  <Typography
                      style={{marginBottom:10}}
                      font={"subtitle02"}
                      text={"Welcome"}
                      color='black'/>
                  <Typography
                      style={{marginBottom:20}}
                      font={"content00"}
                      text={"QRCode Scanner"}
                      color='black'/>
                  <RegionSelection
                        style={{marginBottom:2,borderRadius:0,marginTop:10,
                              borderTopLeftRadius:8,borderTopRightRadius:8}}
                            text={LangUtil.getStringByKey("common_brand")}
                            value={accountName?accountName:LangUtil.getStringByKey("common_please_select")}
                            type="string"
                            onPress={async()=>{await this.showBrandSelect()}}
                        hint={""}/>
                </Container>}
                {scan && <Container fullwidth
                  justifyContent={"flex-start"}
                  alignItems={"flex-start"} style={{flex:1, alignItems:'center'}}>
                  <QRCodeScanner
                    onRead={(data) => this.scanStop(data)}
                    flashMode={RNCamera.Constants.FlashMode.torch}
                    reactivate={true}
                    reactivateTimeout={500}
                  />
                </Container>}
                <NormalButton
                  style={{marginBottom:30}}
                  onPress={()=>{this.scanSwitch()}}
                  text={scan ? LangUtil.getStringByKey("common_close") : LangUtil.getStringByKey("common_begin")}/>
             </PageContainer>);
  }
}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageQRCodeScanner);
