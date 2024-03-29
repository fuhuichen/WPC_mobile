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

class PageLocationCheckin extends Component {
  constructor(props) {
    super(props);
    this.state={
      scan: false,
      scanFail: false,
      siteSelect: null,
      locationSelect:'All',
      typeSelect:'All',
      locationList: [],
      typeList: [],
      siteList: [],
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
    const {locationSelect,typeSelect} = this.state;
    let result = await MainAPI.getSiteList(locationSelect!="All"?locationSelect:null,typeSelect!='All'?typeSelect:null );
    console.log("getSiteList result : ", JSON.stringify(result));
    if(result.errorcode == ERROR_CODE.SUCCESS) {
      this.setState({locationList: result.locationList, typeList: result.typeList,
        siteList: result.rows,   siteSelect: null});
    }
    if(this.refSiteSelect)this.refSiteSelect.reset()
  }

  scanStart() {
    this.setState({scan: true, checkinMember: null, scanAlready: false, scanFail: false});
  }

  scanStop() {
    this.setState({scan: false/*, siteSelect: null*/});
  }

  async scanData(data) {
    console.log("scan data : ", JSON.stringify(data));
    let {siteSelect} = this.state;
    if(data && data.data) {
      let body = {
        siteId: siteSelect.key,
        qrCodeNumber: data.data
      }
      let result = await MainAPI.checkinSite(body);
      console.log("checkinSite result : ", JSON.stringify(result));
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

  async setSelected_bg(select) {
    console.log("bg select : ", select);
    await this.setState({locationSelect: select,typeSelect:"All"});
    await this.init()
  }

  async setSelected_sector(select) {
    console.log("sector select : ", select);
    await this.setState({typeSelect: select});
    await this.init()
  }

  setSelected(select) {
    console.log("site select : ", select);
    this.setState({siteSelect: select});
  }

  backMainPage() {
    const {navigation} = this.props;
    navigation.replace(PAGES.MAIN,{})
  }

  render(){
    let {scan, siteList, locationList, typeList, locationSelect, typeSelect, siteSelect, checkinMember, scanAlready, scanFail} = this.state;

    let siteOptions = [], locationOptions = ['All'], typeOptions = ['All'];
    locationList.forEach(location => {
      locationOptions.push(location);
    });

    typeList.forEach(type => {
      typeOptions.push(type);
    });

    siteList.forEach(site => {
      siteOptions.push({
        key: site.siteId,
        value: site.name
      })
    })

    let locationDefaultSelectIndex = 0;
    if(locationSelect != null) {
      locationOptions.forEach((location,index) => {
        if(location == locationSelect) {
          locationDefaultSelectIndex = index;
        }
      })
    }

    let typeDefaultSelectIndex = 0;
    if(typeSelect != null) {
      typeOptions.forEach((type,index) => {
        if(type == typeSelect) {
          typeDefaultSelectIndex = index;
        }
      })
    }

    let siteDefaultSelectIndex = null;
    if(siteSelect != null) {
      siteOptions.forEach((site,index) => {
        if(site.key == siteSelect.key) {
          siteDefaultSelectIndex = index;
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
                      text={LangUtil.getStringByKey("location_checkin")}
                      color='black'/>

                  {siteSelect != null &&
                  <Typography
                      style={{marginBottom:10}}
                      font={"content03"}
                      text={siteSelect.value}
                      color='black'/>}

                  {/* step1 */}
                  {!scan && checkinMember == null && scanFail == false &&
                  <View style={styles.dropdownsRow}>
                    <SelectDropdown data={locationOptions}
                                    onSelect={async(selectedItem, index) => {
                                      await this.setSelected_bg(selectedItem);
                                    }}
                                    defaultValueByIndex={locationDefaultSelectIndex}
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
                    <SelectDropdown data={typeOptions}
                                    onSelect={async(selectedItem, index) => {
                                      await this.setSelected_sector(selectedItem);
                                    }}
                                    defaultValueByIndex={typeDefaultSelectIndex}
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
                    <SelectDropdown data={siteOptions}
                                    ref={(ele) => {
                                      this.refSiteSelect = ele;
                                    }}
                                    defaultButtonText={LangUtil.getStringByKey("location_select")}
                                    onSelect={(selectedItem, index) => {
                                      this.setSelected(selectedItem);
                                    }}
                                    defaultValueByIndex={siteDefaultSelectIndex}
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
                    style={siteSelect == null ? {width: '45%'} : {width: '45%', backgroundColor: '#35CDA8'}}
                    disabled={siteSelect == null}
                    onPress={()=>{this.scanStart()}}
                    text={LangUtil.getStringByKey("confirm")}/>}
                  {(checkinMember != null || scanFail == true) && <NormalButton
                    style={siteSelect == null ? {width: '45%'} : {width: '45%', backgroundColor: '#35CDA8'}}
                    disabled={siteSelect == null}
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
export default connect(mapStateToProps, actions)(PageLocationCheckin);
