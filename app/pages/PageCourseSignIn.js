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

class PageCourseSign extends Component {
  constructor(props) {
    super(props);
    this.state={
      scan: false,
      signinNo: null,
      courseId: null,
      courseList: [
        {
          key: 1,
          value: '課程1'
        },
        {
          key: 2,
          value: '課程2'
        },
        {
          key: 3,
          value: '課程3'
        },
        {
          key: 4,
          value: '課程4'
        },
        {
          key: 5,
          value: '課程5'
        },
        {
          key: 6,
          value: '課程6'
        }
      ]
    }
  }

  componentWillUnmount() {

  }
  async componentDidMount() {
    this.open = false;
  }
  
  scanStart() {
    this.setState({scan: true, signinNo: null});
  }

  scanStop() {
    this.setState({scan: false, courseId: null});
  }

  scanData(data) {
    console.log("scan data : ", JSON.stringify(data));
    if(data && data.data) {
      this.setState({scan: false, signinNo: data.data});
    }
  }

  setSelected(select) {
    console.log("course select : ", select);
    this.setState({courseId: select});
  }

  backMainPage() {
    const {navigation} = this.props;
    navigation.replace(PAGES.MAIN,{})
  }

  render(){
    let {scan, signinNo, courseList, courseId} = this.state;

    let courseNameSelect = '';
    if(courseId != null) {
      courseList.forEach(course => {
        if(course.key == courseId) {
          courseNameSelect = course.value;
        }
      })
    }
    
    return ( <PageContainer
                  backgrouncImage
                  isHeader={false} style={{paddingTop:50}}>
                <Container fullwidth
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"} style={{flex:1, alignItems:'center'}}>
                  <Typography
                      style={{marginBottom:10}}
                      font={"subtitle01"}
                      text={LangUtil.getStringByKey("course_signin")}
                      color='black'/>

                  {courseNameSelect != '' && 
                  <Typography
                      style={{marginBottom:10}}
                      font={"content03"}
                      text={courseNameSelect}
                      color='black'/>}

                  {/* step1 */}
                  {!scan && signinNo == null && 
                  <SelectList 
                      boxStyles={{width:300}}
                      dropdownStyles={{minHeight: 50}}
                      setSelected={(val) => this.setSelected(val)} 
                      data={courseList} 
                      save="key"
                      placeholder={LangUtil.getStringByKey("course_select")}
                  />}

                  {/* step2 */}
                  {scan && 
                  <QRCodeScanner
                    onRead={(data) => this.scanData(data)}
                    flashMode={RNCamera.Constants.FlashMode.torch}
                    reactivate={true}
                    reactivateTimeout={500}
                  />}

                  {/* step3 */}
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
                    <Container fullwidth
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"} style={{flex:1, alignItems:'center'}}>
                      <Typography
                          style={{marginBottom:10}}
                          font={"subtitle01"}
                          text={LangUtil.getStringByKey("success_signin")}
                          color='black'/>
                    </Container>
                  </Container>}
                </Container>
                
                
                {!scan && <View style={{flexDirection:'row', justifyContent: 'space-between', marginBottom:30}}>
                  {signinNo == null && <NormalButton
                    style={{width: '45%'}}
                    disabled={courseId == null}
                    onPress={()=>{this.scanStart()}}
                    text={LangUtil.getStringByKey("confirm")}/>}
                  {signinNo != null && <NormalButton
                    style={{width: '45%'}}
                    disabled={courseId == null}
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
                  onPress={()=>{this.scanStop()}}
                  text={LangUtil.getStringByKey("stop_signin")}/>
              } 
             </PageContainer>);
  }
}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageCourseSign);
