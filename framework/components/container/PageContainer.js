import React, {Component} from 'react';
import { Context } from '../../FrameworkProvider';
import  {
  StyleSheet,
  View,
  ScrollView,
  Text,
  ImageBackground,
  StatusBar
} from 'react-native';
import {DimUtil} from "../../utils"
import {BottomNav} from '../Header'
import {Introduction,IntroductionEvent} from '../Header'
import {MsgDialog} from '../Header'
class PageContainer extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const {width,height} = DimUtil.getDimensions("portrait")
    const {isHeader,bottom,navigation,backgrouncImage,dialog,onCloseDialog,isEvent,
      routeName,introduction,onCloseIntroduction,black} = this.props;
    return (
      <Context.Consumer>
        {({ theme}) => (
          <ScrollView
           keyboardShouldPersistTaps='handled'
            alwaysBounceHorizontal={false}
            alwaysBounceVertical={false}
            bounces={false}
            scrollEnabled={false}
            style={{width,height,backgroundColor:"#fff"}}
            contentStyle={[styles.container,
            {width,height,backgroundColor:theme.colors.BACKGROUND,
            }]}>
            <ImageBackground
              style={[theme.dims.container,
                {width,height:bottom?height-theme.colors.bottom.height-DimUtil.getBottomPadding():height-DimUtil.getBottomPadding(),
                  paddingTop:isHeader?theme.dims.header.height+DimUtil.getTopPadding():0,backgroundColor:theme.colors.BACKGROUND,},
                this.props.style,black?{backgroundColor:'#000'}:null]}
              source={backgrouncImage?DimUtil.isWide()?require("../../assets/images/bg_wide.png"):require("../../assets/images/bg_narrow.png"):null}
              >
            {this.props.children}
            </ImageBackground>
            {black?<View style={{position:'absolute',width,height:100,bottom:-100,backgroundColor:'#000'}}/>:null}
            {bottom?<BottomNav
              tabs={bottom}
              hasStore={this.props.hasStore}
              hasColdchain={this.props.hasColdchain}
              routeName={routeName}
              navigation={this.props.navigation}/>:null}
            {introduction?
              isEvent?<IntroductionEvent
              onCloseIntroduction={onCloseIntroduction}
              data={introduction}/>:<Introduction
              onCloseIntroduction={onCloseIntroduction}
              data={introduction}/>:null}
            {dialog?<MsgDialog
                onCloseDialog={onCloseDialog}
                data={dialog}/>:null}
          </ScrollView>
        )}
      </Context.Consumer>
    );
  }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,alignItems:'center'
    }
});

export default PageContainer;
