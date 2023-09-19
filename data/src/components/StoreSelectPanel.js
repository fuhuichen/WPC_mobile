import React from 'react';
import {TouchableOpacity,Image,Dimensions,
     Text,View,StyleSheet,ScrollView} from 'react-native';
import VALUES from '../utils/values';
import ImageButton from './ImageButton';
import CheckBox from 'react-native-checkbox';
import DropDownSelect0 from '../components/DropDownSelect0';
import I18n from 'react-native-i18n';;

const maxMultiStoresSelect = 3;

export default class DaySelectPanel extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    var s = this.props.stores.list[this.props.stores.index];

    var country= s ? s.country : "";
    var province= s ? s.province : "";
    var city= s ? s.city : "";
    var tag = I18n.t("bi_total");
    var styles;
    const {smallPhone}= this.props;
    if(smallPhone){
      styles = smallStyles;
    } else {
      styles = largeStyles;
    }

    this.all = (this.props.all != null) ? this.props.all : false;
    this.all && (this.getProvinceList(country).length > 1) && (province = I18n.t("bi_total"));
    this.all && (this.getCityList(country,province).length > 1) && (city = I18n.t("bi_total"));

    this.state = {
      styles,
      country,
      province,
      city,
      tag,
      index: this.props.stores.index,
      indexs: this.props.stores.indexs || []
    };
  }

  getCountryList(){
     const {stores} = this.props;
     var list =[];
     for(var k in stores.list){
       if( list.indexOf(stores.list[k].country)<0){
          list.push(stores.list[k].country)
       }
     }
     return list;
  }

  getProvinceList(country){
     const {stores} = this.props;
     var list =[];
     for(var k in stores.list){
       if( stores.list[k].country==country ){
           if( list.indexOf(stores.list[k].province)<0){
              list.push(stores.list[k].province)
           }
       }
     }

     (this.all && list.length > 1) ? (list = [I18n.t("bi_total"), ...list]) : null;
     return list;
  }


  getCityList(country,province) {
    const {stores} = this.props;
    var list =[];

    if(this.all && province == I18n.t("bi_total")){
        for(var k in stores.list) {
            if(stores.list[k].country == country) {
                if( list.indexOf(stores.list[k].city)<0){
                    list.push(stores.list[k].city)
                }
            }
        }
    }else {
        for(var k in stores.list) {
            if(stores.list[k].country == country && stores.list[k].province == province) {
                if( list.indexOf(stores.list[k].city)<0){
                    list.push(stores.list[k].city)
                }
            }
        }
    }

      (this.all && list.length > 1) ? (list = [I18n.t("bi_total"), ...list]) : null;
    return list;
  }


  getTagList() {
     const {stores} = this.props;
     var list =[I18n.t("bi_total")];
     for(var k in stores.list){
       for(var n in stores.list[k].tag_ids){
         if( list.indexOf(stores.list[k].tag_ids[n])<0){
            list.push(stores.list[k].tag_ids[n]);
         }
       }
     }
     console.log("tag list , ", list);
     return list;
  }

  getFilterStore() {
    const {styles,country,province,city,tag,indexs} = this.state;
    const {stores,multi} = this.props;
    var list = [];

    if(multi) { // 多選時不同區的已選門店列在最上面
      for(var k in stores.list) {
        var store = stores.list[k];
        if( indexs.includes(store.index) ) {
          list.push(store);
        }
      }
      for(var k in stores.list) {
        var store = stores.list[k];
        if( !indexs.includes(store.index) && store.city == city && store.country==country && store.province==province
            && (store.tag_ids.includes(tag) || tag == I18n.t("bi_total")) ) {
          list.push(store);
        }
      }
    } else {
      for(var k in stores.list) {
        var store = stores.list[k];
        if(this.all && store.country==country){
            if(province == I18n.t("bi_total")){
                if(city ==  I18n.t("bi_total") || store.city == city) {
                    list.push(store);
                }
            }else {
                if (city ==  I18n.t("bi_total") && store.province==province){
                    list.push(store);
                }else if(store.city == city && store.province==province){
                    list.push(store);
                }
            }
        }else if(store.city == city && store.country==country && store.province==province){
          list.push(store);
        }
      }
    }
    return list;
  }

  renderContent () {
    const {stores} = this.props;
    //onsole.log(stores);
    var list =this.getFilterStore();
    return list.map(function(p,i){
      var img ;
      if(p.index != this.state.index ){
        img = require('../../images/POSsetting_pop_chose_icon1.png');
      } else {
        img = require('../../images/POSsetting_pop_chose_icon2.png');
      }
      return (
        <TouchableOpacity onPress={()=>{this.props.onPress(p.index);this.setState({index:p.index})}}
          style={{paddingRight:15, backgroundColor:(p.index== this.state.index) ? '#E2F3FF' : null, paddingLeft:5,
                  borderBottomWidth: 1,borderBottomColor: '#D3D4D6', height:40,justifyContent:'flex-start',alignItems:'center',flexDirection:'row'}}>
          <Text  allowFontScaling={false} style={{color:(p.index== this.state.index) ?  '#006AB7':'#86888A',fontSize:16}}>{p.name}</Text>
        </TouchableOpacity >)
      }.bind(this));
  }

  renderContent_Multi () {
    const {stores} = this.props;
    var list = this.getFilterStore();
    return list.map(function(p,i){
      var img ;
      if(this.state.indexs.includes(p.index)) {
        img = require('../../images/POSsetting_pop_chose_icon2.png');
      } else {
        img = "";
      }
      return (
        <TouchableOpacity onPress={()=>{this.setMultiStores(p.index)/*this.props.onPress(p.index);this.setState({index:p.index})*/}}
          style={{ /*backgroundColor:(p.index== this.state.index) ? '#495086' : null,*/
                  borderBottomWidth: 1,borderBottomColor: '#D3D4D6', height:40,justifyContent:'flex-start',alignItems:'center',flexDirection:'row'}}>
          <Text allowFontScaling={false} style={{color:'#86888A'}}>{p.name}</Text>
          <View style={{flex:1}}/>
          <Image style={{width:16,height:16}} source={img}/>
        </TouchableOpacity >)
    }.bind(this));
  }

  setMultiStores(index) {
    let tmpIndex = this.state.indexs || [];
    if(tmpIndex.includes(index)) {
      tmpIndex.splice(tmpIndex.indexOf(index), 1);
    } else if(tmpIndex.length < maxMultiStoresSelect) {
      tmpIndex.push(index);
    }
    this.setState({ indexs: tmpIndex});
  }

  changeCountry(id){
    const {stores} = this.props;
    const {styles,country,province,city}= this.state;
    var list =this.getCountryList();

    let provinces = '', cities = '';
    this.all && (this.getProvinceList(list[id]).length > 1) && (provinces = I18n.t("bi_total"));
    this.all && (this.getCityList(list[id],provinces).length > 1) && (cities = I18n.t("bi_total"));

    if(country!=list[id]){
      for(var k in stores.list){
        var s =stores.list[k];
        if(s.country==list[id]){
           this.setState({
             index:s.index,
             country:s.country,
             province: (provinces !== '') ? provinces : s.province,
             city: (cities !== '') ? cities : s.city
           });
           return;
        }
      }
    }
  }

  changeProvince(id) {
      const {stores} = this.props;
      const {styles, country, province, city} = this.state;
      var list = this.getProvinceList(country);

      let label = false;
      if (this.all) {
          if (list[id] == I18n.t("bi_total")) {
              let cities = this.getCityList(country, list[id]);
              this.setState({
                  province: list[id],
                  city: cities.length > 0 ? list[id] : this.state.city
              });

              label = true;
          }
      }

      if (province != list[id]) {
          for (var k in stores.list) {
              var s = stores.list[k];
              if (s.country == country && s.province == list[id]) {
                  console.log(s);
                  this.setState({
                      index: s.index,
                      country: s.country,
                      province: !label ? s.province : this.state.province,
                      city: !label ? s.city : this.state.city
                  });
                  return;
              }
          }
      }
  }

  changeCity(id){
    const {stores} = this.props;
    const {styles,country,province,city}= this.state;
    var list = this.getCityList(country,province);
    let label = false;
    let newCity = city;
    if(this.all) {
        if(list[id] == I18n.t("bi_total")) {
            this.setState({city: list[id]});
            newCity = list[id];
        } else {
            for(var k in stores.list) {
                var s = stores.list[k];
                if (s.city == list[id] && s.country == country) {
                    this.setState({city: s.city});
                    newCity = s.city;
                    break;
                }
            }
        }
        label = true;
    }

    if(city != list[id]){
      for(var k in stores.list) {
        var s = stores.list[k];
        if(s.city == list[id] && s.country==country && s.province==province) {
          this.setState({
              index:s.index,
              country: s.country ,
              province: !label ? s.province : this.state.province,
              city: !label ? s.city : newCity //this.state.city
          });
          return;
        }
      }
    }
  }

  changeTag(id){
    const {stores} = this.props;
    const {tag}= this.state;
    var list = this.getTagList();
    if(tag != list[id]) {
      this.setState({tag: list[id]});
    }
  }

  render () {
    const {styles,country,province,city,tag,indexs}= this.state;
    const {Width, Height} = this.props;
    const screen = Dimensions.get('window');
    let width=Width-44;
    return (
      <View style={{marginLeft:22,width:width,height:Height}}>
 {/*        <View style={{width,height:68,flexDirection:'row',alignContent:'center'}}>
          <Text style={{flex:1,alignSelf:'center',fontSize:19,color:'#86888A',textAlign:'center'}}>{I18n.t('Select Store')}</Text>
        </View> */}
        { this.props.multi == true ? <View style={{color:'#ffffff', borderWidth:1, borderColor:'#707070',width,borderRadius:6}}>
          <Text allowFontScaling={false} style={{color:'#86888A', padding:10}}>
            {I18n.t("bi_store_selected").replace("{0}", indexs.length).replace("{1}", maxMultiStoresSelect-indexs.length)}
          </Text>
        </View> : null }
        <View style={{flexDirection:'row',alignItems:'center',height:26,marginTop:20,width}}>
          <Text allowFontScaling={false} style={{fontSize: (I18n.locale == 'en' ? 14 : 16),color:'#86888A',width:81,marginRight:0}}>
            {I18n.t("bi_region_country")}
          </Text>
          <DropDownSelect0
            changeType={(id)=>this.changeCountry(id)}
            width={width-81}
            list={this.getCountryList()}
            content={country}/>
        </View>
        <View style={{flexDirection:'row',alignItems:'center',height:26,marginTop:20,width}}>
          <Text allowFontScaling={false} style={{fontSize:16, color:'#86888A', width:81,marginRight:0}}>
            {I18n.t("bi_region_1")}
          </Text>
          <DropDownSelect0
            changeType={(id)=>this.changeProvince(id)}
            width={width-81}
            list={this.getProvinceList(country)}
            content={province}/>
        </View>
        <View style={{flexDirection:'row',alignItems:'center',height:26,marginTop:20,width}}>
          <Text allowFontScaling={false} style={{fontSize:16, color:'#86888A', width:81,marginRight:0}}>
            {I18n.t("bi_region_2")}
          </Text>
          <DropDownSelect0
            changeType={(id)=>this.changeCity(id)}
            width={width-81}
            list={this.getCityList(country,province)}
            content={city}/>
        </View>
        {this.props.multi ? <View style={{flexDirection:'row',alignItems:'center',marginBottom:10,height:26,marginTop:20,width}}>
          <Text allowFontScaling={false} style={{fontSize: (I18n.locale == 'en' ? 14 : 16),color:'#86888A',width:81,marginRight:0}}>
            {I18n.t("bi_type")}
          </Text>
          <DropDownSelect0
            changeType={(id)=>this.changeTag(id)}
            width={width-81}
            list={this.getTagList()}
            content={tag}/>
        </View> : null}
        <View style={this.props.multi ? {height:Height-(46*4)-21,width} : {height:Height-(46*3)-21,marginTop:21,width}}>
          <ScrollView>
            { this.props.multi ? this.renderContent_Multi() : this.renderContent()}
          </ScrollView>
        </View>
      </View>
    );
  }
}

const smallStyles = StyleSheet.create({
  viewStyle:{
    flexDirection: 'row',
  },
  textStyle:{
    color: VALUES.COLORMAP.font_gray,
    fontSize : 15,
  },
  changeTextStyle:{
    fontSize : 15,
  },
  imageStyle:{
    width: 20,
    height:20,
  }
});

const largeStyles = StyleSheet.create({
  viewStyle:{
    flexDirection: 'row',
    paddingLeft:10,
  },
  textStyle:{
    color: VALUES.COLORMAP.font_gray,
    fontSize : 18,
  },
  changeTextStyle:{
    fontSize : 18,
  },
  imageStyle:{
    width: 20,
    height:20,
  }
});
