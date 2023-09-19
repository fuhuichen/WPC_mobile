import React, {Component } from 'react';
import Button from '../components/Button';
import NumberInput from '../components/NumberInput'
import DataInput from '../components/DataInput'
import StoreSelectPanel from '../components/StoreSelectPanel'
import SettingInput from '../components/SettingInput'
import {Dimensions,ScrollView,Platform,BackHandler,View,TouchableOpacity, Image,StyleSheet, Linking, TextInput,Text,AsyncStorage} from 'react-native';
import DialogManager, { ScaleAnimation, DialogContent } from 'react-native-dialog-component';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import AndroidBacker from "../../../app/components/AndroidBacker";
import ItemSelectPanel from '../components/ItemSelectPanel'
import { createIconSetFromFontello } from 'react-native-vector-icons';

exports.dlgDismiss =function(objthis){
      DialogManager.dismissAll(() => {
        if(objthis && objthis.onDlgCanel)objthis.onDlgCanel();;
      //console.log('callback - dismiss all');
    });
}

exports.dlgPressed =function(objthis,params){
      //console.log('dlgPressed')
      DialogManager.dismissAll(() => {
        if(objthis)objthis.onNextPressed(params);
    });

}


exports.openEmailDialog =function( width,title,objthis,params){
//  console.log(objthis)
  const {gray_font,blue_font,bumiddle_blue,
    dark_blue,green,background_blue,
    red,tifanny,light_gray,kpi_title_gray,
     kpi_content_gray,middle_gray,dkk_gray,
      bright_blue,white,black} = VALUES.COLORMAP;
      var email;
    DialogManager.show({
        dismissOnTouchOutside:false,
                dismissOnHardwareBackPress:false,
        title:title,
        titleAlign: 'center',
        titleTextStyle:{fontSize:18,color:'#ffffff',borderRadius:0,borderWidth:0},
        titleStyle:{backgroundColor:'#3b426e',borderTopLeftRadius:10,borderTopRightRadius:10,borderWidth:0},
        animationDuration:0,
        dialogStyle:{backgroundColor:'transparent',padding:0,width:width,marginLeft:50,marginRight:50},
        ScaleAnimation: new ScaleAnimation(),
        children: (
          <DialogContent
              contentStyle={{padding:0,
                  backgroundColor:'transparent'}}
            >
            <View style={{paddingLeft:10,paddingRight:10,backgroundColor:'#3b426e'}}>
                <NumberInput label="帳號"
                smallPhone={false}
                value={email}
                placeholder={''}
                onTextInput={(mode)=>{}}
                onChangeText={(e) => {
                   email =e;
                }}/>
            </View>
              <View style={{height:20,backgroundColor:'#3b426e'}}/>
            <View style={{height:1,backgroundColor:'#CCCCCC55'}}/>
            <View style={{flexDirection:'row',borderBottomLeftRadius:10,borderBottomRightRadius:10,
                    height:50,backgroundColor:'#3b426e'}}>
                  <View style={{flex:1}}>
                    <Button textColor={'#CCCCCC55'} color ={"transparent"} onPress={()=>{  this.dlgDismiss(objthis)}}>取消</Button>
                  </View>
                  <View style={{width:1,backgroundColor:'#CCCCCC55'}}/>
                  <View style={{flex:1}}>
                    <Button  textColor={'#ffffff'}  color ={"transparent"} onPress={()=>{  this.dlgPressed(objthis,{type:'email',email})}}>確定</Button>
                  </View>
            </View>
            <KeyboardSpacer/>
          </DialogContent>
        ),
      }, () => {
         console.log('callback - show');
    //     console.log(obj)
      });
}

