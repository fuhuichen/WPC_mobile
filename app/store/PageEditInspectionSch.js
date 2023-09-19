import React, {Component } from 'react';
import {connect} from 'react-redux';
import {Dimensions, Image, StyleSheet, Text, View,Platform,SafeAreaView} from 'react-native'
import store from "../../mobx/Store";
import DragAddObj from './DragAddObj'
import {getLastInspectList} from "../common/FetchRequest";
import moment from "moment";


export default class PageEditInspectionSch extends Component {

    constructor(props) {
      super(props);
      this.props = props;
      this.state = {
            storeData: [],
            storeSelector: store.storeSelector,
            enumSelector: store.enumSelector,
            viewType: store.enumSelector.viewType.FAILURE,
        };
        this.fetchData();
      //console.log('DEVICE Name:',utils.doGetDeviceName())
    }

    componentDidMount() {

    }

    async fetchData(){
        let params = {};
        let {enumSelector} = this.state;
        this.setState({viewType:enumSelector.viewType.LOADING});
        let result = await getLastInspectList(params);
        if(result.errCode !== enumSelector.errorType.SUCCESS){
            this.setState({viewType:enumSelector.viewType.FAILURE});
            return false;
        }
        if(result.data.length === 0){
            this.setState({viewType:enumSelector.viewType.EMPTY});
            return false;
        }
        this.getStoreList(result.data);
    }

    getStoreList(storeTemp) {
        let cities = [];
        storeTemp.forEach(item=>{
            if (cities.findIndex ( c => c == item.city) == -1){
                cities.push(item.city);
            }
        })
        let data = [];
        cities.forEach(item=>{
            let cityTemp = {city:item,stores:[]}
            storeTemp.forEach(s_item=>{
                if(item === s_item.city){
                    cityTemp.stores.push(s_item)
                }
            })
            console.log('cityTemp:',cityTemp)
            data.push(cityTemp);
        })

        let schStroes = [];
        let date = new Date();
        for(i=0;i<7;i++){
            schStroes.push({date:moment(date).format("YYYY/MM/DD ddd"),stores:storeTemp});
            date.setDate(date.getDate() + 1);
            console.log("date:",moment(date).format("YYYY/MM/DD ddd"))
        }

        this.setState({storeData:schStroes,viewType:store.enumSelector.viewType.SUCCESS});
    }

    renderStore(){
        const {storeData} = this.state;
        const screen = Dimensions.get("screen");
        let Height = screen.height-10;
        //return Data.storeInfo.map((item,index)=>{
            //console.log('item:',item)
            if(storeData.length>0){
            return(
                <View style={{flex:1,flexDirection:'row'}}>
                <DragAddObj
                    parentWidth = {screen.width-10}
                    parentHeight = {Height-60}
                    Data = {storeData}
                    childrenWidth = {76}
                    childrenHeight = {76}
                    marginChildrenLeft = {10}
                    marginChildrenRight = {0}
                    marginChildrenTop = {10}
                    marginChildrenBottom = {0}
                    maxScale ={1.1}
                    minOpacity=  {0.8}
                />
                </View>
            )
            }else{
                return (<View />);
            }
        //});

    }

    render(){
        const screen = Dimensions.get("screen");
        return (
            <SafeAreaView style={{flex:1,backgroundColor:'#FFF'}}>
                <View
                    style={{width:screen.width-10,height:screen.height,marginLeft:5,marginRight:5,zIndex:0,}}>
                        { this.renderStore()}
                </View>
            </SafeAreaView>
        );
    }

}

const Styles = StyleSheet.create({
})

var scheduleStoreData = {
    "schDate":"2021/05/09",
    "data": [
        {
            "storeId": "ITClGUO7D9bU",
            "name": "西安3店",
            "city": "西安市",
            "province": "陕西省",
            "country": "China",
            "address": "雁塔区科技路西口与丈八北路十字",
            "inspectTask": [],
            "lastInspect": {
                "inspectTagId": 400,
                "inspectTagName": "Tab1报告",
                "inspectReportId": 731,
                "status": 1,
                "score": 0.0,
                "mode": 1,
                "ts": 1619684743800
            }
        },
        {
            "storeId": "d58tEnwS3E4v",
            "name": "西安1店",
            "city": "西安市",
            "province": "陕西省",
            "country": "China",
            "address": "陕西省西安市科技二路68号秦风阁",
            "inspectTask": [
                {
                    "from": 1620316800000,
                    "to": 1620403200000,
                    "inspectTagId": 379,
                    "inspectReportId": -1
                }
            ],
            "lastInspect": {
                "inspectTagId": 407,
                "inspectTagName": "Tan1+Tab2+Tab3报告",
                "inspectReportId": 729,
                "status": 2,
                "score": 98.0,
                "mode": 1,
                "ts": 1619675167427
            }
        },
        {
            "storeId": "VHKN7fkcngqf",
            "name": "西安2店",
            "city": "西安市",
            "province": "陕西省",
            "country": "China",
            "address": "雁塔区大寨路宏府麒麟山",
            "inspectTask": [],
            "lastInspect": {
                "inspectTagId": 407,
                "inspectTagName": "Tan1+Tab2+Tab3报告",
                "inspectReportId": 722,
                "status": 1,
                "score": 0.0,
                "mode": 1,
                "ts": 1619413734627
            }
        }
    ]
};
