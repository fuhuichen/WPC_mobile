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
import { SelectList } from 'react-native-dropdown-select-list';
import MainAPI from "../api/main";

class PagePointCheck extends Component {
  constructor(props) {
    super(props);
    this.state={
      scan: true,
      scanFail: false,
      checkinMember: null
    }
  }

  componentWillUnmount() {

  }
  async componentDidMount() {
  }

  scanStart() {
    this.setState({scan: true, checkinMember: null, scanFail: false});
  }

  async scanData(data) {
    console.log("scan data : ", JSON.stringify(data));
    if(data && data.data) {
      let body = {
        qrCodeNumber: data.data
      }
      let result = await MainAPI.getMemberInfo(body);
      console.log("getAccountList result : ", JSON.stringify(result));
      if(result.errorcode == ERROR_CODE.SUCCESS) {
        this.setState({checkinMember: result.member});
      } else {
        this.setState({scanFail: true});
      }
      this.setState({scan: false});
    } else {
      this.setState({scan: false, scanFail: true});
    }
  }

  backMainPage() {
    const {navigation} = this.props;
    navigation.replace(PAGES.MAIN,{})
  }

  render(){
    let {scan, checkinMember, scanFail} = this.state;

    return ( <PageContainer
                  backgrouncImage
                  isHeader={false} style={{paddingTop:50}}>
                <Container fullwidth
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"} style={{flex:1, alignItems:'center'}}>
                  <Typography
                      style={{marginBottom:10}}
                      font={"subtitle01"}
                      text={LangUtil.getStringByKey("point_check")}
                      color='black'/>

                  {/* step1 */}
                  {scan &&
                  <QRCodeScanner
                    onRead={(data) => this.scanData(data)}
                    flashMode={RNCamera.Constants.FlashMode.torch}
                    reactivate={true}
                    reactivateTimeout={500}
                  />}

                  {/* step2 */}
                  {!scan && checkinMember != null &&
                  <Container fullwidth
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"} style={{flex:1}}>
                    <Typography
                        style={{marginBottom:10}}
                        font={"content03"}
                        text={'PartnerName:'}
                        color='black'/>
                    <Typography
                        style={{marginBottom:20}}
                        font={"content03"}
                        text={checkinMember.firstName + ' ' + checkinMember.lastName}
                        color='black'/>
                    <Typography
                        style={{marginBottom:10}}
                        font={"content03"}
                        text={'eMail:'}
                        color='black'/>
                    <Typography
                        style={{marginBottom:10}}
                        font={"content03"}
                        text={checkinMember.email}
                        color='black'/>
                    <View style={{flexDirection:'row', justifyContent: 'space-between', marginBottom:30}}>
                      <Typography
                          style={{marginTop: 20}}
                          font={"content03"}
                          text={"WPC Point :"}
                          color='black'/>
                      <Typography
                          style={{marginLeft:100}}
                          font={"title01"}
                          text={checkinMember.wpcPoints}
                          color='black'/>
                    </View>
                  </Container>}

                  {/* fail */}
                  {!scan && scanFail &&
                  <Container fullwidth
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"} style={{flex:1, alignItems:'center', marginTop: 100}}>
                      <Typography
                          style={{marginBottom:10}}
                          font={"title03"}
                          text={LangUtil.getStringByKey("QRCode_Error")}
                          color='black'/>
                      <Typography
                          style={{marginBottom:10}}
                          font={"title03"}
                          text={LangUtil.getStringByKey("scan_again")}
                          color='black'/>
                  </Container>}
                </Container>


                {!scan && <View style={{flexDirection:'row', justifyContent: 'space-between', marginBottom:30}}>
                <NormalButton
                  style={{width: '45%'}}
                  onPress={()=>{this.backMainPage()}}
                  text={LangUtil.getStringByKey("back_main")}/>
                  <NormalButton
                    style={{width: '45%',backgroundColor: '#35CDA8'}}
                    onPress={()=>{this.scanStart()}}
                    text={LangUtil.getStringByKey("continue_query")}/>
                </View>
                }

                {scan &&
                <NormalButton
                  style={{marginBottom:30}}
                  onPress={()=>{this.backMainPage()}}
                  text={LangUtil.getStringByKey("stop_query")}/>
              }
             </PageContainer>);
  }
}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PagePointCheck);