exports.openNotificationDialog =function( width,title,objthis,params){
//  console.log(objthis)
  const {gray_font,blue_font,bumiddle_blue,
    dark_blue,green,background_blue,
    red,tifanny,light_gray,kpi_title_gray,
     kpi_content_gray,middle_gray,dkk_gray,
      bright_blue,white,black} = VALUES.COLORMAP;
      var email;
    DialogManager.show({
        dismissOnTouchOutside:false,
                dismissOnHardwareBackPress:false,
        title:title,
        titleAlign: 'center',
        titleTextStyle:{fontSize:18,color:'#ffffff',borderRadius:0,borderWidth:0},
        titleStyle:{backgroundColor:'#3b426e',borderTopLeftRadius:10,borderTopRightRadius:10,borderWidth:0},
        animationDuration:0,
        dialogStyle:{backgroundColor:'transparent',padding:0,width:width,marginLeft:50,marginRight:50},
        ScaleAnimation: new ScaleAnimation(),
        children: (
          <DialogContent
              contentStyle={{padding:0,
                  backgroundColor:'transparent'}}
            >
            <View style={{paddingLeft:10,paddingRight:10,backgroundColor:'#3b426e'}}>
                <NumberInput label="帳號"
                smallPhone={false}
                value={email}
                placeholder={''}
                onTextInput={(mode)=>{}}
                onChangeText={(e) => {
                   email =e;
                }}/>
            </View>
              <View style={{height:20,backgroundColor:'#3b426e'}}/>
            <View style={{height:1,backgroundColor:'#CCCCCC55'}}/>
            <View style={{flexDirection:'row',borderBottomLeftRadius:10,borderBottomRightRadius:10,
                    height:50,backgroundColor:'#3b426e'}}>
                  <View style={{flex:1}}>
                    <Button  textColor={'#ffffff'}  color ={"transparent"} onPress={()=>{  this.dlgPressed(objthis,{type:'email',email})}}>確定</Button>
                  </View>
            </View>
            <KeyboardSpacer/>
          </DialogContent>
        ),
      }, () => {
         console.log('callback - show');
    //     console.log(obj)
      });
}


exports.openConfirmDialog =function( width,title, content ,objthis,params){
//  console.log(objthis)
  const {gray_font,blue_font,bumiddle_blue,
    dark_blue,green,background_blue,
    red,tifanny,light_gray,kpi_title_gray,
     kpi_content_gray,middle_gray,dkk_gray,
      bright_blue,white,black} = VALUES.COLORMAP;
    DialogManager.show({
        dismissOnTouchOutside:false,
                dismissOnHardwareBackPress:false,
        title:'      ',
        //titleAlign: 'center',
        titleTextStyle:{fontSize:1,color:VALUES.COLORMAP.dkk_blue,borderRadius:0,borderWidth:0},
        titleStyle:{backgroundColor:'#F7F9FA',borderRadius:10,borderWidth:0},
        animationDuration:0,
        dialogStyle:{backgroundColor:'#F7F9FA',borderRadius:10,padding:0,width:width,marginLeft:50,marginRight:50},
        ScaleAnimation: new ScaleAnimation(),
        children: (
          <DialogContent
              contentStyle={{padding:0,borderRadius:10}}
            >
             <View style={{flexDirection: 'row',justifyContent: 'space-between', alignItems:'center', marginTop:-40,paddingLeft:24,paddingRight:24}}>
                    <Text  allowFontScaling={false} style={{textAlign:'center',fontSize:19,color:'#86888a'}}>{I18n.t('Save confirm')}</Text>
                    <Image style={{width:30,height:30}} source={require('../../../app/assets/images/warning_icon_model.png')}/>
             </View>
            <Text  allowFontScaling={false} style={{fontSize:16,color:'#86888a',paddingLeft:24,marginTop:18}}>{content}</Text>

            <View style={{height:1,backgroundColor:'#EBF1F5',marginTop:25}}>
            </View>
            <View style={{flexDirection:'row-reverse',backgroundColor:'white',borderRadius:10}}>
                  <View style={{paddingRight:10, paddingLeft:10}}>
                    <Button  textColor={VALUES.COLORMAP.dkk_blue}  color ={"transparent"} onPress={()=>{  this.dlgPressed(objthis,params)}}
                        onExit={()=>{}}>{I18n.t('Confirm')}</Button>
                  </View>
                  <View style={{paddingRight:10, paddingLeft:10}}>
                    <Button textColor={VALUES.COLORMAP.dkk_blue} color ={"transparent"} onPress={()=>{  this.dlgDismiss(objthis)}}
                        onExit={()=>{this.dlgDismiss(objthis)}}>{I18n.t('Cancel')}</Button>
                  </View>
            </View>
            <AndroidBacker onPress={() => {
              this.dlgDismiss(objthis);
              return true;
            }}/>
          </DialogContent>
        ),
      }, () => {
         console.log('callback - show');
    //     console.log(obj)
      });
}



