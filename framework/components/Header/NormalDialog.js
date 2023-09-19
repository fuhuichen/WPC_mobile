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
    const {data,onCloseDialog,onCancel,onConfirm,cancelText,confirmText} =this.props;
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
                  style={{backgroundColor:'#F0F0F0',borderRadius:8,width:width-32,borderRadius:5,
                  paddingTop:17.5,paddingBottom:17.5,paddingLeft:16,paddingRight:16}}>
                  <Container
                     fullwidth
                     justifyContent="flex-start"
                     alignItems="center">
                  <Typography
                          color="text"
                          font={"text03"}
                          numberOfLines={2}
                          style={{marginBottom:8}}
                          text={data.msg}/>
                  </Container>
                  <Container
                     fullwidth
                     flexDirection='row'
                     justifyContent="flex-end"
                     alignItems="center">
                     <IconButton
                       textStyle={"text01"}
                       style={{marginRight:16}}
                       onPress={()=>onCancel()}
                       text={cancelText?cancelText:LangUtil.getStringByKey("filter_clear_all")}/>
                      <IconButton
                         textStyle={"text01"}
                         style={{marginRight:10}}
                         onPress={()=>onConfirm()}
                         text={confirmText?confirmText:LangUtil.getStringByKey("filter_clear_all")}/>
                   </Container>
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
