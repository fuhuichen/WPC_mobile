import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, FlatList, Platform, ActivityIndicator} from "react-native";
import I18n from "react-native-i18n";
import {Actions} from "react-native-router-flux";
import Navigation from "../../element/Navigation";
import Divider from "react-native-elements/dist/divider/Divider";
import store from "../../../mobx/Store";
import ViewIndicator from "../../customization/ViewIndicator";
import * as BorderShadow from "../../element/BorderShadow";
import {getStatisticsInspectStore} from "../../common/FetchRequest";
import SlotView from "../../customization/SlotView";

const {width, height} = Dimensions.get('window');
export default class StoreNotPatrol extends Component {
    state = {
        viewType: store.enumSelector.viewType.EMPTY,
        enumSelector: store.enumSelector,
        contentOffset: 0,
        showFooter: 0, // 0: hidden, 1: no more data, 2: loading
        currentPage: 0,
        lastPage: true,
        onEndReached: false,
        onPull:false,
        data: []
    };

    componentDidMount(){
        this.fetchData(0, true);
    }

    fetchData(page, load){
        try {
            let {viewType, enumSelector} = this.state, data = [], lastPage = true;
            load && this.setState({viewType: enumSelector.viewType.LOADING});

            setTimeout(async () => {
                let {request} = this.props;

                viewType = enumSelector.viewType.FAILURE;
                let result = await getStatisticsInspectStore(request);

                let content = [];
                if (result.errCode === enumSelector.errorType.SUCCESS){
                    content = result.data[0].storesNotInspected;
                    viewType = (content.length > 0) ? enumSelector.viewType.SUCCESS : enumSelector.viewType.EMPTY;
                }

                data = data.concat(content);
                viewType = load ? viewType : this.state.viewType;
                this.setState({
                    data,
                    viewType,
                    lastPage,
                    onEndReached: false,
                    onPull: false,
                    showFooter: 0
                });
            },200);
        }
        catch (e) {
        }
    }

    onBack(){
        Actions.pop();
    }

    onRow(index){

    }

    renderItem({item, index}){
        return <View style={styles.data}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        </View>
    }

    render() {
        let {data, viewType, enumSelector} = this.state;
        let viewSuccess = (viewType === enumSelector.viewType.SUCCESS);

        return (
            <View style={styles.container}>
                <Navigation
                    onLeftButtonPress={()=>{this.onBack()}}
                    title={I18n.t('Not inspected stores')}
                />

                {
                    !viewSuccess ? <ViewIndicator viewType={viewType}
                                                  containerStyle={{marginTop:100}} refresh={() => this.fetchData()}/>
                        : <FlatList style={[styles.list, BorderShadow.div]}
                                    data={data}
                                    onScroll={(evt) => {
                                        this.setState({contentOffset: evt.nativeEvent.contentOffset.y});
                                    }}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={this.renderItem.bind(this)}
                                    showsVerticalScrollIndicator={false}
                                    refreshing={false}
                                    onRefresh={() => this.onRefresh()}
                                    onEndReached={() => this.onEndReached()}
                                    onEndReachedThreshold={0.1}
                                    ItemSeparatorComponent={() => <Divider style={styles.divider}/>}
                        />
                }
            </View>
        )
    }

    // pages
    onRefresh(){
        this.setState({
            data: [],
            currentPage: 0,
            showFooter: 0,
            lastPage: false,
            onEndReached: false,
            onPull:true
        },async ()=>{
            await this.fetchData(0, true);
        })
    }

    onEndReached(){
        try {
            if(this.state.lastPage) {
                {
                    (this.state.contentOffset >= (height-Platform.select({android:56, ios:78})))
                        ? this.setState({showFooter: 1}) : this.setState({showFooter: 0});
                    return;
                }
            }

            if(!this.state.onEndReached){
                let page = ++this.state.currentPage;
                this.setState({onEndReached: true,showFooter: 2,currentPage:page});
                (async () => {
                    await this.fetchData(page,false);
                })();
            }
        }catch(e){
        }
    }

    renderFooter(){
        let {showFooter} = this.state, component = null;

        if (showFooter === 1) {
            component = <View style={{height:40,alignItems:'center',justifyContent:'center',flexDirection:'row'}}>
                <View style={{width:50,height:1,backgroundColor:'#dcdcdc'}} />
                <Text style={{color:'#989ba3',fontSize:10,marginLeft:10}}>
                    {I18n.t('No further')}
                </Text>
                <View style={{width:50,height:1,backgroundColor:'#dcdcdc',marginLeft:10}} />
            </View>;
        }

        if(showFooter === 2) {
            component = <View style={styles.footer}>
                <ActivityIndicator color={'#989ba3'}/>
                <Text style={{fontSize: 10, color: '#989ba3'}}>{I18n.t('Loading data')}</Text>
            </View>;
        }

        return component;
    }
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        backgroundColor:'#F7F9FA'
    },
    list:{
        borderRadius:10,
        backgroundColor:'#fff',
        width:width-20,
        marginLeft:10,
        marginTop: 16,
        flexGrow:0
    },
    footer:{
        flexDirection:'row',
        height:24,
        justifyContent:'center',
        alignItems:'center',
        marginBottom:10,
    },
    divider:{
        borderBottomWidth:0,
        backgroundColor:'rgb(242,242,242)',
        width:width-52,
        height:2,
        marginLeft:16
    },
    data:{
        flexDirection:'row',
        justifyContent:'flex-start',
        alignItems:'center',
        height:55
    },
    name:{
        fontSize:14,
        color:'rgb(100,104,109)',
        paddingLeft: 16,
        maxWidth:width-52
    }
});