exports.openAlertDialog =function( width,title, content ,objthis,params){
//  console.log(objthis)
  const {gray_font,blue_font,bumiddle_blue,
    dark_blue,green,background_blue,
    red,tifanny,light_gray,kpi_title_gray,
     kpi_content_gray,middle_gray,dkk_gray,
      bright_blue,white,black} = VALUES.COLORMAP;
    DialogManager.show({
        dismissOnTouchOutside:false,
                dismissOnHardwareBackPress:false,
        title:'      ',
        titleAlign: 'center',
        titleTextStyle:{fontSize:1,color:gray_font,borderRadius:0,borderWidth:0},
        titleStyle:{backgroundColor:'#3b426e',borderRadius:10,borderWidth:0},
        animationDuration:0,
        dialogStyle:{backgroundColor:'#3b426e',borderRadius:10,padding:0,width:width,marginLeft:50,marginRight:50},
        ScaleAnimation: new ScaleAnimation(),
        children: (
          <DialogContent
              contentStyle={{padding:0,borderRadius:10,backgroundColor:'#3b426e'}}
            >
            <View style={{padding:5,alignItems:'center',justifyContent:'center'}}>
                    <Text  allowFontScaling={false} style={{textAlign:'center',fontSize:18,color:'#ffffff'}}>
                    {content}
                    </Text>
            </View>
            <View style={{height:1,backgroundColor:'#CCCCCC55',marginTop:25}}>
            </View>
            <View style={{flexDirection:'row'}}>
                  <View style={{flex:1}}>
                    <Button  textColor={'#ffffff'}  color ={"transparent"} onPress={()=>{  this.dlgPressed(objthis,params)}}>確定</Button>
                  </View>
            </View>
          </DialogContent>
        ),
      }, () => {
         console.log('callback - show');
    //     console.log(obj)
      });
}
exports.openStoresDialog =function( width, title,stores ,objthis,params){
  const {white} = VALUES.COLORMAP;
  var index =stores.index;
  DialogManager.show({
    dismissOnTouchOutside:true,
    dismissOnHardwareBackPress:false,
    title:title,
    titleAlign: 'center',
    titleTextStyle:{fontSize:19,color:'#86888A',borderRadius:0,borderWidth:0},
    titleStyle:{backgroundColor:'#F7F9FA',borderRadius:10,borderWidth:0},
    animationDuration:0,
    dialogStyle:{backgroundColor:'#F7F9FA',borderRadius:10,padding:2,width:width,height:561},
    ScaleAnimation: new ScaleAnimation(),
    children: (
      <DialogContent contentStyle={{padding:0,borderRadius:10,height:535}}>
        <View style={{height:420}} >
          <View style={{marginTop:0}}>
            <StoreSelectPanel stores={stores} all={true} multi={false} Width={width} Height={420}
                 onPress={(p)=>{index=p;this.dlgPressed(objthis,{type:params.type,index})}} />
          </View>
        </View>
        <View style={{height:1,backgroundColor:'#EBF1F5',marginTop:25}}>
        </View>
        <View style={{flexDirection:'row-reverse',backgroundColor:'white',borderRadius:10}}>
          <View style={{paddingRight:10, paddingLeft:10}}>
            <Button textColor={'#006AB7'} color ={"transparent"} onPress={()=>{this.dlgDismiss(objthis)}}
                onExit={()=>{this.dlgDismiss(objthis)}}>{I18n.t('Confirm')}
            </Button>
          </View>
          <View style={{paddingRight:10, paddingLeft:10}}>
            <Button textColor={'#006AB7'} color ={"transparent"} onPress={()=>{this.dlgDismiss(objthis)}}
                onExit={()=>{this.dlgDismiss(objthis)}}>{I18n.t('Cancel')}
            </Button>
          </View>
        </View>
        <AndroidBacker onPress={() => {
              this.dlgDismiss(objthis);
              return true;
        }}/>
      </DialogContent>
    ),
  }, () => {
     console.log('callback - show');
  });
}

