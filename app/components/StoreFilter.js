import React,{Component} from 'react';
import {
    StyleSheet,
    View,
    Platform,
    Dimensions,
    TouchableOpacity,
    Image,
    Text,
    DeviceEventEmitter,
    FlatList,
    findNodeHandle,
    UIManager
} from "react-native";
import I18n from "react-native-i18n";
import PropTypes from 'prop-types';
import SlideModalEx from "../components/SlideModal";
import PhoneInfo from "../entities/PhoneInfo";
import HttpUtil from "../utils/HttpUtil";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class StoreFilter extends Component{
    static propTypes = {
        onConfirm: PropTypes.func,
        onChange:PropTypes.func    
    };


    constructor(props){
        super(props);

        this.width = PhoneInfo.isEnLanguage() ? 90 : 65;
     
        this.state = {
            data:{
                country:I18n.t('All'),
                tag:I18n.t('All'),
                province: I18n.t('All'),
                city: I18n.t('All')
            },
            countries:[I18n.t('All')],
            tags:[I18n.t('All')],       
            provinces: [I18n.t('All')],
            cities: [I18n.t('All')]
        }; 
        this.tag = [],
        this.store = []
        this.offsetY = Platform.OS == 'ios' ? 15:40;
    }

    async componentDidMount() {       
        if (this.props.lastStore != null){
            let data = this.state.data;
            data.country = this.props.lastStore.country;
            data.tag = this.props.lastStore.tag;
            data.province = this.props.lastStore.province;
            data.city = this.props.lastStore.city;
            await this.setState({data});
        }
        if(this.props.store != null){
            this.store = this.props.store;
        }
        else{
            if (await HttpUtil.getAsync('store/brief/list')){
                let result = HttpUtil.getApiResult();
                this.store = result.data;             
            }
        }
        await this.initStore();
       
        if (await HttpUtil.getAsync('tag/list')){
            let result = HttpUtil.getApiResult();
            this.tag = result.data;
            await this.initTag();
        }

        this.emitter = DeviceEventEmitter.addListener('OnStoreConfirm', this.StoreConfirmClick.bind(this));
    }

    componentWillUnmount(){
        this.unInit();
        this.emitter && this.emitter.remove();
    }

    async initStore(){      
        if (this.props.lastStore == null){
            this.store.forEach((item,index)=>{
                if (this.state.countries.findIndex ( p => p == item.country) == -1){
                    this.state.countries.push(item.country);
                }
                if (this.state.provinces.findIndex ( p => p == item.province) == -1){
                    this.state.provinces.push(item.province);
                }
                if (this.state.cities.findIndex ( p => p == item.city) == -1){
                    this.state.cities.push(item.city);
                }
             })
             await this.setState({countries: this.state.countries,provinces: this.state.provinces,cities: this.state.cities});
             this.onCountrySelect(this.state.countries[0]);
        }
        else{
            let data = this.state.data;
            this.store.forEach((item,index)=>{
                if (this.state.countries.findIndex ( p => p == item.country) == -1){
                    this.state.countries.push(item.country);
                }
                if (this.state.provinces.findIndex ( p => p == item.province) == -1){
                    if (data.country == I18n.t('All') || data.country != I18n.t('All') && item.country == data.country ){
                        this.state.provinces.push(item.province);                    
                    }                            
                }
                if (this.state.cities.findIndex ( p => p == item.city) == -1){
                    if (data.country == I18n.t('All') || data.country != I18n.t('All') && item.country == data.country ){
                        if (data.province == I18n.t('All') || data.province != I18n.t('All') && item.province == data.province ){
                            this.state.cities.push(item.city);
                        }                    
                    }
                }           
             })
             await this.setState({countries: this.state.countries,provinces: this.state.provinces,cities: this.state.cities});
        }
    }

    async initTag(){
         this.tag.forEach((item,index)=>{
             this.state.tags.push(item.tagName);
         })
         await this.setState({tags:this.state.tags});
    }

    unInit(){
        this.provinceList && this.provinceList.close();
        this.cityList && this.cityList.close();
        this.countryList && this.countryList.close();
        this.tagList && this.tagList.close();
    }

    onCountry(){
        this.provinceList && this.provinceList.close();
        this.cityList && this.cityList.close();
        this.tagList && this.tagList.close();
        if (this.state.countries.length > 0){
            this.countryList && this.countryList.open();       
            const handle = findNodeHandle(this.refs.country);
            UIManager.measure(handle,(x, y, width, height, pageX, pageY)=>{
                this.countryList && this.countryList.openEx(pageY+this.offsetY);
              })
        }
    }

    onTag(){
        this.countryList && this.countryList.close();
        this.provinceList && this.provinceList.close();
        this.cityList && this.cityList.close();
        if (this.state.tags.length > 0){
            this.tagList && this.tagList.open();      
            const handle = findNodeHandle(this.refs.tag);
            UIManager.measure(handle,(x, y, width, height, pageX, pageY)=>{
                this.tagList && this.tagList.openEx(pageY+this.offsetY);
              })
        }
    }

    onProvince(){
        this.countryList && this.countryList.close();
        this.tagList && this.tagList.close();
        this.cityList && this.cityList.close();
        if(this.state.provinces.length > 0){
            this.provinceList && this.provinceList.open();
            const handle = findNodeHandle(this.refs.province);
            UIManager.measure(handle,(x, y, width, height, pageX, pageY)=>{
                this.provinceList && this.provinceList.openEx(pageY+this.offsetY);
              })
        }  
    }

    onCity(){
        this.countryList && this.countryList.close();
        this.tagList && this.tagList.close();
        this.provinceList && this.provinceList.close();
        if (this.state.cities.length > 0){
            const handle = findNodeHandle(this.refs.city);
            UIManager.measure(handle,(x, y, width, height, pageX, pageY)=>{
                this.cityList && this.cityList.openEx(pageY+this.offsetY);
              })
        }   
    }

    renderCountry(){
        return (
            <View style={styles.regionPanelTop}>
                <View style={[styles.regionLabel,{width:this.width}]}>
                    <Text style={styles.regionText}>{I18n.t('Country')}</Text>
                </View>

                <TouchableOpacity style={styles.regionView} activeOpacity={0.6} onPress={()=>{this.onCountry()}}>
                    <Text style={styles.regionName}>{this.state.data.country}</Text>
                    <Image style={styles.pullDown} resizeMode={'contain'} ref='country'
                           source={require('../assets/images/home_pulldown_icon_mormal.png')}/>
                </TouchableOpacity>
            </View>
        )
    }

    renderTag(){
        return (
            <View style={styles.regionPanel}>
                <View style={[styles.regionLabel,{width:this.width}]}>
                    <Text style={styles.regionText}>{I18n.t('Tag Select')}</Text>
                </View>

                <TouchableOpacity style={styles.regionView} activeOpacity={0.6} onPress={()=>{this.onTag()}}>
                    <Text style={styles.regionName}>{this.state.data.tag}</Text>
                    <Image style={styles.pullDown} resizeMode={'contain'} ref='tag'
                           source={require('../assets/images/home_pulldown_icon_mormal.png')}/>
                </TouchableOpacity>
            </View>
        )
    }

    renderProvince(){
        return (
            <View style={styles.regionPanel}>
                <View style={[styles.regionLabel,{width:this.width}]}>
                    <Text style={styles.regionText}>{I18n.t('Region one')}</Text>
                </View>

                <TouchableOpacity style={styles.regionView} activeOpacity={0.6} onPress={()=>{this.onProvince()}}>
                    <Text style={styles.regionName}>{this.state.data.province}</Text>
                    <Image style={styles.pullDown} resizeMode={'contain'} ref='province'
                           source={require('../assets/images/home_pulldown_icon_mormal.png')}/>
                </TouchableOpacity>
            </View>
        )
    }

    renderCity(){
        return (
            <View style={styles.regionPanelBottom}>
                <View style={[styles.regionLabel,{width:this.width}]}>
                    <Text style={styles.regionText}>{I18n.t('Region two')}</Text>
                </View>

                <TouchableOpacity style={styles.regionView} activeOpacity={0.6} onPress={()=>{this.onCity()}}>
                    <Text style={styles.regionName}>{this.state.data.city}</Text>
                    <Image style={styles.pullDown} resizeMode={'contain'} ref='city'
                           source={require('../assets/images/home_pulldown_icon_mormal.png')}/>
                </TouchableOpacity>
            </View>
        )
    }

    async onTagSelect(item){
        this.tagList && this.tagList.close();
        let data = this.state.data;
        data.tag = item;
        await this.setState({data});
        if (this.props.onChange) {
            this.raiseEvent(2);
        }
    }
  
    async onCountrySelect(item){
        this.countryList && this.countryList.close();
        let data = this.state.data;
        data.country = item;
        await this.setState({data});
        let region = this.store;
        (item !== I18n.t('All')) && (region = this.store.filter(p => p.country === item));
        region = region.map(p => {return p.province});

        (region.length > 0) && (region = Array.from(new Set(region)));
        (region.length === 0) ? (region.push(I18n.t('All')))
            : (region.length > 1) ? (region = [I18n.t('All'),...region]) : null;

        data.province = region[0];
        await this.setState({data,provinces: region});
        this.onProvinceSelect(region[0]);
    }

    async onProvinceSelect(item){
        this.provinceList && this.provinceList.close();

        let data = this.state.data;
        data.province = item;
        let region = this.store;
        (this.state.data.country !== I18n.t('All')) && (region = this.store.filter(p => p.country == this.state.data.country));
        (item !== I18n.t('All')) && (region = this.store.filter(p => p.province === item));
        region = region.map(p => {return p.city});

        (region.length > 0) && (region = Array.from(new Set(region)));
        (region.length === 0) ? (region.push(I18n.t('All')))
            : (region.length > 1) ? (region = [I18n.t('All'),...region]) : null;

        data.city = region[0];
     
        await this.setState({data,cities: region});
        if (this.props.onChange) {
            this.raiseEvent(2);
        }
    }

    async onCitySelect(item){
        this.cityList && this.cityList.close();
        let data = this.state.data;
        data.city = item;
        await this.setState({data});
        if (this.props.onChange) {
            this.raiseEvent(2);
        }
    }

    renderCountries = ({item,index})=>{
        let borderWidth = (index == this.state.countries.length -1) ? 0 : 0.5;
        return (
            <TouchableOpacity activeOpacity={0.6} onPress={()=>this.onCountrySelect(item)}>
                <View style={{height:40,borderBottomWidth:borderWidth,borderBottomColor:'#dcdcdc'}}>
                    <Text style={styles.regionContent}>{item}</Text>
                </View>
            </TouchableOpacity>
        )
    };

    renderTags = ({item,index})=>{
        let borderWidth = (index == this.state.tags.length -1) ? 0 : 0.5;
        return (
            <TouchableOpacity activeOpacity={0.6} onPress={()=>this.onTagSelect(item)}>
                <View style={{height:40,borderBottomWidth:borderWidth,borderBottomColor:'#dcdcdc'}}>
                    <Text style={styles.regionContent}>{item}</Text>
                </View>
            </TouchableOpacity>
        )
    };

    renderProvinces= ({item,index})=>{
        let borderWidth = (index == this.state.provinces.length -1) ? 0 : 0.5;
        return (
            <TouchableOpacity activeOpacity={0.6} onPress={()=>this.onProvinceSelect(item)}>
                <View style={{height:40,borderBottomWidth:borderWidth,borderBottomColor:'#dcdcdc'}}>
                    <Text style={styles.regionContent}>{item}</Text>
                </View>
            </TouchableOpacity>
        )
    };

    renderCities = ({item,index})=>{
        let borderWidth = (index == this.state.cities.length -1) ? 0 : 0.5;
        return (
            <TouchableOpacity activeOpacity={0.6} onPress={()=>this.onCitySelect(item)}>
                <View style={{height:40,borderBottomWidth:borderWidth,borderBottomColor:'#dcdcdc'}}>
                    <Text style={styles.regionContent}>{item}</Text>
                </View>
            </TouchableOpacity>
        )
    };

    StoreConfirmClick(){
        this.raiseEvent(1);
    }

    raiseEvent(type){
        let tagId = '';
        if (this.state.data.tag != I18n.t('All')){
            let index = this.tag.findIndex(p => p.tagName === this.state.data.tag)
            if (index != -1){
                tagId = this.tag[index].tagId;               
            }
        }
 
        let storeId = [];
        this.store.forEach((item,index)=>{ 
            if (this.state.data.country != I18n.t('All') && this.state.data.country != ''){
                if (item.country != this.state.data.country){
                    return;
                }
            }
            if (this.state.data.province != I18n.t('All') && this.state.data.province != ''){
                if (item.province != this.state.data.province){
                    return;
                }
            }
            if (this.state.data.city != I18n.t('All') && this.state.data.city != ''){
                if (item.city != this.state.data.city){
                    return;
                }
            }          
            if (tagId != ''){
                if (item.tagIds.findIndex(p => p == tagId) == -1){
                    return;
                }
             }
             storeId.push(item.storeId);
         })

         if (type == 1){
            if (this.props.onConfirm) {
                let lastStore = {};
                lastStore.country = this.state.data.country;
                lastStore.tag = this.state.data.tag;
                lastStore.province = this.state.data.province;
                lastStore.city = this.state.data.city;
                this.props.onConfirm(storeId,lastStore);
            }
         }
         else if (type == 2){
            if (this.props.onChange) {
                this.props.onChange(storeId);
            }
         }    
    }

   
    render(){
        return (
            <View style={styles.container}>                      
                <View style={{paddingLeft: 16,paddingRight: 16}}>
                    {this.renderCountry()}                  
                    {this.renderProvince()}
                    {this.renderCity()}                              
                </View>
                <View style={{width:width,height:10,backgroundColor:'#f6f9f9'}}/> 
                <View style={{paddingLeft: 16,paddingRight: 16,marginTop:-5}}>                  
                    {this.renderTag()}                              
                </View>
                <View style={{width:width,height:10,backgroundColor:'#f6f9f9',marginTop:8}}/>
                <SlideModalEx ref={(c) =>{this.countryList = c}}
                              offsetX={this.width+16}
                              opacity={0}>
                    <FlatList
                        style={[styles.contentView,{width:width-32-this.width}]}
                        showsVerticalScrollIndicator={false}
                        data={this.state.countries}
                        extraData={this.state}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderCountries}
                    />
                </SlideModalEx>

                <SlideModalEx ref={(c) =>{this.tagList = c}}
                              offsetX={this.width+16}
                              opacity={0}>
                    <FlatList
                        style={[styles.contentView,{width:width-32-this.width}]}
                        showsVerticalScrollIndicator={false}
                        data={this.state.tags}
                        extraData={this.state}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderTags}
                    />
                </SlideModalEx>

                <SlideModalEx ref={(c) =>{this.provinceList = c}}
                              offsetX={this.width+16}
                              opacity={0}>
                    <FlatList
                        style={[styles.contentView,{width:width-32-this.width}]}
                        showsVerticalScrollIndicator={false}
                        data={this.state.provinces}
                        extraData={this.state}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderProvinces}
                    />
                </SlideModalEx>

                <SlideModalEx ref={(c) =>{this.cityList = c}}
                              offsetX={this.width+16}
                              opacity={0}>
                    <FlatList
                        style={[styles.contentView,{width:width-32-this.width}]}
                        showsVerticalScrollIndicator={false}
                        data={this.state.cities}
                        extraData={this.state}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderCities}
                    />
                </SlideModalEx>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: { 
        backgroundColor: '#ffffff'
    },
    navBarPanel:{
        flexDirection: 'row',
        height: 48,
        backgroundColor: '#24293d',
        alignItems: 'center'
    },
    navBarText: {
        fontSize:18,
        height: 48,
        color:'#ffffff',
        textAlign: 'center',
        textAlignVertical: 'center',
        marginLeft:50,
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    },
    regionPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 20
    },
    regionPanelTop:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 10
    },
    regionPanelBottom:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 20,
        marginBottom:10
    },
    regionLabel:{
        height: 24
    },
    regionText:{
        marginTop:-1.5,
        fontSize: 12,
        color: '#989ba3',
        height: 24,
        lineHeight: 24,
        textAlignVertical:'center'
    },
    regionView:{
        height:24,
        borderBottomWidth:0.5,
        borderBottomColor:'#dcdcdc',
        flex:1,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    regionName:{
        fontSize: 12,
        color: '#19293b',
        height: 24,
        lineHeight: 24,
        textAlignVertical:'center',
        marginTop: -2,
        marginLeft: 4
    },
    pullDown:{
        height:48,
        width:48,
        marginTop: -12,
        marginRight: -12
    },
    contentView:{
        maxHeight:height-370 > 200 ? height-370 : 200,
        borderWidth:1,
        borderColor:'#dcdcdc',
        borderRadius:2,
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor:'#ffffff'
    },
    regionContent:{
        fontSize:12,
        color:'#19293b',
        height:40,
        lineHeight:40,
        textAlignVertical:'center'
    },
});
