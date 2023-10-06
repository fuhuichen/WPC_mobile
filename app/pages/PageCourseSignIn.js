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
import SelectDropdown from 'react-native-select-dropdown';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MainAPI from "../api/main";

class PageCourseSign extends Component {
  constructor(props) {
    super(props);
    this.state={
      scan: false,
      scanFail: false,
      checkinMember: null,
      courseSelect: null,
      bgSelect:'All',
      sectorSelect:'All',
      bgList: [],
      sectorList: [],
      courseList: [],
      checkinMember: null,
      scanAlready: false
    }
  }

  componentWillUnmount() {

  }

  componentDidMount() {
    this.init();
  }

  async init() {
    let result = await MainAPI.getCourseList();
    console.log("getCourseList result : ", JSON.stringify(result));
    if(result.errorcode == ERROR_CODE.SUCCESS) {
      this.setState({bgList: result.bgList, sectorList: result.sectorList, courseList: result.rows});
    }
  }
  
  scanStart() {
    this.setState({scan: true, checkinMember: null, scanAlready: false, scanFail: false});
  }

  scanStop() {
    this.setState({scan: false/*, courseSelect: null*/});
  }

  async scanData(data) {
    console.log("scan data : ", JSON.stringify(data));
    let {courseSelect} = this.state;
    if(data && data.data) {
      let body = {
        courseId: courseSelect.key,
        qrCodeNumber: data.data
      }
      let result = await MainAPI.checkinCourse(body);
      console.log("checkinCourse result : ", JSON.stringify(result));
      if(result.errorcode == ERROR_CODE.SUCCESS) {
        this.setState({checkinMember: result.member});
      } else if (result.errorcode == ERROR_CODE.ALREADY_CHECKIN) {
        this.setState({scanAlready: true, checkinMember: result.member});
      } else {
        this.setState({scanFail: true});
      }
      this.setState({scan: false});
    } else {
      this.setState({scan: false, scanFail: true});
    }
  }

  setSelected_bg(select) {
    console.log("bg select : ", select);
    this.setState({bgSelect: select});
  }

  setSelected_sector(select) {
    console.log("sector select : ", select);
    this.setState({sectorSelect: select});
  }

  setSelected(select) {
    console.log("course select : ", select);
    this.setState({courseSelect: select});
  }

  backMainPage() {
    const {navigation} = this.props;
    navigation.replace(PAGES.MAIN,{})
  }

