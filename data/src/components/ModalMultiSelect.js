import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    FlatList,
    TouchableOpacity,
    Platform,
    Image
} from "react-native";
import I18n from "react-native-i18n";
import ModalBox from "react-native-modalbox";
import {Divider} from "react-native-elements";

const {width} = Dimensions.get('screen');
export default class ModalSingleSelect extends Component {
    state = {
        title:'',
        selectIndex: [],
        data:[],
        onCancel: false,
        onConfirm: false
    };

 
    open(title,selectIndex,list){
        this.setState({selectIndex: selectIndex, data:list,title:title});
        this.action = false;
        this.modalBox && this.modalBox.open();
    }

    close(){
        this.setState({onCancel: false});
        this.modalBox && this.modalBox.close();
    }

    confirm(){
        this.action = true;
        this.setState({onConfirm: false});
        this.modalBox && this.modalBox.close();
    }

    onClosed(){
        if (this.action){
            let {selectIndex} = this.state;
            this.props.onSelect(selectIndex);
        }
    }

    renderModal = ({item,index}) => {
        let image = null;
        if (this.state.selectIndex.includes(index)){
            image = <Image style={{width:20,height:20}} source={require('../../images/POSsetting_pop_chose_icon2.png')}/>
        }
        else{
            image = <View style={{width:20,height:20,backgroundColor:'#dcdfe5',borderRadius:20}} />
        }
        return (
            <TouchableOpacity activeOpacity={1} onPress={() => {
                let indexs = this.state.selectIndex;
                if(indexs.includes(index)) {
                    indexs.splice(indexs.indexOf(index), 1);
                } else {
                    indexs.push(index);
                }
                this.setState({selectIndex: indexs}); 
            }}>
                <View style={{height:52,justifyContent:'space-between',flexDirection:'row',alignContent:'center',width:width-86}}>
                    <Text style={{fontSize:16,color:'#707070',marginLeft:26}} numberOfLines={1}>{item}</Text>
                    {image}
                </View>
            </TouchableOpacity>
        )
    };

    render() {
        let {onCancel, onConfirm} = this.state;
        return (
            <ModalBox style={styles.modalBox} ref={(c)=> this.modalBox = c} position={"center"}
                      isDisabled={false}
                      swipeToClose={false}
                      backdropPressToClose={false}
                      backButtonClose={true}
                      onClosed={() => {this.onClosed()}}
                      coverScreen={true}>
                <View style={styles.headerPanel}>
                    <View style={styles.innerHead}>
                        <Text style={{fontSize: 19, color: '#86888A'}}>{this.state.title}</Text>
                    </View>
                </View>
                <FlatList style={styles.dataPanel}
                          showsVerticalScrollIndicator={false}
                          data={this.state.data}
                          extraData={this.state}
                          keyExtractor={(item, index) => index.toString()}
                          renderItem={this.renderModal}/>

                <Divider style={styles.divider}/>
                <View style={styles.bottomPanel}>
                    <View style={styles.innerBottom}>
                        <TouchableOpacity onPressOut={() => {this.close()}} onPressIn={() => this.setState({onCancel: true})}>
                            <View style={{width:76,height:36,marginRight:8,borderColor: onCancel ? '#006AB7' : '#FFFFFF',borderWidth:1,
                                marginTop:8,borderRadius:10}}>
                                <Text style={styles.button}>{I18n.t('Cancel')}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPressOut={() => {this.confirm()}} onPressIn={() => this.setState({onConfirm: true})}>
                            <View style={{width:76,height:36,marginRight:8,borderColor: onConfirm ? '#006AB7' : '#FFFFFF',borderWidth:1,
                                marginTop:8,borderRadius:10}}>
                                <Text style={[styles.button]}>
                                    {I18n.t('Confirm')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ModalBox>
        )
    }
}

const styles = StyleSheet.create({
    modalBox: {
        width: width-20,
        ...Platform.select({
            android:{
                height: 368
            },
            ios:{
                height: 386
            }
        }),
        borderRadius:10,
        backgroundColor:'transparent'
    },
    headerPanel:{
        height:71,
        justifyContent: 'center',
        alignItems:'center',
    },
    innerHead:{
        width:width-60,
        height:71,
        justifyContent: 'center',
        alignItems:'center',
        borderTopLeftRadius:10,
        borderTopRightRadius:10,
        backgroundColor:'#F7F9FA'
    },
    bottomPanel:{
        height: 52,
        backgroundColor:'transparent',
        alignItems:'center'
    },
    innerBottom:{
        height: 52,
        width:width-60,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        backgroundColor:'#FFFFFF',
        borderBottomLeftRadius:10,
        borderBottomRightRadius:10
    },
    button:{
        color: '#006AB7',
        height: 36,
        lineHeight:36,
        textAlignVertical: 'center',
        textAlign:'center',
        fontSize:16
    },
    dataPanel:{
        backgroundColor:'#F7F9FA',
        width:width-60,
        marginLeft:20
    },
    divider:{
        backgroundColor:'#EBF1F5',
        width:width-60,
        marginLeft:20,
        height:1,
        borderBottomWidth:0
    }
});
