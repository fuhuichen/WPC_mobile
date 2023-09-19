import React from 'react';
import {TextInput,Image, Text,View,StyleSheet,TouchableOpacity} from 'react-native';
import VALUES from '../utils/values';
import ImageButton from './ImageButton';
import ImageView from './ImageView';
import ModalDropdown from 'react-native-modal-dropdown';
import DatePicker from 'react-native-datepicker'
import I18n from 'react-native-i18n';
export default class SettingItem extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
  }

  renderButton(){
    const {smallPhone} =this.props;
    var styles;
    var size = 16;
    const {options,date,enable,type,data} = this.props;
    var dataColor = {color:VALUES.COLORMAP.dkk_font_white};
    var font = {fontSize:18};

    if( !enable){
      dataColor = {color:VALUES.COLORMAP.light_font_gray};
    }
    if(type == 'input') {
    } else if( type != 'time') {
      if(options) {
        var len = options.length;
        if(len>4) len = 4;
        var dh = 4 * 50;
        //console.log('options' + options)
        return (
          <View style={{flex:1,marginRight:5}}>
            <ModalDropdown
                    options={options}
                    onSelect={this.props.onPress}
                    dropdownStyle={{height:dh,padding:7}}
                    dropdownTextStyle={styles.textDropdownStyle}>
              <View style={{alignItems:'center',flexDirection:'row'}}>
              <ImageView height={size} width={size} type={this.props.type} />
              </View>
            </ModalDropdown>
            </View>
        );
      } else {
        return (<View style={{marginRight:5}}>
              <ImageButton
                height={size} width={size}
                type={this.props.type}
                onPress={this.props.onPress} />
              </View>)
      }
    } else {
      var minDate = "2013-01-01";
      var maxDate = date;
      if( this.props.minDate) {
        minDate =  this.props.minDate;
      }
      if(this.props.maxDate) {
        maxDate =  this.props.maxDate;
      }
      return (
         <View style={styles.dataPickerView}>
         <DatePicker
         style={{alignItems:'center',flex:1, backgroundColor: VALUES.COLORMAP.white}}
         date={date}
         mode="date"
         disabled={!enable}
         format="YYYY-MM-DD"
         minDate={minDate}
         maxDate={maxDate}
         confirmBtnText="Confirm"
         cancelBtnText="Cancel"
         iconSource={require('../../images/time.png')}
         customStyles={{
           disabled:{
                 backgroundColor:'#FFFFFF00',
           },
           dateInput:{
                borderWidth:0,
                backgroundColor:'#FFFFFF',
           },
           dateIcon: {
             height:size,
             width:size,
             marginLeft:7,
           },
           dateText: [{
             alignSelf:'flex-start',
             borderWidth:0,
             color: VALUES.COLORMAP.dark_gray,
             marginRight:10,
             marginLeft: 10
           },font]
           // ... You can check the source to find the other keys.
         }}
          onDateChange={(date) => { this.props.onPress(date)} }
       />
      </View>
      );
    }
  }
  renderContent(){
    const {smallPhone} =this.props;
    var styles
    var font = {fontSize:18};
    if(smallPhone){
      styles = smallStyles
    }
    else{
      styles = largeStyles
    }
    const {options,enable,type} = this.props;
    if( type != 'time'){
      var dataColor = {textAlign:'center',color:VALUES.COLORMAP.gray_font}
      if( this.props.data && this.props.data.length > 14){
        if(smallPhone){
          font = {fontSize:22};
        }
        else{
          font = {fontSize:22};
        }
      }
      if(this.props.fontsize!=undefined){
          font = {fontSize:this.props.fontsize};
      }
      var textInput = this.props.onTextInput;
      var kType = this.props.keyboardType
      if(!kType ) kType  ='default'
      if( !textInput) textInput =()=>{}
      if(type == 'input'){
        return (  <View style={styles.inputContent}>
        <TextInput
            underlineColorAndroid='transparent'
            editable={enable}
            onFocus={()=>textInput(true)}
            onEndEditing={()=>textInput(false)}
            style={[styles.inputStyle,dataColor]}
            autoCorrect={false}
            keyboardType={kType}
            placeholder={I18n.t('請輸入')}
            secureTextEntry={false}
            value={this.props.data}
            onChangeText={this.props.onPress}>
        </TextInput>
        </View>)

      }
      else if( options){

      }
      else if(type != 'time'){
        return (
            <TouchableOpacity onPress={this.props.onPress}  style={[styles.normalContent]}>
              <Text  allowFontScaling={false} style={[dataColor,font  ]}>{this.props.data}</Text>
            </TouchableOpacity>
         )
      }
      else{
        return (
            <View style={styles.timeContent}>
              <Text  allowFontScaling={false} style={[dataColor,font  ]}>{this.props.data}</Text>
            </View>
         )
      }
    }
  }
  renderTitle(){
      const {smallPhone} =this.props;
      var styles
      if(smallPhone){
        styles = smallStyles
      }
      else{
        styles = largeStyles
      }
      const {title} = this.props;
      if( title){
        return (<View style={styles.titleStyle}>
                  <Text  allowFontScaling={false} style={styles.textStyle}>{title}</Text>
                </View>);
      }
  }
  render () {
    const {smallPhone} =this.props;
    var styles
    if(smallPhone){
      styles = smallStyles
    }
    else{
      styles = largeStyles
    }
    if(this.props.index){
      return (<View style={[{alignItems:'flex-start'}]}>
                  <View style={[styles.viewStyle,{marginTop:0,borderBottomColor:(this.props.underline!=undefined && !this.props.underline)?'#00000000':'#D4D4D4',borderBottomWidth:0.5}]}>
                      {this.renderContent()}
                      {this.renderButton()}
                  </View>
             </View>);

    }
    return (<View style={[{flex:1,flexDirection:'row',alignItems:'center'}]}>
                <View style={[styles.viewStyle,{flex:1}]}>
                    {this.renderContent()}
                    {this.renderButton()}
                </View>
           </View>);
  }
}


