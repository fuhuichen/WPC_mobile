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
        Tab,
        BottomNav,
        DataInput,
        OptionContainer,
        FilterButton,
        NormalButton} from '../../../framework'
import {LangUtil,StorageUtil} from '../../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES,OPTIONS,DEVICE_TYPES} from  "../../define"
import BottomNavigation from "../../components/BottomNavigation"
import { DeviceEventEmitter} from 'react-native';
class PageFilterSort extends Component {
  constructor(props) {
    super(props);
    let options=[]
    const {deviceType} = props.route.params;
    DEVICE_TYPES.forEach((item, i) => {
      options.push({label:item.displayName,id:item.model})
    });

  //  console.log(deviceType.model)
    this.state={
      selected:deviceType?deviceType.model:null,options
    }
  }

  componentWillUnmount() {

  }
  async componentDidMount() {

  }
  async next(){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {mode} = route.params;
    const {options,selected} =this.state;
    console.log("DEviceType="+selected)
    let deviceType = DEVICE_TYPES.find(p=>p.model == selected);
    DeviceEventEmitter.emit("DEVICE_TYPE_CHANGE",{deviceType})
    navigation.pop(1)
  }
  onSelect(id){
    this.setState({selected:id})
  }
  render(){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {mode} = route.params;
    const {options,selected} =this.state;
    return ( <PageContainer
                navigation={this.props.navigation}
                isHeader={true}>
                <Header
                  leftIcon={"header-back"}
                  onLeftPressed={()=>{navigation.pop(1)}}
                  text={LangUtil.getStringByKey("device_type")}
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
                <NormalButton
                  style={{marginTop:20,marginBottom:20}}
                  onPress={async()=>{await this.next()}}
                  text={LangUtil.getStringByKey("common_send")}/>
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter};
};
export default connect(mapStateToProps, actions)(PageFilterSort);