exports.openItemMultiSelectDialog = function(width, title, items, objthis, params) {
  const {white} = VALUES.COLORMAP;
  DialogManager.show({
    dismissOnTouchOutside:false,
    dismissOnHardwareBackPress:false,
    title:'       ',
    titleAlign: 'center',
    titleTextStyle:{fontSize:1,color:white,borderRadius:0,borderWidth:0},
    titleStyle:{display:'none',height:1,backgroundColor:'#F7F9FA',borderRadius:2,borderWidth:0},
    animationDuration:0,
    dialogStyle:{backgroundColor:'#F7F9FA',borderRadius:2,padding:0,width:width,marginTop:50},
    ScaleAnimation: new ScaleAnimation(),
    children: (
      <DialogContent contentStyle={{padding:0,borderRadius:2,backgroundColor:'#F7F9FA'}}>
        <View style={{height:320}} >
          <View style={{marginTop:20}}>
            <ItemSelectPanel items={items} multi={true}/>
          </View>
        </View>
        <View style={{height:1,backgroundColor:'#CCCCCC55',marginTop:25}}>
        </View>
        <View style={{flexDirection:'row',justifyContent:'center'}}>
          <View style={{width:width / 2}}>
            <Button textColor={'#006AB7'} color ={"transparent"} onPress={()=>{this.dlgDismiss(objthis)}}
                onExit={()=>{this.dlgDismiss(objthis)}}>{I18n.t('Cancel')}</Button>
          </View>
          <View style={{width:1,backgroundColor:'#CCCCCC55'}}>
          </View>
          <View style={{width:width / 2}}>
            <Button textColor={'#006AB7'} color ={"transparent"} onPress={()=>{this.dlgPressed(objthis,{type:params.type, items})}}
                onExit={()=>{}}>{I18n.t('Confirm')}</Button>
          </View>
        </View>
        <AndroidBacker onPress={() => {
              this.dlgDismiss(objthis);
              return true;
            }}/>
      </DialogContent>
    ),
  }, () => {
     console.log('callback - show');
  });
}

exports.openItemSingleSelectDialog =function( width, title,items,objthis,params){
  const {white} = VALUES.COLORMAP;
  var index = items.index;
  DialogManager.show({
    dismissOnTouchOutside:true,
    dismissOnHardwareBackPress:false,
    title:'       ',
    titleAlign: 'center',
    titleTextStyle:{fontSize:1,color:white,borderRadius:0,borderWidth:0},
    titleStyle:{display:'none',height:1,backgroundColor:'#F7F9FA',borderRadius:2,borderWidth:0},
    animationDuration:0,
    dialogStyle:{backgroundColor:'#F7F9FA',borderRadius:2,padding:0,width:width,marginTop:50},
    ScaleAnimation: new ScaleAnimation(),
    children: (
      <DialogContent contentStyle={{padding:0,borderRadius:2,backgroundColor:'#F7F9FA'}}>
        <View style={{height:320}} >
          <View style={{marginTop:30}}>
            <ItemSelectPanel items={items} all={true}
                 onPress={(p)=>{index=p;this.dlgPressed(objthis,{type:params.type,index})}} />
          </View>
        </View>
        <View style={{height:1,backgroundColor:'#CCCCCC55',marginTop:25}}>
        </View>
        <View style={{flexDirection:'row',justifyContent:'center'}}>
          <View style={{width:100}}>
            <Button textColor={'#006AB7'} color ={"transparent"} onPress={()=>{this.dlgDismiss(objthis)}}
                onExit={()=>{this.dlgDismiss(objthis)}}>{I18n.t('Cancel')}</Button>
          </View>
        </View>
        <AndroidBacker onPress={() => {
              this.dlgDismiss(objthis);
              return true;
            }}/>
      </DialogContent>
    ),
  }, () => {
     console.log('callback - show');
  });
}