const largeStyles = StyleSheet.create({
  titleStyle:{width:120, height:35,alignItems:'center', justifyContent:'center',flexDirection:'row'},
  normalContent:{paddingLeft:28,flex:1,height:35,alignItems:'center', paddingLeft:10, justifyContent:'flex-start',flexDirection:"row"},
  timeContent:{width:100,alignItems:'center',height:30, paddingLeft:10, justifyContent:'flex-start',flexDirection:"row"},
  inputContent:{flex:1,height:35, paddingLeft:10},
  dataPickerView:{flex:1,height:40,flexDirection:"row"},
  viewStyle:{
    padding:5,
    borderBottomWidth:1,
    borderBottomColor:VALUES.COLORMAP.dark_gray,
    backgroundColor : 'transparent',
    justifyContent : 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    height : 40,
  },

  textDropdownStyle:{
    height:45,
    color: VALUES.COLORMAP.dark_gray,
    fontSize : 16,
    paddingRight:40,
    paddingLeft:10,
    paddingTop:5,
    paddingBottom:5
  },
  textStyle:{
    color: VALUES.COLORMAP.dark_gray,
    fontSize : 14,
  },
  imageStyle:{
    width: 35,
    height:35,
  },
  inputStyle:{
    fontSize:15,
    flex:1,
    paddingLeft:5,
    paddingRight:5,
    color:VALUES.COLORMAP.dkk_font_grey,
    lineHeight:30
  },
});


const smallStyles = StyleSheet.create({
  titleStyle:{width:120, height:35,alignItems:'center', justifyContent:'center',flexDirection:'row'},
  normalContent:{paddingLeft:28,flex:1,height:35,alignItems:'center', paddingLeft:10, justifyContent:'flex-start',flexDirection:"row"},
  timeContent:{width:100,alignItems:'center',height:30, paddingLeft:10, justifyContent:'flex-start',flexDirection:"row"},
  inputContent:{flex:1,height:35, paddingLeft:10},
  dataPickerView:{flex:1,height:40,flexDirection:"row"},
  viewStyle:{
    padding:5,
    borderBottomWidth:1,
    borderBottomColor:VALUES.COLORMAP.dark_gray,
    backgroundColor : VALUES.COLORMAP.white,
    justifyContent : 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    height : 40,
  },

  textDropdownStyle:{
    height:45,
    color: VALUES.COLORMAP.dark_gray,
    fontSize : 14,
    paddingRight:40,
    paddingLeft:10,
    paddingTop:5,
    paddingBottom:5
  },
  textStyle:{
    color: VALUES.COLORMAP.dark_gray,
    fontSize : 14,
  },
  imageStyle:{
    width: 35,
    height:35,
  },
  inputStyle:{
    fontSize:15,
    flex:1,
    paddingLeft:5,
    paddingRight:5,
    color:VALUES.COLORMAP.dkk_font_white,
    lineHeight:30
  },
  });
