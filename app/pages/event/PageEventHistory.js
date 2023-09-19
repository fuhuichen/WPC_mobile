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
        NormalButton} from '../../../framework'
import {LangUtil,StorageUtil} from '../../../framework'
import moment from 'moment'
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES} from  "../../define"
import BottomNavigation from "../../components/BottomNavigation"
class PageEventHistory extends Component {
  constructor(props) {
    super(props);
  }

  componentWillUnmount() {

  }
  async componentDidMount() {

  }
  async showBrandSelect(){
    const {navigation} = this.props;
    navigation.push(PAGES.BRAND_SELECT)
  }
  render(){
    const {loginInfo,navigation,route} = this.props;
    const {alert_records,event} = route.params;
    console.log(alert_records)
    let timezoneShift = parseInt(event.time_zone.replace("+",""))*60
  //
    return ( <PageContainer
                navigation={this.props.navigation}
                isHeader={true}>
                <Header
                  leftIcon={"header-back"}
                  onLeftPressed={()=>{navigation.pop(1)}}
                  text={LangUtil.getStringByKey("event_comment_history")}
                />
                <Container
                    fullwidth
                    scrollable
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1}}>
                    <Typography
                        style={{marginLeft:8,marginTop:12,marginBottom:8}}
                        font={"subtitle03"}
                        text={LangUtil.getStringByKey("common_total")+" : "+alert_records.length}
                    />
                    {alert_records.map(function(item){
                        console.log("Datae "+item.record.timestamp)
                        let date = moment (  moment(item.record.timestamp, 'YYYY-MM-DD HH:mm:ss').toDate() ).utcOffset( timezoneShift).format("YYYY/MM/DD HH:mm")
                        return <Container
                            fullwidth
                            border
                            alignItems={"flex-start"}
                            justifyContent="flex-start"
                            style={{height:92,marginBottom:16,padding:8}}>
                            <Typography
                                style={{marginBottom:8}}
                                font={"subtitle02"}
                                color='text'
                                text={item.record.user.user_info.name}
                            />
                            <Typography
                                style={{marginBottom:8}}
                                font={"content03"}
                                color="gray"
                                text={item.record.content}
                            />
                            <Typography
                                style={{marginBottom:8}}
                                font={"content03"}
                                color="gray"
                                text={date+" ("+ event.time_zone+")"}
                            />
                        </Container>
                    })
                    }
                </Container>
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo};
};
export default connect(mapStateToProps, actions)(PageEventHistory);
