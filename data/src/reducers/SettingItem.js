import React from 'react';
import {Image, Text,View,StyleSheet} from 'react-native';
import VALUES from '../utils/values';
import ImageButton from './ImageButton';
import ImageView from './ImageView';
import ModalDropdown from 'react-native-modal-dropdown';
import DatePicker from 'react-native-datepicker'
export default class SettingItem extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
  }
  renderButton(){
    const {options,date,enable,type,data} = this.props;
    var dataColor = {color:VALUES.COLORMAP.black};
    if( !enable){
      dataColor = {color:VALUES.COLORMAP.light_gray};
    }
    if( type != 'time'){
      if( options){
        //console.log('options' + options)
        return (
          <View style={{marginRight:5}}>
            <ModalDropdown options={options} onSelect={this.props.onPress}  dropdownStyle={{padding:7}} dropdownTextStyle={styles.textStyle}>
              <ImageView height={30} width={30} type={this.props.type} />
            </ModalDropdown>
            </View>
        );
      }
      else{
        return (<View style={{marginRight:5}}><ImageButton height={30} width={30} type={this.props.type} onPress={this.props.onPress} /></View>)
      }
    }
    else{
      return (
         <View style={{flex:1,flexDirection:"row"}}>
         <DatePicker
         style={{alignItems:'center',flex:1, backgroundColor: VALUES.COLORMAP.white}}
         date={date}
         mode="date"
         disabled={!enable}
         format="YYYY-MM-DD"
         minDate="2015-05-01"
         maxDate="2018-05-01"
         confirmBtnText="Confirm"
         cancelBtnText="Cancel"
         iconSource={require('../../resources/img/time.png')}
         customStyles={{
           disabled:{
                 backgroundColor:'#FFFFFF00',
           },
           dateInput:{
                borderWidth:0,
                backgroundColor:'#FFFFFF',
           },
           dateIcon: {
             marginLeft:5
           },
           dateText: {
             fontSize:16,
             alignSelf:'flex-start',
             borderWidth:0,
             color: VALUES.COLORMAP.white,
             marginRight:10,
             marginLeft: 10
           }
           // ... You can check the source to find the other keys.
         }}
          onDateChange={(date) => { this.props.onPress(date)} }
       />
           <Text  allowFontScaling={false} style={[styles.changeTextStyle,dataColor,{position: 'absolute',left: 10,top: 8,marginLeft: 0} ]}>{data}</Text>
      </View>
      );
    }
  }
  renderContent(){
    const {enable,type} = this.props;
    if( type != 'time'){
      var dataColor = {color:VALUES.COLORMAP.black}
      if( !enable){
        dataColor = {color:VALUES.COLORMAP.light_gray};
      }
      return (

          <View style={{flex:1,width:100,alignItems:'center', paddingLeft:10, justifyContent:'flex-start',flexDirection:"row"}}>
            <Text  allowFontScaling={false} style={[styles.textStyle,dataColor ]}>{this.props.data}</Text>
          </View>
       )
    }
  }
  renderTitle(){
      const {title} = this.props;
      if( title){
        return (<View style={{width:100,alignItems:'flex-start', justifyContent:'flex-start'}}>
                  <Text  allowFontScaling={false} style={styles.textStyle}>{title}</Text>
                </View>);
      }
  }
  render () {

    return (<View style={styles.viewStyle}>
                {this.renderTitle()}
                <View style={{height:50,width:1,backgroundColor:VALUES.COLORMAP.middle_gray}}/>
                {this.renderContent()}
                {this.renderButton()}
            </View>);
  }
}

SettingItem.propTypes = {   headerText: React.PropTypes.string.isRequired};
SettingItem.defaultProps = {   headerText: 'ABC'};

const styles = StyleSheet.create({
  viewStyle:{
    paddingRight:15,
    backgroundColor : VALUES.COLORMAP.white,
    justifyContent : 'space-between',
    flexDirection: 'row',
    alignItems: 'flex-start',
    height : 50,
  },
  textStyle:{
    color: VALUES.COLORMAP.black,
    fontSize : 16,
  },
  changeTextStyle:{
    fontSize : 16,
  },
  imageStyle:{
    width: 50,
    height:50,
  }
});
