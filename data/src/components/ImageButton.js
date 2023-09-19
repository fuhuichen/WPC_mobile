import React from 'react';
import {Image, StyleSheet, TouchableHighlight, View} from 'react-native';

export default class ImageButton extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {editPress:false}
  }

  render () {
    var resolution = {
      height: this.props.height,
      width: this.props.width
    };
    var redNode = null;
    var image ;
    switch(this.props.type){
      case 'none':
            image = undefined;
            break;

      case 'home':
          image = require('../../images/titlebar_home_icon_normal.png');
          if(this.state.editPress){
              image = require('../../images/titlebar_home_icon_pressed.png');
          }
          break;
      case 'setting':

          image = require('../../images/titlebar_setting_icon_normal.png');
          if(this.state.editPress){
              image = require('../../images/titlebar_setting_icon_pressed.png');
          }
          break;
      case 'edit':
              image = require('../../images/btn_arrow_down_m.png');
              break;
      case 'return':
            image = require('../../images/titlebar_back_icon_normal.png');
            break;
      case 'left':
          image = require('../../images/btn_arrow_left.png');
          break;
      case 'right':
          image = require('../../images/btn_arrow_right.png');
          break;
     case 'date':
          image = require('../../images/icon_date.png');
          break;
      case 'scan':
              image = require('../../images/icon_scan_code_nor.png')
              if(this.state.editPress){
                  image = require('../../images/icon_scan_code_press.png');
              }
              break;
      case 'switch':
            image = require('../../../app/assets/images/img_navbar_switch.png');
            break;
      default:
          image = require('../../images/btn_back.png');
        //  if(this.state.editPress){
        //      image = require('../../images/icon_back_press.png');
        //  }
          break;
    }

    return (<TouchableHighlight
        style={{backgroundColor:'transparent'}}
        underlayColor={'transparent'}
        onPressIn={() => this.setState({editPress:true})}
        onPressOut={() => {this.setState({editPress:false});this.props.onPress()}}
        >
        <View>
        <Image style={resolution} resizeMode={'contain'}  source={image} />
        {redNode}
        </View>
      </TouchableHighlight>)
   /*
    return (<TouchableOpacity onPress={this.props.onPress} style={resolution}>

                <Image style={resolution} resizeMode={'contain'}  source={image} />
                {redNode}
            </TouchableOpacity>);
  */
  }
}

const styles = StyleSheet.create({

});
