import React, {Component} from 'react';
import { Context, getTypographyColor, getTypographySize} from '../../FrameworkProvider';
import {ICONS} from '../../enums'
import  {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity
} from 'react-native';
import {DimUtil} from "../../utils"
class Icon extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {color,type} = this.props;
    let active,disabled,normal;
    //console.log("Icon type "+type)
    if( type && ICONS[type]){
        //console.log(ICONS[type])
        return (<Context.Consumer>
            {({ theme}) => (
              <Image
                resizeMode={"stretch"}
                source={ICONS[type]}
                style={[
                 theme.dims.icon,
                 this.props.style]}>
                 {this.props.text}
              </Image >
            )}
          </Context.Consumer>
        );
    }
    return null;

  }
}
const styles = StyleSheet.create({
    container: {
       alignItems:'center'
    }
});

export default Icon;
