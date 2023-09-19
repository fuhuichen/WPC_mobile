import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, ScrollView} from "react-native";
import moment from "moment";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";
import store from "../../mobx/Store";
import BorderShadow from '../element/BorderShadow';
import {getSystemTime} from "../common/FetchRequest";

const {width} = Dimensions.get('screen');
export default class LocateFailure extends Component {
    state = {
        enumSelector: store.enumSelector,
        patrolSelector: store.patrolSelector,
        mapURI: ''
    };

    static propTypes = {
        time: PropTypes.number,
        onData: PropTypes.func
    };

    componentDidMount(){
        this.initMapURI();
    }

    initMapURI() {
        let {patrolSelector} = this.state;
        if(/*patrolSelector.distance != null &&*/ patrolSelector.latitude && patrolSelector.longitude && patrolSelector.store && patrolSelector.store.latitude && patrolSelector.store.longitude) {
            let mapWidth = 600;//(width - 60);
            let mapHeight = 450;//((width - 60)*3/4);
            let localGPS = patrolSelector.latitude + ',' + patrolSelector.longitude;
            let disGPS = patrolSelector.store.latitude + ',' + patrolSelector.store.longitude;
            let localIcon = 'https://maps.gstatic.com/mapfiles/ms2/micons/man.png';
            let dislIcon = 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png';
            let uri = 'https://maps.googleapis.com/maps/api/staticmap?&size=' + mapWidth + 'x' + mapHeight +
                    '&scale=2&style=visibility:on&format=jpg&style=feature:water|element:geometry|visibility:on&style=feature:landscape|element:geometry|visibility:on&markers=icon:' +
                    localIcon + '|' + localGPS + '&markers=icon:' + dislIcon + '|' + disGPS + '&path=color:0x0000ff|weight:5|' + localGPS + '|' + disGPS + '&key=AIzaSyCinmJi-9W-g7QjG7GF6DfRJOgipkdiF5c';
            uri = encodeURI(uri)
            this.setState({mapURI: uri});
        }
    }

    renderMap() {
        let {patrolSelector, mapURI} = this.state;

        if(/*patrolSelector.distance == null || */mapURI == '') {
            return null;
        }

        let mapWidth = (width - 120);
        let mapHeight = ((width - 120)*3/4);
        //let durationText = I18n.t('Store distance',{store:patrolSelector.store.name, distance:patrolSelector.distance});
        return (
                <View style={[{border:2, borderRadius:10},BorderShadow.div]}>
                    <View style={{alignItems:'center', padding:10}}>
                        {/*<Text style={styles.content}>{durationText}</Text>
                        <Divider style={styles.divider}/>*/}
                        <Image style={{width: mapWidth, height: mapHeight}} source={{uri: mapURI}}/>
                    </View>
                </View>
        )
    }

    async onClick(){
        let {enumSelector} = this.state;

        let result = await getSystemTime();
        if (result.errCode == enumSelector.errorType.SUCCESS){            
            this.props.onTime && this.props.onTime(result.data.ts);
        }

        let viewType = enumSelector.signType.LOCATING;
        this.props.onData && this.props.onData(viewType);
    }

    render() {
        let {patrolSelector} = this.state;
        let {time} = this.props, component = null;
        if (time !== 0){
            component = <Text style={styles.time}>{moment(time).format('HH:mm:ss')}</Text>;
        }

        let storeAddress = store.storeSelector.collection ? store.storeSelector.collection.address : '';

        return (
            <View style={styles.container}>
                <TouchableOpacityEx activeOpacity={0.5} onPress={() => this.onClick()}>
                    <Image source={require('../assets/img_locate_refresh.png')} style={styles.image}/>
                </TouchableOpacityEx>
                <Text style={styles.title}>{I18n.t('Locate refresh')}</Text>
                {component}
                <View style={styles.panel}>
                    <Image source={require('../assets/img_locate_icon.png')} style={styles.icon}/>
                    <Text style={styles.prompt}>{I18n.t('Locate empty')}</Text>
                </View>
                <ScrollView style={{marginTop:4,marginLeft:0,marginRight:0}}>
                    {this.renderMap()}
                    <View style={{alignItems:'flex-start'}}>
                        <Text style={styles.address}>{I18n.t('Store Address') + ' : ' + storeAddress}</Text>
                        <Text style={styles.address}>{I18n.t('Current Location') + ' : ' + patrolSelector.latitude + ',' + patrolSelector.longitude}</Text>
                    </View>
                </ScrollView>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 16,
        paddingRight: 16,
        alignItems:'center',
        paddingTop: 24
    },
    image:{
        width:80,
        height:80
    },
    title:{
        fontSize:20,
        color:'rgb(100,104,109)',
        marginTop: 20
    },
    time:{
        fontSize: 16,
        color:'rgb(100,104,109)',
        marginTop:4
    },
    panel:{
        flexDirection:'row',
        marginTop:6,
        alignItems: 'center'
    },
    icon:{
        width: 20,
        height: 20
    },
    prompt:{
        fontSize:14,
        color:'rgb(245,120,72)',
        marginLeft:4
    },
    address:{
        fontSize: 14,
        color:'rgb(100,104,109)',
        marginTop:4
    }
});
