import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, Platform} from "react-native";
import PropTypes from 'prop-types';
import RBSheet from "react-native-raw-bottom-sheet";
import I18n from 'react-native-i18n';

const {width} = Dimensions.get('screen');
export default class BottomSheet extends Component {
    static propTypes = {
        data: PropTypes.array.isRequired,
        onSelect: PropTypes.func,
        onCancel: PropTypes.func
    };

    open(){
        this.RBSheet && this.RBSheet.open();
    }

    close(){
        this.RBSheet && this.RBSheet.close();
    }

    onSelect(index){
        this.close();
        setTimeout(() => {
            this.props.onSelect && this.props.onSelect(index);
        },(index === 0) ? 0 : Platform.select({android:200, ios:500}));
    }

    onCancel(){
        this.props.onCancel && this.props.onCancel();
    }

    render() {
        let {data} = this.props;
        return (
            <RBSheet ref={c  => {this.RBSheet = c;}}
                     height={data.length*56+74}
                     openDuration={200}
                     customStyles={{container:styles.container}}
                     onClose={() => {this.onCancel()}}>
                {
                    data.map((item, index) => {
                        let borderWidth = (index !== data.length -1) ? 1 : 0;
                        let borderColor = (index !== data.length -1) ? 'rgba(194, 198, 204, 1)' : '#fff';
                        let borderTopRadius = (index === 0) ? 14 : 0;
                        let borderBottomRadius = (index === data.length -1) ? 14 : 0;
                        let dynamicStyle = {borderTopLeftRadius:borderTopRadius,borderTopRightRadius:borderTopRadius,
                            borderBottomLeftRadius:borderBottomRadius, borderBottomRightRadius: borderBottomRadius};

                        return <View style={{backgroundColor:'#DBDBDB', ...dynamicStyle}}>
                        <TouchableOpacity activeOpacity={0.6} onPress={() => this.onSelect(index)}>
                            <View style={[styles.dataPanel,{borderBottomWidth: borderWidth, borderBottomColor: borderColor,
                                ...dynamicStyle}]}>
                                <Text style={styles.dataText}>{item}</Text>
                            </View>
                        </TouchableOpacity>
                        </View>
                    })
                }
                <View style={[styles.cancelPanel,styles.cancelView]}>
                    <TouchableOpacity activeOpacity={0.6} onPress={() => this.close()}>
                        <View style={styles.cancelPanel}>
                            <Text style={styles.cancelText}>{I18n.t('Cancel')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </RBSheet>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'transparent'
    },
    dataPanel:{
        width:width-20,
        height:56,
        backgroundColor: '#E8E8E8',
        alignItems: 'center'
    },
    dataText:{
        height: 56,
        lineHeight:56,
        textAlignVertical:'center',
        color:'#006AB7',
        fontSize:18
    },
    cancelPanel:{
        width:width-20,
        height:56,
        backgroundColor:'#ffffff',
        borderRadius:14
    },
    cancelView:{
        backgroundColor:'#DBDBDB',
        marginTop:8,
        marginBottom:10
    },
    cancelText:{
        height: 56,
        lineHeight:56,
        textAlign: 'center',
        textAlignVertical: 'center',
        color:'#9D9D9D',
        fontSize:18
    }
});