exports.openStoresCompareDialog = function(width, title, stores, objthis, params) {
  //console.log('width:',width)
  //const {white} = VALUES.COLORMAP;
  //var index = stores.index;
  DialogManager.show({
    dismissOnTouchOutside:false,
    dismissOnHardwareBackPress:false,
    title:title,
    titleAlign: 'center',
    titleTextStyle:{fontSize:19,color:'#86888A',borderRadius:0,borderWidth:0},
    titleStyle:{display:'none',height:68,backgroundColor:'#F7F9FA',borderRadius:2,borderWidth:0,width},
    animationDuration:0,
    dialogStyle:{backgroundColor:'#F7F9FA',borderRadius:5,padding:0,width:width},
    ScaleAnimation: new ScaleAnimation(),
    children: (
      <DialogContent contentStyle={{padding:0,borderRadius:5,backgroundColor:'#F7F9FA',height:535}}>
        <View style={{height:483}} >
          <View style={{marginTop:20}}>
            <StoreSelectPanel stores={stores} multi={true} Width={width} Height={463} />
          </View>
        </View>
        <View style={{height:1,backgroundColor:'#EBF1F5',marginTop:25}}>
        </View>
        <View style={{flexDirection:'row-reverse',alignContent:'center',backgroundColor:'#FFFFFF',width,heigth:52,borderBottomLeftRadius:5,borderBottomRightRadius:5}}>
          <View style={{width:76,borderBottomRightRadius:5,paddingRight:5,heigth:52}}>
            <Button textColor={'#006AB7'} color ={'#FFF'} onPress={()=>{this.dlgPressed(objthis,{type:params.type, stores})}}
                onExit={()=>{}}>{I18n.t('Confirm')}</Button>
          </View>
          <View style={{width:1,backgroundColor:'#F7F9FA'}}></View>
          <View style={{width:76,heigth:52}}>
            <Button textColor={'#006AB7'} color ={"#FFF"} onPress={()=>{this.dlgDismiss(objthis)}}
                onExit={()=>{this.dlgDismiss(objthis)}}>{I18n.t('Cancel')}</Button>
          </View>
        </View>
      </DialogContent>
    ),
  }, () => {
     console.log('callback - show');
  });
}

exports.openAddSchoolDialog =function( width,title, content,btnTitle ,objthis,params){
//  console.log(objthis)
  const {gray_font,blue_font,bumiddle_blue,
    dark_blue,green,background_blue,
    red,tifanny,light_gray,kpi_title_gray,
     kpi_content_gray,middle_gray,
      bright_blue,white,black} = VALUES.COLORMAP;
     var number

      DialogManager.show({
          dismissOnTouchOutside:false,
                  dismissOnHardwareBackPress:false,
          title:title,
          titleAlign: 'center',
          titleTextStyle:{fontSize:19,color:gray_font,borderRadius:0,borderWidth:0},
          titleStyle:{backgroundColor:white,borderTopLeftRadius:10,borderTopRightRadius:10,borderWidth:0},
          animationDuration:0,
          dialogStyle:{backgroundColor:"transparent",borderRadius:10,padding:0,width:width,marginLeft:50,marginRight:50,
            elevation: 0,
            shadowColor: 'transparent',
            shadowOpacity: 0.2,
            shadowRadius: 0,
            shadowOffset: {
              width: 0,
              height: 0,
            },
          },
          ScaleAnimation: new ScaleAnimation(),
          children: (
            <DialogContent
                contentStyle={{padding:0,borderRadius:10}}
              >
              <View style={{borderBottomLeftRadius:10,borderBottomRightRadius:10,backgroundColor:white}}>
              <View style={{padding:5,alignItems:'center',justifyContent:'center'}}>
                      <Text  allowFontScaling={false} style={{textAlign:'center',fontSize:13,color:blue_font}}>
                      {content}
                      </Text>
              </View>
              <View style={{height:16}}/>
              <View style={{backgroundColor:white,paddingLeft:10,paddingRight:10}}>
                  <NumberInput label="帳號"
                  smallPhone={false}
                  value={number}
                  placeholder={'請輸入正確學校'}
                  onTextInput={(mode)=>this.setInputMode(mode)}
                  onChangeText={(classNo) => {
                      number =classNo;
                  }}/>
              </View>
              <View style={{height:1,backgroundColor:gray_font,marginTop:25}}>
              </View>
              <View style={{flexDirection:'row'}}>
                    <View style={{flex:1}}>
                                  <Button color ={"transparent"} onPress={()=>{  this.dlgDismiss((objthis))}}>取消</Button>
                    </View>
                    <View style={{width:1,backgroundColor:middle_gray}}/>
                    <View style={{flex:1}}>
                    <Button color ={"transparent"} onPress={()=>{ params.name=number;if(number){ this.dlgPressed(objthis,{name:number})}}}>確定</Button>
                    </View>
              </View>
              </View>
              <KeyboardSpacer/>
            </DialogContent>
          ),
        }, () => {
           console.log('callback - show');
      //     console.log(obj)
        });
}


