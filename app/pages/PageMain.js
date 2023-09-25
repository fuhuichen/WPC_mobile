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
import {LangUtil} from '../../framework';
import {PAGES} from  "../define";

class PageMain extends Component {
  constructor(props) {
    super(props);
    this.state={
    }
  }

  componentWillUnmount() {

  }

  componentDidMount() {
  }

  logout() {
    const {navigation} = this.props;
    navigation.replace(PAGES.LOGIN,{})
  }

  openCourseSignInPage() {
    const {navigation} = this.props;
    navigation.replace(PAGES.Course_SignIn,{})
  }

  openLocationCheckInPage() {
    const {navigation} = this.props;
    navigation.replace(PAGES.Location_Checkin,{})
  }

  openPointCheckPage() {
    const {navigation} = this.props;
    navigation.replace(PAGES.Point_Check,{})
  }

  render(){
    const {navigation} = this.props;
    let {} = this.state;
    return ( <PageContainer
                  backgrouncImage
                  isHeader={false} style={{paddingTop:100}}>
                <Container fullwidth
                  justifyContent={"flex-start"}
                  alignItems={"flex-start"} style={{flex:1, alignItems:'center'}}>
                  <NormalButton
                    style={{marginBottom:30}}
                    onPress={()=>{this.openCourseSignInPage()}}
                    text={LangUtil.getStringByKey("course_signin")}/>
                  <NormalButton
                    style={{marginBottom:30}}
                    onPress={()=>{this.openLocationCheckInPage()}}
                    text={LangUtil.getStringByKey("location_checkin")}/>
                  <NormalButton
                    style={{marginBottom:30}}
                    onPress={()=>{this.openPointCheckPage()}}
                    text={LangUtil.getStringByKey("point_check")}/>
                </Container>
                <NormalButton
                  style={{marginBottom:30}}
                  onPress={()=>{this.logout()}}
                  text={LangUtil.getStringByKey("setting_logout")}/>
             </PageContainer>);
  }
}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageMain);
