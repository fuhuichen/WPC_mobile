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
import {Tab} from "../button"
import {Container} from "../container"
import {DimUtil,LangUtil} from "../../utils"

class BottomNav extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const {width,height} = DimUtil.getDimensions("portrait")
    const {leftIcon,onLeftPressed,rightIcon,onRightPressed,tabs,navigation,routeName,hasColdchain,hasStore} =this.props;
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
              tabContainer
              flexDirection="row"
               fullwidth style={[theme.colors.bottom],
                {bottom: 0}}>
              {tabs.map(function(item,i){
                return  <Tab
                    selected={routeName == item.id} text={LangUtil.getStringByKey(item.name)}
                    noborder
                    disable={(!hasColdchain && i<2) || (!hasStore&&i==2)}
                    style={{alignItems:'flex-start'}}
                    key={item.id}
                    iconSize={24}
                    onPress={()=>{if(item.id!=routeName&& (hasColdchain|| i>=2)) navigation.replace(item.id,{})}}
                    type={item.type}
                    height={theme.colors.bottom.height}/>
              })}
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

export default BottomNav;