exports.setInputMode =function(mode){}
exports.openChangeNumberDialog =function( width,title, content,btnTitle ,objthis,params){
//  console.log(objthis)
  const {gray_font,blue_font,bumiddle_blue,
    dark_blue,green,background_blue,
    red,tifanny,light_gray,kpi_title_gray,
     kpi_content_gray,middle_gray,
      bright_blue,white,black} = VALUES.COLORMAP;
    var number
    DialogManager.show({
        dismissOnTouchOutside:false,
                dismissOnHardwareBackPress:false,
        title:title,
        titleAlign: 'center',
        titleTextStyle:{fontSize:19,color:gray_font,borderRadius:0,borderWidth:0},
        titleStyle:{backgroundColor:white,borderTopLeftRadius:10,borderTopRightRadius:10,borderWidth:0},
        animationDuration:0,
        dialogStyle:{backgroundColor:"transparent",borderRadius:10,padding:0,width:width,marginLeft:50,marginRight:50,
          elevation: 0,
          shadowColor: 'transparent',
          shadowOpacity: 0.2,
          shadowRadius: 0,
          shadowOffset: {
            width: 0,
            height: 0,
          },
        },
        ScaleAnimation: new ScaleAnimation(),
        children: (
          <DialogContent
              contentStyle={{padding:0,borderRadius:10}}
            >
            <View style={{borderBottomLeftRadius:10,borderBottomRightRadius:10,backgroundColor:white}}>
            <View style={{padding:5,alignItems:'center',justifyContent:'center'}}>
                    <Text  allowFontScaling={false} style={{textAlign:'center',fontSize:13,color:blue_font}}>
                    {content}
                    </Text>
            </View>
            <View style={{height:16}}/>
            <View style={{backgroundColor:white,paddingLeft:10,paddingRight:10}}>
                <NumberInput label="帳號"
                smallPhone={false}
                value={number}
                placeholder={'請輸入正確的座號'}
                onTextInput={(mode)=>this.setInputMode(mode)}
                onChangeText={(classNo) => {
                    number =classNo;
                }}/>
            </View>
            <View style={{height:1,backgroundColor:gray_font,marginTop:25}}>
            </View>
            <View style={{flexDirection:'row'}}>
                  <View style={{flex:1}}>
                                <Button color ={"transparent"} onPress={()=>{  this.dlgDismiss((objthis))}}>取消</Button>
                  </View>
                  <View style={{width:1,backgroundColor:middle_gray}}/>
                  <View style={{flex:1}}>
                  <Button color ={"transparent"} onPress={()=>{ params.number=number;if(number){ this.dlgPressed(objthis,params)}}}>確定</Button>
                  </View>
            </View>
            </View>
            <KeyboardSpacer/>
          </DialogContent>
        ),
      }, () => {
         console.log('callback - show');
    //     console.log(obj)
      });
}


