import React, {Component} from 'react';
import {
    DeviceEventEmitter,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {Actions} from 'react-native-router-flux';
import I18n from 'react-native-i18n';
import NavBarPanel from "../components/NavBarPanel";
import {FlatGrid} from "react-native-super-grid";
import RNFS from "react-native-fs";

let width = Dimensions.get('screen').width;

export default class FaceAnalyse extends Component {
    constructor(props){
        super(props);
        this.state = {
            faces:[],
            result:true
        };
    }

    componentDidMount(){
        let faces = [];
        if (this.props.faces.length > 0){
            this.props.faces.forEach((item,index)=>{
                let face = {};
                face.check = index === 0;
                face.uri = item;
                faces.push(face);
            });
            this.setState({faces:faces});
        }
        else {
            this.setState({result:false});
        }
    }

    confirm(){
        if (this.state.result){
            let face = this.state.faces.find(element => element.check === true);
            if (face !== null){
                RNFS.readFile(face.uri, 'base64')
                    .then((content) => {
                        DeviceEventEmitter.emit('onFaceModified',content);
                        Actions.popTo('register');
                    })
                    .catch((err) => {
                    });
            }
        }
        else {
            Actions.pop();
        }
    }

    renderGrid(item,index){
        return (
            <View style={{alignItems:'center',justifyContent: 'center'}}>
                <TouchableOpacity style={{width:(width - 90)/3,height:100}} onPress={() =>{
                    let faces = this.state.faces;
                    faces.forEach((itemP,indexP)=>{
                        itemP.check = indexP === index;
                    });
                    this.setState({faces:faces});
                }}>
                    <View style={{flexDirection: 'row'}}>
                        <Image style={{width:100,height:100}} source={{uri:item.uri}} resizeMode={'contain'}/>
                        {
                            item.check ? <Image style={{width:21,height:21,marginLeft:-21}} source={require('../assets/images/check.png')} resizeMode={'contain'}/>
                                :null
                        }
                    </View>
                </TouchableOpacity>
            </View>
        );
    }

    render() {
        let text = this.state.result ? I18n.t('Detected faces'): this.props.result ? I18n.t('Undetected faces'):I18n.t('Detect face error');
        return (
            <View style={{flex: 1, backgroundColor: '#ffffff'}}>
                <NavBarPanel title={I18n.t('Photo analysis')} confirmText={I18n.t('Confirm')} onConfirm={this.confirm.bind(this)} />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={{marginLeft:16,fontSize:14,color:'#989BA3',marginTop:16}}>{text}</Text>
                    {this.state.result ?
                        <FlatGrid
                            itemDimension={(width - 90)/3}
                            spacing={15}
                            items={this.state.faces}
                            renderItem={({item,index}) => this.renderGrid(item,index)}
                        /> :
                        <View style={{alignItems:'center',justifyContent: 'center',backgroundColor:'#F7F8FC',
                                      marginLeft:16,marginTop:16,marginBottom:16,width:100,height:100}}>
                            <Image style={{width:49,height:49}} source={require('../assets/images/no_face.png')} resizeMode={'contain'}/>
                        </View>
                    }
                    <View style={{marginLeft:16,marginRight:16}}>
                        <Text style={{fontSize:14,color:'#989BA3',marginBottom:10}}>{I18n.t('Original photo')}</Text>
                        <Image style={{width:width-32,height:230,marginBottom:10}} source={{uri:this.props.uri}} resizeMode={'contain'}/>
                    </View>
                </ScrollView>
            </View>
        )
    }
}

