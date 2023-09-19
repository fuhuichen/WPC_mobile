import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, FlatList, Platform} from "react-native";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import store from "../../../mobx/Store";
import * as BorderShadow from "../../element/BorderShadow";
import Divider from "react-native-elements/dist/divider/Divider";
import ViewIndicator from "../../customization/ViewIndicator";
import DataCell from "./DataCell";

const {width} = Dimensions.get('screen');
export default class DataSheet extends Component {
    state = {
        enumSelector: store.enumSelector
    };

    static propTypes = {
        columns: PropTypes.array,
        viewType: PropTypes.number,
        columnType: PropTypes.number,
        column1SortType: PropTypes.number,
        column2SortType: PropTypes.number,
        showPercent: PropTypes.boolean,
        data: PropTypes.array,
        onSort: PropTypes.func,
        onRefresh: PropTypes.func,
        onRow: PropTypes.func,
        titleStyle: PropTypes.style,        
        nameWidth: PropTypes.number
    };

    static defaultProps = {
        columns:['','',''],
        data: [],
        showPercent: false,
        titleStyle:{
            marginLeft:16,
            fontSize:12,
            color:'rgb(102,102,102)'
        },        
        nameWidth: 155
    };

    renderTitle(){
        let {columns, titleStyle, nameWidth} = this.props;

        return <View style={[styles.namePanel,{width:nameWidth}]}>
            <Text style={titleStyle}>{columns[0]}</Text>
        </View>
    }

    renderTimes(){
        let {enumSelector} = this.state;
        let {columns, columnType, column1SortType, viewType, titleStyle} = this.props;
        let source = (columnType === enumSelector.columnType.COLUMN1) ? this.getActiveSource(column1SortType)
            : this.getInactiveSource(column1SortType);
        let activeOpacity = (viewType === enumSelector.viewType.SUCCESS) ? 0.5 : 1;

        return <TouchableOpacity style={styles.timesPanel}
                                 activeOpacity={activeOpacity}
                                 onPress={() => {this.onTimes()}}>
            <Text style={titleStyle}>{columns[1]}</Text>
            <Image source={source} style={styles.source}/>
        </TouchableOpacity>
    }

    renderScore(){
        let {enumSelector} = this.state;
        let {columns, columnType, column2SortType, viewType, titleStyle} = this.props;
        let source = (columnType === enumSelector.columnType.COLUMN2) ? this.getActiveSource(column2SortType)
            : this.getInactiveSource(column2SortType);
        let activeOpacity = (viewType === enumSelector.viewType.SUCCESS) ? 0.5 : 1;

        return <TouchableOpacity style={styles.scorePanel}
                                 activeOpacity={activeOpacity}
                                 onPress={() => {this.onScore()}}>
            <Text style={titleStyle}>{columns[2]}</Text>
            <Image source={source} style={styles.source}/>
        </TouchableOpacity>
    }

    renderColumns(){
       return <View style={styles.header}>
           {this.renderTitle()}
           {this.renderTimes()}
           {this.renderScore()}
        </View>
    }

    renderItem = ({ item,index}) => {
        let {showPercent} = this.props;

        return <DataCell showPercent={showPercent} data={item} onRow={() => {
            this.props.onRow && this.props.onRow(item, index);
        }}/>
    };

    render() {
        let {enumSelector} = this.state;
        let {viewType, data} = this.props;

        let height = (viewType !== enumSelector.viewType.SUCCESS) ? 275 : null;
        return (
            <View style={styles.container}>
                {this.renderColumns()}
                <View style={[styles.dataPanel, {height}, BorderShadow.div]}>
                    {
                        height ? <ViewIndicator viewType={viewType} containerStyle={{justifyContent:'center'}}
                                           refresh={() => this.props.onRefresh && this.props.onRefresh()}/>
                            : <FlatList data={data}
                                        keyExtractor={(item, index) => index.toString()}
                                        renderItem={this.renderItem}
                                        showsVerticalScrollIndicator={false}
                                        ItemSeparatorComponent={() => <Divider style={styles.divider}/>}
                            />
                    }
                </View>
            </View>
        )
    }

    // sort by column
    onTimes(){
        let {enumSelector} = this.state;
        let {viewType, columnType, column1SortType, column2SortType} = this.props;

        if (viewType !== enumSelector.viewType.SUCCESS){
            return;
        }

        if (columnType === enumSelector.columnType.COLUMN1){
            if (column1SortType === enumSelector.sortType.DESC){
                column1SortType = enumSelector.sortType.ASC
            }else {
                column1SortType = enumSelector.sortType.DESC
            }
        }else {
            columnType = enumSelector.columnType.COLUMN1;
        }

        this.props.onSort && this.props.onSort(columnType, column1SortType, column2SortType);
    }

    onScore(){
        let {enumSelector} = this.state;
        let {viewType, columnType, column1SortType, column2SortType} = this.props;

        if (viewType !== enumSelector.viewType.SUCCESS){
            return;
        }

        if (columnType === enumSelector.columnType.COLUMN2){
            if (column2SortType === enumSelector.sortType.DESC){
                column2SortType = enumSelector.sortType.ASC
            }else {
                column2SortType = enumSelector.sortType.DESC
            }
        }else {
            columnType = enumSelector.columnType.COLUMN2;
        }

        this.props.onSort && this.props.onSort(columnType, column1SortType, column2SortType);
    }


    // get source
    getActiveSource(sortType){
        let {enumSelector} = this.state;
        let {viewType} = this.props;

        let source = (sortType === enumSelector.sortType.DESC) ? require('../../assets/img_desc_active.png')
            : require('../../assets/img_asc_active.png');
        return (viewType === enumSelector.viewType.SUCCESS) ? source : require('../../assets/img_desc_inactive.png');
    }

    getInactiveSource(sortType){
        let {enumSelector} = this.state;
        let {viewType} = this.props;

        let source = (sortType === enumSelector.sortType.DESC) ? require('../../assets/img_desc_inactive.png')
            : require('../../assets/img_asc_inactive.png');

        return (viewType === enumSelector.viewType.SUCCESS) ? source : require('../../assets/img_desc_inactive.png');
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop:20
    },
    header:{
        flexDirection:'row',
        height:17
    },
    namePanel:{
        width:155
    },
    timesPanel:{
        flex:1,
        flexDirection: 'row',
        justifyContent:'flex-start'
    },
    scorePanel:{
        flex:1,
        flexDirection: 'row',
        justifyContent:'flex-end',
        paddingRight:16
    },
    title:{
        marginLeft:16,
        fontSize:12,
        color:'rgb(102,102,102)'
    },
    source:{
        width:16,
        height:16,
        ...Platform.select({
            ios:{
                marginTop:-2
            }
        })
    },
    dataPanel:{
        borderRadius:10,
        backgroundColor:'#fff',
        marginTop:10
    },
    divider:{
        borderBottomWidth:0,
        backgroundColor: 'rgb(242,242,242)',
        height:2,
        width:width-52,
        marginLeft:16
    }
});
