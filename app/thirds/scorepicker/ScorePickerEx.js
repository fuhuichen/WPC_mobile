/**
 * @prettier
 * @flow
 * */

import React from 'react'
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    TouchableOpacity,
    FlatList,
    Platform,
    DeviceEventEmitter
} from 'react-native'
import {ColorStyles} from '../../common/ColorStyles';
import ModalBox from 'react-native-modalbox';
import I18n from 'react-native-i18n';
import {EMITTER_MODAL_CLOSE} from "../../common/Constant";

let {width} =  Dimensions.get('screen');

type Props = {
    onSelected: string
}

type State = {
    initIndex: number,
}

export default class ScorePickerEx extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            initIndex:0
        }
    }

    componentWillMount(){
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_MODAL_CLOSE,
            ()=>{
                this.close();
            });
    }

    componentWillUnmount(){
        this.notifyEmitter && this.notifyEmitter.remove();
    }

    open(initValue){
        let index = this.props.data.findIndex((item)=> item === initValue);
        let initIndex = (index !== -1) ? index : 0;
        this.setState({initIndex},()=>{
            this.refs.modalBox.open();
        });
    }

    close(){
        this.refs.modalBox && this.refs.modalBox.close();
    }

    cancel(){
        this.close();
    }

    confirm(){
        let index = this.state.initIndex;
        this.props.onSelected(this.props.data[index]);

        this.close();
    }

    renderItem = ({ item,index}) => {
        return (
            <TouchableOpacity activeOpacity={0.5} onPress={()=>this.setState({initIndex:index})}>
                <View style={this.state.initIndex === index ? styles.itemSelected : styles.itemNormal}>
                    <Text style={this.state.initIndex === index ? styles.textSelected : styles.textNormal}>{item}</Text>
                </View>
            </TouchableOpacity>
        )
    };

    render() {
        let initIndex = this.state.initIndex;
        let data = this.props.data;
        let scrollIndex = (initIndex > 0 && initIndex < data.length) ? (initIndex-1) : initIndex;

        return (
            <View>
                <ModalBox style={styles.modalBox} ref={"modalBox"}  position={"center"}
                          isDisabled={false}
                          swipeToClose={false}
                          backdropPressToClose={false}
                          backButtonClose={true}
                          coverScreen={true}
                          onOpened={()=>{
                              this.dataList && this.dataList.scrollToOffset({animated:true,offset:scrollIndex*50})
                          }}>
                    <Text style={styles.timeLabel}>{I18n.t('Score show')}</Text>
                    <View style={styles.horizontalLine}></View>
                    <View style={styles.container}>
                        <FlatList ref={(ref => this.dataList = ref)}
                                  showsHorizontalScrollIndicator={true}
                                  data={this.props.data}
                                  extraData={this.state}
                                  keyExtractor={(item, index) => item.toString()}
                                  renderItem={this.renderItem}
                                  showsVerticalScrollIndicator={true}
                                  getItemLayout={(data,index)=>(
                                      {length: this.props.data.length, offset: (50+2) * index, index}
                                  )}
                                  />
                    </View>
                    <View style={[styles.horizontalLine,{marginTop:0}]}></View>
                    <View style={styles.confirmPanel}>
                        <View style={{width:(width-36-1)/2}}>
                            <TouchableOpacity onPress={()=>this.cancel()}>
                                <Text style={styles.cancel}>{I18n.t('Cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.verticalLine}></View>
                        <View style={{width:(width-36-1)/2}}>
                            <TouchableOpacity onPress={()=>this.confirm()}>
                                <Text style={styles.confirm}>{I18n.t('Confirm')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ModalBox>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    modalBox: {
        width: width-36,
        ...Platform.select({
            android:{
                height: 310,
            },
            ios:{
                height: 304
            }
        }),
        borderRadius:3
    },
    headerLine:{
        flexDirection:'row',
        justifyContent:'space-between',
        width:width-36,
        height:20,
        marginTop:14,
        marginLeft:18
    },
    container: {
        height:176,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop:20,
        marginBottom:7
    },
    score:{
        fontSize:14,
        color:'#19293b'
    },
    timeLabel:{
        fontSize: 18,
        color: '#19293b',
        alignSelf: 'center',
        marginTop: 16
    },
    horizontalLine:{
        height: 1,
        backgroundColor: '#f5f5f5',
        marginTop: 16
    },
    confirmPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        height: 48
    },
    cancel:{
        color: '#888c9e',
        height: 48,
        textAlignVertical: 'center',
        marginBottom: 16,
        textAlign:'center',
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    },
    verticalLine:{
        width: 1,
        height: 48,
        backgroundColor: '#f5f5f5'
    },
    confirm: {
        color: ColorStyles.COLOR_MAIN_RED,
        height: 48,
        textAlign:'center',
        textAlignVertical: 'center',
        marginBottom: 16,
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    },
    itemSelected:{
        width:width-36,
        height:50,
        backgroundColor:'#fde8ef'
    },
    itemNormal:{
        width:width-36,
        height:50
    },
    textSelected:{
        height:50,
        color: ColorStyles.COLOR_MAIN_RED,
        textAlign:'center',
        textAlignVertical:'center',
        ...Platform.select({
            ios:{
                lineHeight: 50
            }
        })
    },
    textNormal:{
        height:50,
        textAlign:'center',
        textAlignVertical:'center',
        ...Platform.select({
            ios:{
                lineHeight: 50
            }
        })
    }
})
