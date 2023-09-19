import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import VALUES from '../utils/values';

export default class Header extends React.Component {


  constructor(props) {
    super(props);
    this.props = props;
  }

  render () {
    return (<View style={styles.viewStyle}>
              <Text  allowFontScaling={false} style={styles.textStyle}>{this.props.headerText}</Text>
          </View>);
  }
}

Header.propTypes = {   headerText: React.PropTypes.string.isRequired};
Header.defaultProps = {   headerText: 'ABC'};

const styles = StyleSheet.create({
  viewStyle:{
    backgroundColor : VALUES.COLORMAP.bright_blue,
    justifyContent : 'center',
    alignItems: 'center',
    height : 60,
    paddingTop : 15,
    paddingBottom : 15,
    shadowColor:'#000',
    shadowOffset: {width:0, height:2},
    shadowOpacity:0.2,
    elevation:2,
    position:'relative'
  },
  textStyle:{
    color: VALUES.COLORMAP.black,
    fontSize : 25,

  }
});
/*
class Header = (props) => {
  propTypes = {
    headerText: React.PropTypes.string.isRequired,
  };

  const {textStyle, viewStyle} = styles;
  return (<View style={viewStyle}>
            <Text  allowFontScaling={false} style={textStyle}>{props.headerText}</Text>
        </View>);
};
*/
