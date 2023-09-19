import React, {Component} from 'react';
import {View, Text, StyleSheet,Dimensions,DeviceEventEmitter} from 'react-native';
import RNStatusBar from "../components/RNStatusBar";
import HeaderBar from "../element/HeaderBar";
import {Actions} from 'react-native-router-flux';
import * as lib from '../common/PositionLib';
import { TouchableOpacity } from 'react-native';
const WIDTH = Dimensions.get('screen').width;
const HEIGHT = Dimensions.get('window').height;

export default class Analysis extends Component{
    constructor(props){
        super(props);
    }

    onMenu(){
        this.props.onMenu(true);
    }

    onSearch(){
        Actions.push('storeSearch');
    }

    onNotify(){

    }
    
    onEditAnalysis(){
        Actions.push('editAnalysis')
    }

    render(){
        return (<View style={styles.container}>
            <RNStatusBar/>
            <HeaderBar onMenu={()=>{this.onMenu()}} onSearch={()=>{this.onSearch()}} onNotify={()=>{this.onNotify()}}/>
            <View style={{flexDirection:'row',width:WIDTH-20,height:30,alignContent:'space-between'}}>
                <Text style={{flex:4}}>Analysis</Text>
                <TouchableOpacity style={{flexDirection:'column',flex:1,alignContent:'flex-end',alignItems:'flex-end',backgroundColor:'pink'}} onPress={()=>{this.onEditAnalysis()}}>
                    <Text style={{fontSize:20,alignSelf:'center',width:20}}>...</Text>
                </TouchableOpacity>
            </View>
        </View>)
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingLeft:16,
        paddingRight:16
    }
});