exports.openDialog =function( width,title, content,btnTitle ,objthis,params){
  console.log('Open Dialog')
  const {gray_font,blue_font,bumiddle_blue,
    dark_blue,green,background_blue,
    red,tifanny,light_gray,kpi_title_gray,
     kpi_content_gray,middle_gray,
      bright_blue,white,black} = VALUES.COLORMAP;
    DialogManager.show({
        dismissOnTouchOutside:false,
                dismissOnHardwareBackPress:false,
        title:title,
        titleAlign: 'center',
        titleTextStyle:{fontSize:19,color:gray_font,borderRadius:0,borderWidth:0},
        titleStyle:{borderRadius:10,borderWidth:0},
        animationDuration:0,
        dialogStyle:{borderRadius:10,padding:0,width:width,marginLeft:50,marginRight:50},
        ScaleAnimation: new ScaleAnimation(),
        children: (
          <DialogContent
              contentStyle={{backgroundColor:red,padding:0,borderRadius:10,backgroundColor:white}}
            >
            <View style={{padding:5,alignItems:'center',justifyContent:'center'}}>
                    <Text  allowFontScaling={false} style={{textAlign:'center',fontSize:13,color:blue_font}}>
                    {content}
                    </Text>
            </View>
            <View style={{height:1,backgroundColor:gray_font,marginTop:25}}>
            </View>
            <View style={{flexDirection:'row'}}>
                  <View style={{flex:1}}>
                  <Button color ={"transparent"} onPress={()=>{  this.dlgPressed(objthis,params)}}>{btnTitle}</Button>
                  </View>
            </View>
          </DialogContent>
        ),
      }, () => {
         console.log('callback - show');
    //     console.log(obj)
      });
}
exports.renderDaySel=function(day,width,title, content,btnTitle ,objthis,params){
  var dayList=[1,2,3,4,7,10];

  //this.dlgPressed(objthis,{type:'finish',day:p})
  return  dayList.map(function(p,i){

      if(  p== day){
        var circleColor
        if(p <3){
             circleColor =VALUES.COLORMAP.deadline_red;
        }
        else if(p>=7){
             circleColor =VALUES.COLORMAP.deadline_green;
        }
        else{
             circleColor =VALUES.COLORMAP.deadline_orange;
        }
          return (<View style={{height:40,justifyContent:'center',alignItems:'center',flex:1}}>
                     <TouchableOpacity  onPress={()=>{}} style={{justifyContent:'center',alignItems:'center',height:40,width:40}}>
                     <View style={{justifyContent:'center',alignItems:'center',borderRadius: 30,height:30,width:30,backgroundColor:circleColor }}>
                         <Text  allowFontScaling={false} style={{color: VALUES.COLORMAP.white}}>{p}</Text>
                     </View>
                     </TouchableOpacity >
                   </View>)
      }
      else {

               return (<View style={{height:40,justifyContent:'center',alignItems:'center',flex:1}}>
                        <TouchableOpacity  onPress={()=>{day=p;this.updateFinishDialog(p, width,title, content,btnTitle ,objthis,params)}} style={{justifyContent:'center',alignItems:'center',height:40,width:40}}>
                        <View style={{justifyContent:'center',alignItems:'center',borderRadius: 30,height:30,width:30,backgroundColor:VALUES.COLORMAP.gray_middle}}>
                            <Text  allowFontScaling={false} style={{color: VALUES.COLORMAP.white}}>{p}</Text>
                        </View>
                        </TouchableOpacity >
                      </View>)

      }

  }.bind(this) );
}




exports.openFirstDialog =function( width,title, content,btnTitle ,objthis,params){
  console.log(objthis)
  const {gray_font,blue_font,bumiddle_blue,
    dark_blue,green,background_blue,
    red,tifanny,light_gray,kpi_title_gray,
     kpi_content_gray,middle_gray,
      bright_blue,white,black} = VALUES.COLORMAP;
    DialogManager.show({
        dismissOnTouchOutside:false,
        dismissOnHardwareBackPress:false,
        title:title,
        titleAlign: 'flex-start',
        titleTextStyle:{fontSize:19,color:gray_font,borderRadius:0,borderWidth:0},
        titleStyle:{borderRadius:10,borderWidth:0},
        animationDuration:0,
        dialogStyle:{borderRadius:10,padding:0,width:width,marginLeft:50,marginRight:50},
        ScaleAnimation: new ScaleAnimation(),
        children: (
          <DialogContent
              contentStyle={{backgroundColor:red,padding:0,borderRadius:10,backgroundColor:white}}
            >
            <View style={{padding:10,alignItems:'flex-start',justifyContent:'center'}}>
                    <Text  allowFontScaling={false} style={{textAlign:'center',fontSize:14,color:blue_font}}>
                    {'小天使叮嚀！'}
                    </Text>
                    <Text  allowFontScaling={false} style={{textAlign:'center',fontSize:12,color:blue_font}}>
                    {'\n每道題目測驗都要進行3次，才視為完成過關。\n'}
                    </Text>
                    <Text  allowFontScaling={false} style={{textAlign:'center',fontSize:14,color:'#FF0000'}}>
                    {'若題目只完成一次算過關嗎？！'}
                    </Text>
                    <Text  allowFontScaling={false} style={{textAlign:'center',fontSize:12,color:blue_font}}>
                    {'小天使：不算喔！ 那你這題目視為失敗，請你重新來過！\n\n'}
                    </Text>
                    <Text  allowFontScaling={false} style={{textAlign:'center',fontSize:14,color:'#FF0000'}}>
                    {'若題目做到一半，中途離開呢？'}
                    </Text>

                    <Text  allowFontScaling={false} style={{textAlign:'center',fontSize:12,color:blue_font}}>
                    {'小天使：失敗，請重新來過。\n\n'}
                    </Text>
                    <Text  allowFontScaling={false} style={{textAlign:'center',fontSize:12,color:blue_font}}>
                    {'同學們，請認真完成三次達到過關，你就完成了,'}
                    </Text>
                    <Text  allowFontScaling={false} style={{textAlign:'center',fontSize:12,color:blue_font}}>
                    {'你就可以針對題目設定想複習的時間。\n'}
                    </Text>
                    <Text  allowFontScaling={false} style={{textAlign:'center',fontSize:12,color:blue_font}}>
                    {'\n每道題目都不會重複，不要偷懶，認真作答！\n'}
                    </Text>
            </View>
            <View style={{height:1,backgroundColor:gray_font,marginTop:25}}>
            </View>
            <View style={{flexDirection:'row'}}>
                  <View style={{flex:1}}>
                  <Button color ={"transparent"} onPress={()=>{  this.dlgPressed(objthis,params)}}
                    onExit={()=>{thid.dlgDismiss(objthis)}}>{btnTitle}</Button>
                  </View>
            </View>
          </DialogContent>
        ),
      }, () => {
         console.log('callback - show');
    //     console.log(obj)
      });
}

