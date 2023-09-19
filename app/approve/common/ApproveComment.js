import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, ScrollView, TextInput, TouchableOpacity} from "react-native";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import * as BorderShadow from "../../element/BorderShadow";
import TouchableOpacityEx from "../../touchables/TouchableOpacityEx";
import StringFilter from "../../common/StringFilter";
import store from "../../../mobx/Store";
const INPUT_TEXT_LEN_MAX = 1000;

const {width} = Dimensions.get('screen');
export default class ApproveComment extends Component {
    state = {
        enumSelector: store.enumSelector,
        approveResult: null
    };

    static propTypes = {
        advise: PropTypes.string,
        onAdvise: PropTypes.func,
        onApprove: PropTypes.func,
        button1Text: PropTypes.string,
        button2Text: PropTypes.string
    };

    static defaultProps = {
        advise: '',
        button1Text: '',
        button2Text: '',
    };

    onAdvise(text){
        let comment = StringFilter.all(text,INPUT_TEXT_LEN_MAX);
        this.props.onAdvise && this.props.onAdvise(comment);
    }

    onApprove(result) {
        this.setState({approveResult: result});
        this.props.onApprove && this.props.onApprove(result);
    }

    addText(c){
        var newText = this.props.advise + c;
        this.onAdvise(newText);
    }

    render() {
        let {advise,button1Text,button2Text} = this.props;
        let {approveResult, enumSelector} = this.state;

        var quickList = [I18n.t("Reject Default Description 1"),I18n.t("Reject Default Description 2"),I18n.t("Reject Default Description 3")];
        var quickNodes = quickList.map(function(c,i){
            return  (<TouchableOpacity
                      style={styles.quickButton}
                      onPress={()=>this.addText(c)}>
                      <Text style={styles.quickButtonText}>{c}</Text>
                    </TouchableOpacity>)
        }.bind(this))

        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.starLabel}>*</Text>
                    <Text style={styles.subject}>{I18n.t('Approve Comment')}</Text>
                </View>

                <View style={styles.header}>
                    <TouchableOpacity activeOpacity={0.6} onPress={() => this.onApprove(enumSelector.approveFeedbackType.AGREE)}>
                        <View style={[styles.button, BorderShadow.div, approveResult == enumSelector.approveFeedbackType.AGREE && {backgroundColor: '#006AB7'}]}>
                            <Text style={[styles.buttonText, approveResult == enumSelector.approveFeedbackType.AGREE && {color: '#FFFFFF'}]}>
                                {button1Text == '' ? I18n.t('Agree') : button1Text}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.6} onPress={() => this.onApprove(enumSelector.approveFeedbackType.REJECT)}>
                        <View style={[styles.button, BorderShadow.div, approveResult == enumSelector.approveFeedbackType.REJECT && {backgroundColor: '#006AB7'}]}>
                            <Text style={[styles.buttonText, approveResult == enumSelector.approveFeedbackType.REJECT && {color: '#FFFFFF'}]}>
                                {button2Text == '' ? I18n.t('Approve Reject') : button2Text}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <TextInput style={[styles.inputPanel, BorderShadow.div]}
                       placeholder={I18n.t('Approve Description')}
                       placeholderTextColor={'rgb(172,174,177)'}
                       multiline={true}
                       value={advise}
                       onChangeText={(text) => {this.onAdvise(text)}}/>

                {approveResult == enumSelector.approveFeedbackType.REJECT && <View style={styles.quickmenu}>
                    {quickNodes}
                </View>}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop:16,
        paddingLeft:10
    },
    header:{
        flexDirection:'row',
        justifyContent:'flex-start'
    },
    starLabel:{
        color:'#ff2400',
        marginRight: 3
    },
    subject:{
        fontSize: 16,
        color: 'rgb(100,104,109)'
    },
    inputPanel:{
        width:width-40,
        minHeight:48,
        maxHeight:100,
        backgroundColor: '#fff',
        marginTop:16,
        borderRadius:10,
        paddingTop:14,
        paddingBottom:14,
        paddingLeft: 23,
        paddingRight: 23,
        fontSize:14
    },
    button:{
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingLeft:12,
        paddingRight:12,
        height:30,
        minWidth: 100,
        marginRight: 10,
        marginTop: 10
    },
    buttonText:{
        fontSize:14,
        color:'rgb(100,104,109)',
        height:30,
        lineHeight: 30,
        textAlign: 'center',
        textAlignVertical: 'center',
        marginTop:-1
    },
    quickmenu:{
        paddingTop:5,
        height:15,
        flexDirection:"row",
        alignItems:'flex-start',
        justifyContent:'flex-start'
    },
    quickButton:{
        backgroundColor:'white',
        paddingRight:10,
        paddingLeft:10,
        marginRight:5,
        height:25,
        borderRadius:10,
        justifyContent:'center',
        alignItems:'center',
        borderWidth:0.5,
        borderColor:'rgba(0,0,0,0.06)'
    },
    quickButtonText:{
        color:'rgb(100,104,109)',
        fontSize:12,
    }
});
