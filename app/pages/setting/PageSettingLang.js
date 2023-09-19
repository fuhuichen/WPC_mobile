import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {AppContainer,
        PageContainer,
        Header,Container,
        Selection,
        Typography,
        OptionContainer,
        NormalButton} from '../../../framework'
import {LangUtil} from '../../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS} from  "../../define"
import BottomNavigation from "../../components/BottomNavigation"
class PageSettingLang extends Component {
  constructor(props) {
    super(props);
    this.state ={
      selected: LangUtil.getLanguage()
    }

  }

  componentWillUnmount() {

  }
  async componentDidMount() {

  }
  async onSelect(id){
    const {navigation} = this.props;
    this.setState({selected:id})
  }
  render(){
    const options =[
      {  label:'繁體中文',id:"zh-TW"},
      {  label:'简体中文',id:"zh-CN"},
      {  label:'English',id:"en"},
      {  label:'日本語',id:"ja"},
    ]
    const {loginInfo,navigation} = this.props;
    const {selected} = this.state;
    return ( <PageContainer
                bottom={null}
                navigation={this.props.navigation}
                isHeader={true}>
                <Header
                  leftIcon={"header-back"}
                  onLeftPressed={()=>{navigation.replace(PAGES.MORE,{})}}
                  text={LangUtil.getStringByKey("setting_language")}
                  rightText={LangUtil.getStringByKey("common_confirm")}
                  onRightPressed={async()=>{
                    LangUtil.changeAppLocale(selected);
                    navigation.replace(PAGES.MORE,{})
                  }}
                />
                <Container
                    fullwidth
                    scrollable
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1}}>
                    <OptionContainer
                      style={{marginTop:20,marginBottom:20}}
                      selected={selected}
                      onSelect={(id)=>this.onSelect(id)}
                      options={
                        options
                      }/>
                </Container>
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo};
};
export default connect(mapStateToProps, actions)(PageSettingLang);
