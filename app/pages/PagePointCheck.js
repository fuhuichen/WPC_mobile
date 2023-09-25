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

class PagePointCheck extends Component {
  constructor(props) {
    super(props);
    this.state={
      scan: true,
      signinNo: null
    }
  }

  componentWillUnmount() {

  }
  async componentDidMount() {
  }
  
  scanStart() {
    this.setState({scan: true, signinNo: null});
  }

  scanData(data) {
    console.log("scan data : ", JSON.stringify(data));
    if(data && data.data) {
      this.setState({scan: false, signinNo: data.data});
    }
  }

  backMainPage() {
    const {navigation} = this.props;
    navigation.replace(PAGES.MAIN,{})
  }

  render(){
    let {scan, signinNo} = this.state;

    let point = 100;
    
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
                  {!scan && signinNo != null && 
                  <Container fullwidth
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"} style={{flex:1}}>
                    <Typography
                        style={{marginBottom:10}}
                        font={"content03"}
                        text={'PartnerName:'}
                        color='black'/>
                    <Typography
                        style={{marginBottom:10}}
                        font={"content03"}
                        text={signinNo}
                        color='black'/>
                    <Typography
                        style={{marginBottom:10}}
                        font={"content03"}
                        text={'eMail:'}
                        color='black'/>
                    <Typography
                        style={{marginBottom:10}}
                        font={"content03"}
                        text={'xxxx@xxxxxxxxxc'}
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
                          text={point}
                          color='black'/>
                    </View>
                  </Container>}
                </Container>
                
                
                {!scan && <View style={{flexDirection:'row', justifyContent: 'space-between', marginBottom:30}}>
                  {signinNo != null && <NormalButton
                    style={{width: '45%'}}
                    onPress={()=>{this.scanStart()}}
                    text={LangUtil.getStringByKey("continue_signin")}/>}
                  <NormalButton
                    style={{width: '45%'}}
                    onPress={()=>{this.backMainPage()}}
                    text={LangUtil.getStringByKey("back_main")}/>
                </View>
                }

                {scan && 
                <NormalButton
                  style={{marginBottom:30}}
                  onPress={()=>{this.backMainPage()}}
                  text={LangUtil.getStringByKey("stop_signin")}/>
              } 
             </PageContainer>);
  }
}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PagePointCheck);
