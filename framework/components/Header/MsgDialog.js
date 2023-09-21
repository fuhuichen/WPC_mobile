import React, {Component} from 'react';
import { Context } from '../../FrameworkProvider';
import  {
  StyleSheet,
  View,
  Text,
  StatusBar,
} from 'react-native';
import {Typography,Icon} from "../display"
import {IconButton} from "../button"
import {Tab,NormalButton} from "../button"
import {Container,TouchCard} from "../container"
import {DimUtil,LangUtil} from "../../utils"
import {COLORS} from '../../enums'
class MsgDialog extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const {width,height} = DimUtil.getDimensions("portrait")
    const {data,onCloseDialog} =this.props;
    //let state = navigation.getState();
  //  let routeName = state.routes[state.index].name
　  //console.log(routeName)
    //console.log(state)
    //console.log("Status Bar="+DimUtil.getTopPadding())
    //console.log(width,height)
    return (
      <Context.Consumer>
        {({ theme}) => (
          <Container
               fullwidth style={{position:'absolute',height,width,backgroundColor:'#33333388'}}>
               <Container
                  justifyContent="flex-start"
                  alignItems="flex-start"
                  style={{backgroundColor:'white',width:width-32,borderRadius:5,
                  paddingTop:17.5,paddingBottom:17.5,paddingLeft:16,paddingRight:16}}>
                  <Container
                     fullwidth
                     justifyContent="flex-start"
                     alignItems="center">
                    <Typography
                             color="primary"
                             font={"subtitle02"}
                             style={{marginBottom:12.5}}
                             text={data.title}/>
                   </Container>
                  {data.msg1&&data.msg1!=''?<Typography
                          color="text"
                          font={"content03"}
                          style={{marginBottom:8}}
                          text={data.msg1}/>:null}
                  <Typography
                          color="text"
                          font={"content03"}
                          style={{marginBottom:12.5}}
                          text={data.msg2}/>
                  <NormalButton
                          onPress={()=>{if(onCloseDialog)onCloseDialog()}}
                         text={LangUtil.getStringByKey("common_confirm")}/>
               </Container>
          </Container>
        )}
      </Context.Consumer>
    );
  }
}
const styles = StyleSheet.create({
    container: {
       alignItems:'center'
    }
});

export default MsgDialog;
