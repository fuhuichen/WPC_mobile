import React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import VALUES from '../utils/values';

export default class Input extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
  }

  render () {
    return (<View   style={styles.containerStyle}>
              <Text  allowFontScaling={false} style={styles.labelStyle}>{this.props.label}  </Text>
              <TextInput
                  autoCorrect={false}
                  placeholder={this.props.placeholder}
                  secureTextEntry={this.props.secureTextEntry}
                  style={styles.inputStyle}
                  value={this.props.value}
                  onChangeText={this.props.onChangeText}>
              </TextInput>
           </View>);
  }
}

Input.propTypes = {   label: React.PropTypes.any ,
                       value: React.PropTypes.any ,
                       onChangeText: React.PropTypes.any,
                       secureTextEntry : React.PropTypes.any,
                       placeholder:React.PropTypes.any,};
Input.defaultProps = {  label:undefined ,
                        secureTextEntry: false,
                        placeholder:''};

const styles = StyleSheet.create({
  inputStyle:{
    fontSize:15,
    flex:3,
    paddingLeft:5,
    paddingRight:5,
    color:VALUES.COLORMAP.white,
    lineHeight:30
  },
  labelStyle:{
    color:VALUES.COLORMAP.white,
    fontSize:14,
    flex:1,
    paddingLeft:10
  },
  containerStyle:{
    height:50,
    padding:5,
    alignItems:'center',
    flex:1,
    flexDirection: 'row',
  },
});
