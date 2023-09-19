import React, {Component} from 'react';

import {
    View,
    Dimensions,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Text, Platform
} from 'react-native';
import I18n from "react-native-i18n";
import PropType from "prop-types";

const {width} = Dimensions.get('screen');

export default class WrapBlock extends Component {

    static propTypes = {
        onSelectChange:PropType.func
    }

    constructor(props) {
        super(props);
        this.state = {
            data: [],
            editText:''
        }
    }

    componentWillMount(){
        let dataSet = [];
        let data = Array.from(new Set(this.props.data));
        data.forEach((item,index)=>{
            dataSet.push({name: item, select:!this.props.selectable});
        });
        this.setState({data:dataSet});
    }

    addData(name){
        if (name.trim() !== ''){
            let index = this.state.data.findIndex(element => element.name === name);
            if (index === -1){
                let data = this.state.data;
                let newItem = {};
                newItem.name = name;
                newItem.select = !this.props.selectable;
                data.push(newItem);
                this.setState({data:data});
            }
        }
    }

    deleteData(name){
        let index = this.state.data.findIndex(element => element.name === name);
        if (index !== -1){
            let data = this.state.data;
            data.splice(index,1);
            this.setState({data:data});
        }
    }

    getData(){
        let data = [];
        this.state.data.forEach((item,index)=>{
            data.push(item.name);
        });
        return data;
    }

    renderBlocks() {
        let data = this.state.data;
        let blocks = data.map((item,index) => {
            return (
                <TouchableOpacity
                    activeOpacity={this.props.selectable? 0.2:1}
                    style={[styles.basicBtn,{backgroundColor: item.select? 'rgba(244,30,101,0.1)':'#f7f8fc',borderColor:item.select?'#f31d65':'#dcdcdc'}]}
                    onPress={() => {
                        if (this.props.selectable){
                            let data = this.state.data;
                            data[index].select = !data[index].select;
                            this.setState({data:data});
                            this.props.onSelectChange(data[index]);
                        }
                    }}
                >
                    {
                        this.props.editable ?
                            <TextInput
                                style={[styles.basicBtnTextInput,{color: item.select? '#F21C65':'#19293d'}]} multiline={false}
                                editable={this.props.editable} value={item.name}
                                onChangeText={(text) =>{
                                    let flag = false;
                                    let data = this.state.data;
                                    if(text.trim() !== ''){
                                        data[index].name = text;
                                    }
                                    else {
                                        flag = true;
                                        data.splice(index,1);
                                    }
                                    if (!flag){
                                        this.setState({data:data});
                                    }
                                    else {
                                        this.setState({
                                            data: [],
                                        },()=>{
                                            this.setState({data:data});
                                        });
                                    }
                                }}
                            />:
                            <Text style={{fontSize:12,color:item.select? '#F21C65':'#19293d',marginTop:3,marginBottom:3}}>{item.name}</Text>
                    }
                </TouchableOpacity>
            );
        });

        let addButton = null;
        if (this.props.editable){ addButton = (
            <View style={[styles.basicBtn,{borderStyle:'dashed',backgroundColor: '#FFFFFF',borderColor:'#dcdcdc'}]}>
                <TextInput
                    style={[styles.basicBtnTextInput,{color: '#989BA3'}]} multiline={false} editable={true}
                    value={this.state.editText} placeholder={I18n.t('AddTag')} returnKeyType={'done'}
                    onChangeText={(text) =>{
                        this.setState({editText:text});
                    }}
                    onSubmitEditing={() =>{
                        let data = this.state.data;
                        this.setState({editText:''});
                        if (this.state.editText.trim() !== '' && this.state.data.length <20 ){
                            let index = this.state.data.findIndex(element => element.name === this.state.editText);
                            if (index === -1){
                                let newItem = {};
                                newItem.name = this.state.editText;
                                newItem.select = true;
                                data.push(newItem);
                                this.setState({data:data});
                            }
                        }
                    }}
                />
            </View>
            )
            blocks.push(addButton);
        }
        return blocks;
    }

    render() {
        return (
            <View style={[styles.btnGroup,{width: this.props.width === null ? width:this.props.width}]}>
                {this.renderBlocks()}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    btnGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 10,
    },
    basicBtn: {
        position: 'relative',
        paddingHorizontal: 10,
        marginBottom: 10,
        marginRight: 10,
        borderRadius: 12,
        borderWidth:1
    },
    basicBtnTextInput: {
        fontSize: 12,
        padding:3,
    },
});
