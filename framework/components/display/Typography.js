import React, {Component} from 'react';
import { Context, getTypographyColor, getTypographySize} from '../../FrameworkProvider';
import  {
  StyleSheet,
  View,
  Text,
  TouchableOpacity
} from 'react-native';
import {DimUtil} from "../../utils"
class Typography extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {color,text,keyword} = this.props;
    let isKeyword = false;
    let v1,v2,v3
    if(text && text.length>0 && keyword&&keyword.length>0 ){
      let p = text.indexOf(keyword);
      if(p>=0){
        isKeyword= true;
        console.log("***************************position="+p)
        v1 = text.substring(0,p);
        v2 = text.substring(p,p+keyword.length);
        v3 = text.substring(p+keyword.length,text.length+1);
        console.log(v1 +"/" + v2+"/" + v3)
      }
    }
    return (
      <Context.Consumer>
        {({ theme}) => (
          <View style={this.props.style}>
          {isKeyword?<View style={[{flexDirection:'row'},this.props.style]}>
              <Text
              numberOfLines={1}
              style={[
               {fontSize:theme.typography.default.fontSize,
                color:getTypographyColor(theme,this.props.color,this.props.color)},
                getTypographySize(theme,this.props.font,"cotent01"),this.props.style]}>
                {v1}<Text
                style={[
                 {fontSize:theme.typography.default.fontSize,
                  color:getTypographyColor(theme,"primary","primary")},
                  getTypographySize(theme,this.props.font,"cotent01")]}>
                  {v2}
                  </Text >
                  {v3}
                </Text >
           </View>:<Text
          numberOfLines={this.props.numberOfLines?this.props.numberOfLines:1} ellipsizeMode='tail'
          style={[
            {fontSize:theme.typography.default.fontSize,textAlign:this.props.style&&this.props.style.textAlign?this.props.style.textAlign:null,
             color:getTypographyColor(theme,this.props.color,this.props.color)},
             getTypographySize(theme,this.props.font,"cotent01")]}>
             {this.props.text}
          </Text >}
          </View>
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

export default Typography;