  render(){
    let {scan, checkinMember, courseList, bgList, sectorList, bgSelect, sectorSelect, courseSelect, scanAlready, scanFail} = this.state;
    
    console.log("========render courseSelect : ", courseSelect);

    let courseOptions = [], bgOptions = ['All'], sectorOptions = ['All'];
    bgList.forEach(bg => {
      bgOptions.push(bg);
    });

    sectorList.forEach(sector => {
      sectorOptions.push(sector);
    });

    courseList.forEach(course => {
      let canSelect = true;
      if(bgSelect != 'All' && course.bgName != bgSelect) {
        canSelect = false;
      }
      if(canSelect && sectorSelect != 'All' && course.sectorName != sectorSelect) {
        canSelect = false;
      }
      if(canSelect) {
        courseOptions.push({
          key: course.courseId,
          value: course.name
        })
      }
    })

    let bgDefaultSelectIndex = 0;
    if(bgSelect != null) {
      bgOptions.forEach((bg,index) => {
        if(bg == bgSelect) {
          bgDefaultSelectIndex = index;
        }
      })
    }

    let sectorDefaultSelectIndex = 0;
    if(sectorSelect != null) {
      sectorOptions.forEach((sector,index) => {
        if(sector == sectorSelect) {
          sectorDefaultSelectIndex = index;
        }
      })
    }

    let courseDefaultSelectIndex = null;
    if(courseSelect != null) {
      courseOptions.forEach((course,index) => {
        if(course.key == courseSelect.key) {
          courseDefaultSelectIndex = index;
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

                  {courseSelect != null && 
                  <Typography
                      style={{marginBottom:10}}
                      font={"content03"}
                      text={courseSelect.value}
                      color='black'/>}

                  {/* step1 */}
                  {!scan && checkinMember == null && scanFail == false &&
                  <View style={styles.dropdownsRow}>
                    <SelectDropdown data={bgOptions}
                                    onSelect={(selectedItem, index) => {
                                      this.setSelected_bg(selectedItem);
                                    }}
                                    defaultValueByIndex={bgDefaultSelectIndex}
                                    buttonTextAfterSelection={(selectedItem, index) => {
                                      return selectedItem;
                                    }}
                                    rowTextForSelection={(item, index) => {
                                      return item;
                                    }}
                                    buttonStyle={styles.dropdown1BtnStyle}
                                    buttonTextStyle={styles.dropdown1BtnTxtStyle}
                                    renderDropdownIcon={isOpened => {
                                      return <FontAwesome name={isOpened ? 'chevron-up' : 'chevron-down'} color={'#444'} size={18} />;
                                    }}
                                    dropdownIconPosition={'right'}
                    />
                    <SelectDropdown data={sectorOptions}
                                    onSelect={(selectedItem, index) => {
                                      this.setSelected_sector(selectedItem);
                                    }}
                                    defaultValueByIndex={sectorDefaultSelectIndex}
                                    buttonTextAfterSelection={(selectedItem, index) => {
                                      return selectedItem;
                                    }}
                                    rowTextForSelection={(item, index) => {
                                      return item;
                                    }}
                                    buttonStyle={styles.dropdown1BtnStyle}
                                    buttonTextStyle={styles.dropdown1BtnTxtStyle}
                                    renderDropdownIcon={isOpened => {
                                      return <FontAwesome name={isOpened ? 'chevron-up' : 'chevron-down'} color={'#444'} size={18} />;
                                    }}
                                    dropdownIconPosition={'right'}
                    />
                    <SelectDropdown data={courseOptions}
                                    defaultButtonText={LangUtil.getStringByKey("course_select")}
                                    onSelect={(selectedItem, index) => {
                                      this.setSelected(selectedItem);
                                    }}
                                    defaultValueByIndex={courseDefaultSelectIndex}
                                    buttonTextAfterSelection={(selectedItem, index) => {
                                      return selectedItem.value;
                                    }}
                                    rowTextForSelection={(item, index) => {
                                      return item.value;
                                    }}
                                    buttonStyle={styles.dropdown1BtnStyle}
                                    buttonTextStyle={styles.dropdown1BtnTxtStyle}
                                    renderDropdownIcon={isOpened => {
                                      return <FontAwesome name={isOpened ? 'chevron-up' : 'chevron-down'} color={'#444'} size={18} />;
                                    }}
                                    dropdownIconPosition={'right'}
                    />
                  </View>}

                  {/* step2 */}
                  {scan && 
                  <QRCodeScanner
                    onRead={(data) => this.scanData(data)}
                    flashMode={RNCamera.Constants.FlashMode.torch}
                    reactivate={true}
                    reactivateTimeout={500}
                  />}

                  {/* step3 */}
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
                    {scanAlready == false && 
                    <Container fullwidth
                      justifyContent={"flex-start"}
                      alignItems={"flex-start"} style={{flex:1, alignItems:'center', marginTop: 100}}>
                      <Typography
                          style={{marginBottom:10}}
                          font={"title03"}
                          text={LangUtil.getStringByKey("success_signin")}
                          color='black'/>
                    </Container>}
                    {scanAlready && 
                    <Container fullwidth
                      justifyContent={"flex-start"}
                      alignItems={"flex-start"} style={{flex:1, alignItems:'center', marginTop: 100}}>
                      <Typography
                          style={{marginBottom:10}}
                          font={"title03"}
                          text={LangUtil.getStringByKey("fail_signin")}
                          color='black'/>
                      <Typography
                          style={{marginBottom:10}}
                          font={"title03"}
                          text={'(' + LangUtil.getStringByKey("already_signin") + ')'}
                          color='black'/>
                    </Container>}
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
                  {checkinMember == null && scanFail == false && <NormalButton
                    style={{width: '45%'}}
                    disabled={courseSelect == null}
                    onPress={()=>{this.scanStart()}}
                    text={LangUtil.getStringByKey("confirm")}/>}
                  {(checkinMember != null || scanFail == true) && <NormalButton
                    style={{width: '45%'}}
                    disabled={courseSelect == null}
                    onPress={()=>{this.scanStart()}}
                    text={LangUtil.getStringByKey("continue_signin")}/>}
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

const styles = StyleSheet.create({
  dropdownsRow: {flex: 1},

  dropdown1BtnStyle: {
    width: '80%',
    height: 50,
    marginTop: 30,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },

  dropdown1BtnTxtStyle: {color: '#444', textAlign: 'left'},
});

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageCourseSign);