exports.openNotifyDialog =function( width,title, content,btnTitle ,objthis,params){
  console.log(objthis)
  const {gray_font,blue_font,bumiddle_blue,
    dark_blue,green,background_blue,
    red,tifanny,light_gray,kpi_title_gray,
     kpi_content_gray,middle_gray,
      bright_blue,white,black} = VALUES.COLORMAP;
    DialogManager.show({
        dismissOnTouchOutside:false,
                dismissOnHardwareBackPress:false,
        title:title,
        titleAlign: 'flex-start',
        titleTextStyle:{fontSize:19,color:blue_font,borderRadius:0,borderWidth:0},
        titleStyle:{borderRadius:10,borderWidth:0},
        animationDuration:0,
        dialogStyle:{borderRadius:10,padding:0,width:width,marginLeft:50,marginRight:50},
        ScaleAnimation: new ScaleAnimation(),
        children: (
          <DialogContent
              contentStyle={{backgroundColor:red,padding:0,borderRadius:10,backgroundColor:white}}
            >
            <View style={{padding:10,alignItems:'flex-start',justifyContent:'center'}}>
                    <Text  allowFontScaling={false} style={{textAlign:'left',fontSize:14,color:gray_font}}>
                    {content}
                    </Text>
            </View>
            <View style={{height:1,backgroundColor:gray_font,marginTop:25}}>
            </View>
            <View style={{flexDirection:'row'}}>
                  <View style={{flex:1}}>
                  <Button color ={"transparent"} onPress={()=>{  this.dlgPressed(objthis,params)}}
                    onExit={()=>{this.dlgDismiss(objthis)}}>{btnTitle}</Button>
                  </View>
            </View>
          </DialogContent>
        ),
      }, () => {
         console.log('callback - show');
    //     console.log(obj)
      });
}


exports.openRuleDialog =function(height, width,title, content,btnTitle ,objthis,params){
    const screen = Dimensions.get('window')
  var t = ''
    var img = require('../../images/img_rule.png')
  const {gray_font,blue_font,bumiddle_blue,
    dark_blue,green,background_blue,
    red,tifanny,light_gray,kpi_title_gray,
     kpi_content_gray,middle_gray,
      bright_blue,white,black} = VALUES.COLORMAP;
    DialogManager.show({
        dialogTitle:{backgroundColor:"transparent",haveTitleBar:false},
        height:height,
        dismissOnTouchOutside:false,
                dismissOnHardwareBackPress:false,
        animationDuration:0,
        dialogStyle:{height:screen.height,padding:0,backgroundColor:"transparent",shadowOffset:{height:0,width:0},shadowColor:"transparent"},
        ScaleAnimation: new ScaleAnimation(),
        children: (
          <DialogContent
              contentStyle={{padding:0,borderRadius:0,backgroundColor:'transparent'}}
            >
            <View style={{paddingTop:0,paddingBottom:10,height:height-50,alignItems:'center',justifyContent:'center'}}>

            <ScrollView>
                    <Image style={{width:width,height:4*width}}  resizeMode={'contain'}   source={img}/>
            </ScrollView>
            <TouchableOpacity style={{width:width,height:100,position: 'absolute',top:0,left:0}} onPress={()=>{  this.dlgPressed(objthis,params)}}>
            </TouchableOpacity>
            </View>

          </DialogContent>
        ),
      }, () => {
         console.log('callback - show');
    //     console.log(obj)
      });
}
