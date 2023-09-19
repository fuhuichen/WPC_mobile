import React, {Component} from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput
} from 'react-native';
import I18n from 'react-native-i18n';
import validator from 'validator';
import {Actions} from "react-native-router-flux";
import store from "../../mobx/Store";
import RNStatusBar from '../components/RNStatusBar';
import topBackground from '../assets/images/subtraction_8.png';
import Spinner from "../element/Spinner";
import usernameImg from '../assets/images/group_19.png';
import backArrowImage from '../assets/images/back_arrow.png';
import StringFilter from "../common/StringFilter";
import {forgetpwd} from "../common/FetchRequest";
import BorderShadow from '../element/BorderShadow';

const WIDTH = Dimensions.get('screen').width;

export default class AccountList extends Component {
    state={
        errMsg:'',
        visible:false,
        email:store.userSelector.email,
        status:0,
        invalid: true,
        enumSelector: store.enumSelector,
        userSelector: store.userSelector,
        pressNext:false
    }

    constructor(props){
        super(props);

    }

    emailChanged(text){
        this.setState({email:StringFilter.all(text,50),invalid:true});
    }

    async confirm() {
        this.setState({pressNext:false});
        let {status,email,enumSelector,userSelector} = this.state;
        if(status === 0){
            email = email.trim();
            if (email !== '') {
                let invalid = validator.isEmail(email);
                this.setState({invalid});

                if(invalid){
                    userSelector.email = email;
                    this.setState({visible:true,userSelector});
                    let result = await forgetpwd({email:email});
                    if(result.errCode !== enumSelector.errorType.SUCCESS){
                        this.setState({errMsg:I18n.t('Notify email error'),visible:false});
                        return false;
                    }
                    this.setState({status:1,visible:false});
                }else{
                    this.setState({errMsg:I18n.t('Email error')});
                }
            } else {
                this.setState({errMsg:I18n.t('Email error')});
            }
        }else{
            Actions.push('loginScreen');
        }
    }

    backClick(){
        let {status} = this.state;
        if(status === 0){
            Actions.pop();
        }else{
            this.setState({status:0});
        }
    }

    render() {
        const {visible,email,status,pressNext} = this.state;
        let component = null,submitText = '';
        if(status === 0){component = (
            <View style={styles.status}>
                <Text style={styles.welcome}>{I18n.t('Forgot password')}</Text>
                <View style={[styles.inputPanel, BorderShadow.div,{backgroundColor:'#fff'}]}>
                    <TextInput
                        style={styles.userInput}
                        placeholder={I18n.t('Enter email')}
                        autoCorrect={false}
                        autoCapitalize={'none'}
                        returnKeyType={'done'}
                        placeholderTextColor="#666666"
                        underlineColorAndroid="transparent"
                        value={email}
                        onChangeText={this.emailChanged.bind(this)}
                    />
                </View>
                <View style={styles.errMsgView}>
                    <Text style={styles.errMsg}>{this.state.errMsg}</Text>
                </View>
            </View>
            )
            submitText = I18n.t('Next');
        }else{component = (
            <View style={styles.status}>
                <Text style={{fontSize:16,marginTop:29,height:26}}>{I18n.t('Link sent')}</Text>
                <Text style={{fontSize:16,marginBottom:35}}>{I18n.t('Link sent success')}</Text>
            </View>
            )
            submitText = I18n.t('Login again');
        }
        return (
            <View style={styles.container}>
                <TouchableOpacity activeOpacity={0.5} onPress={()=>this.backClick(this)} style={styles.navbar}>
                    <Image style={{width:9,height:16}} source={backArrowImage}/>
                </TouchableOpacity>
                {component}
                <TouchableOpacity activeOpacity={1} onPressIn={()=>this.setState({pressNext: true})} onPressOut={()=>this.confirm()}>
                    <View style={[styles.submitView,{backgroundColor:pressNext ? '#2C5A7D' : '#0365AE'}]}>
                        <Text style={styles.submitText}>{submitText}</Text>
                    </View>
                </TouchableOpacity>
                <Spinner visible={visible} textContent={I18n.t('Loading')} textStyle={{color:'#ffffff',fontSize:14,marginTop:-50}}/>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        position: 'relative',
        flex:1,
        backgroundColor:'#F7F9FA',
        paddingTop:130
    },
    navbar:{
        flexDirection:'row',
        alignItems: 'center',
        paddingLeft:16,
        position: 'absolute',
        top: 10,
        zIndex:99,
        width: '100%',
    },
    navTitle:{
        fontSize:17,
        color:'#666666',
        marginLeft:6
    },
    inputPanel:{
        marginTop:33.41,
        width: WIDTH-48,
        height:46,
        borderRadius:8,
        flexDirection:'row',
        alignItems: 'center',
        paddingLeft:10,
        paddingRight:5
    },
    userInput: {
        backgroundColor: 'transparent',
        width: '93%',
        height: 46,
        paddingLeft: 5,
        color:'#1E272E'
    },
    status:{
        alignItems: 'center',
    },
    welcome:{
        marginTop:-26,
        color:'#556679',
        fontSize:30,
        lineHeight:42,
    },
    errMsgView:{
        width: WIDTH-48,
        textAlign:'left',
        lineHeight:15,
        paddingTop:2
    },
    errMsg:{
        color:'#F11E66',
        fontSize:12,
    },
    submitView:{
        width: WIDTH-48,
        marginTop:18,
        height:46,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius:10,
    },
    submitText:{
        fontSize:18,
        color:'#ffffff',
    }
});
