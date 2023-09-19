import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    TouchableOpacity,
    DeviceEventEmitter,
    FlatList,
    Platform,
    ScrollView,
    TextInput,
    TouchableWithoutFeedback
} from "react-native";
import I18n from "react-native-i18n";
import {Actions} from "react-native-router-flux";
import Navigation from "../element/Navigation";
import store from "../../mobx/Store";
import {inject, observer} from "mobx-react";
import NetInfoIndicator from "../components/NetInfoIndicator";
import SlideModalEx from "../components/SlideModal";
import {getStoreDefine,getUserList,getUserDefine,getStoreUser,getInspectTagList,getStoreList} from "../common/FetchRequest";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import AndroidBacker from "../components/AndroidBacker";
import BorderShadow from '../element/BorderShadow';
import * as lib from '../common/PositionLib';
import OptionSelector from "../element/OptionSelector";
import SlotStore from "../customization/SlotStore";
import Divider from "react-native-elements/dist/divider/Divider";
import SegmentedControlTab from "react-native-segmented-control-tab";
import ModalPatrol from "../customization/ModalPatrol";
import EventBus from "../common/EventBus";
import StoreIndicator from "../customization/StoreIndicator";
import TouchableActive from "../touchables/TouchableActive";
import PhoneInfo from "../entities/PhoneInfo";

const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class AnalysisFilter extends Component {
    state = {
        filterSelector: store.filterSelector,
        enumSelector: store.enumSelector,
        storeSelector:store.storeSelector,
        userSelector:store.userSelector,
        viewType: store.enumSelector.viewType.SUCCESS,

        dropDownMode: false,
        dropDownRegion: false,
        modeList:[],

        storeSelectAll:false,
        userSelectAll:false,
        storeMultiSelect:true,
        inspectTableWithAll:true,
        showInspectTable:true,

        params:{},
        mysteryViewMode: false,

        departmentUserList: []
    };

    async componentDidMount(){
        let {filterSelector,params} = this.state;
        await this.getModeList(this.props.type);
        await this.getDepartmentUserList();
        let find = filterSelector.analysis.find(p => p.type == this.props.type);
        if(find.data.inspectId == 0) {
            find.data.inspectName = I18n.t('Select inspect');
            find.data.countries = [I18n.t('All')];
            find.data.provinces = [I18n.t('All')];
            find.data.positions = [I18n.t('All')];
    
            find.data.country = I18n.t('All');
            find.data.province = I18n.t('All');
            find.data.position = I18n.t('All');
        }
        if (find != null){
            await this.setState({params: JSON.parse(JSON.stringify(find.data))});
        }
        await this.initPicker();
        if (this.state.params.storeData.length == 0 && this.state.params.userData.length == 0){
            this.doMode();
        }
    }


    getModeList(type){
        let modeList = [];
        if (type == -1){
            modeList = [I18n.t('Single store'),I18n.t('Store region filter'),I18n.t('Store group filter'),
            I18n.t('Store type filter'),I18n.t('Single user')];
            this.setState({storeMultiSelect:true,inspectTableWithAll:true,showInspectTable:true});
        }
        else if (type == 1){
            modeList = [I18n.t('Single store')];
            this.setState({storeMultiSelect:false,inspectTableWithAll:true,showInspectTable:true});
        }
        else if (type == 2){
            modeList = [I18n.t('Single store'),I18n.t('Store region filter'),I18n.t('Store group filter'),
            I18n.t('Store type filter'),I18n.t('Single user')];
            this.setState({storeMultiSelect:true,inspectTableWithAll:false,showInspectTable:true});
        }
        else if (type == 3){
            modeList = [I18n.t('Single store'),I18n.t('Store region filter'),I18n.t('Store group filter'),
            I18n.t('Store type filter')];
            this.setState({storeMultiSelect:true,inspectTableWithAll:false,showInspectTable:true});
        }
        else if (type == 4){
            modeList = [I18n.t('Single user')];
            this.setState({storeMultiSelect:true,inspectTableWithAll:false,showInspectTable:false});
        }
        this.setState({modeList});
    }

    async getDepartmentUserList() {        
        let {enumSelector, userSelector} = this.state;
        let result = await getUserDefine(0);
        if (result.errCode === enumSelector.errorType.SUCCESS){
            let departmentUserList = [];
            result.data.forEach((item) => {
                if(item.contents.indexOf(userSelector.userId) != -1) {
                    departmentUserList = departmentUserList.concat(item.contents);
                }
            })
            this.setState({departmentUserList});
        }
    }

    async initPicker(){
        let {storeSelector,params,enumSelector} = this.state;
        if (storeSelector.basicList.length == 0){
            this.setState({viewType:enumSelector.viewType.LOADING});
            let result = await getStoreList();
            if (result.errCode !== enumSelector.errorType.SUCCESS){
               this.setState({viewType:enumSelector.viewType.FAILURE});
               return;
            }
            this.setState({viewType:enumSelector.viewType.SUCCESS});
            storeSelector.basicList = result.data;
        }

        storeSelector.basicList.forEach((item)=>{
            if (params.countries.findIndex ( p => p == item.country) == -1){
                params.countries.push(item.country);
            }
        })
        let region = [];
        if (params.country != I18n.t('All')){
            region = storeSelector.basicList.filter(p => p.country === params.country);
        }
        else{
            region = storeSelector.basicList;
        }
        region = region.map(p => {return p.province});
        if (region.length > 0){
            region = Array.from(new Set(region));
            region.unshift(I18n.t('All'));
        }
        params.provinces = region;
        this.setState({params});
    }

    getSingleStoreData(){
        let storelist = store.storeSelector.basicList;
        let {params} = this.state;
        let result = [];
        if (params.checkStoreId != null){
            storelist = storelist.filter(p => params.checkStoreId.indexOf(p.storeId) != -1)
        }
        if (params.searchTextStore != ''){
            storelist = storelist.filter( p => p.name.indexOf(params.searchTextStore) != -1 );
        }
        storelist.forEach(item => {
            let flag = true;
            if (params.country != I18n.t('All') && item.country != params.country){
                flag = false;
            }
            if (params.province != I18n.t('All') && item.province != params.province){
                flag = false;
            }
            if (flag){
                result.push(item);
            }
        })
        let group = [];
        let storeData = [];
        result.forEach(item=>{
            if (group.findIndex (c => c == item.city) == -1){
                group.push(item.city);
            }
        })
        group.forEach(item=>{
            let groupTemp = {group:item,data:[],select:false}
            result.forEach(p=>{
                p.select = params.checkStoreId == null ? false:true;
                if(item === p.city){
                   groupTemp.data.push(p)
                }
            })
            storeData.push(groupTemp);
        })
        params.storeData = storeData;
        this.setState({params});
    }

    getStoreRegionData(){
        let storelist = store.storeSelector.basicList;
        let {params} = this.state;
        let storeData = [];
        if (params.regionIndex == 0){
            let groupTemp = {group:I18n.t('Region one'),data:[],select:false}
            let result = [];
            storelist.forEach(item => {
                let flag = true;
                if (params.country != I18n.t('All') && item.country != params.country){
                    flag = false;
                }
                if (flag){
                    result.push(item);
                }
            })
            result.forEach(p=>{
                let t = {};
                t.select = false;
                t.name = p.province;
                if (groupTemp.data.findIndex(z => z.name == t.name) == -1){
                    groupTemp.data.push(t);
                }
            })
            storeData.push(groupTemp);
        }
        else if (params.regionIndex == 1){
            let groupTemp = {group:I18n.t('Region two'),data:[],select:false}
            let result = [];
            storelist.forEach(item => {
                let flag = true;
                if (params.country != I18n.t('All') && item.country != params.country){
                    flag = false;
                }
                if (params.province != I18n.t('All') && item.province != params.province){
                    flag = false;
                }
                if (flag){
                    result.push(item);
                }
            })
            result.forEach(p=>{
                let t = {};
                t.select = false;
                t.name = p.city;
                if (groupTemp.data.findIndex(z => z.name == t.name) == -1){
                    groupTemp.data.push(t);
                }
            })
            storeData.push(groupTemp);
        }
        params.storeData = storeData;
        this.setState({params});
    }

    async getStoreDefineData(type){
        let {enumSelector} = this.state;
        let {params} = this.state;
        let storeData = [];
        let result = null;
        if (type ==  1){
            let {storeSelector} = this.state;
            if (storeSelector.storeGroup == null){
                this.setState({viewType:enumSelector.viewType.LOADING});
                let result = await getStoreDefine(1);
                if (result.errCode !== enumSelector.errorType.SUCCESS){
                   this.setState({viewType:enumSelector.viewType.FAILURE});
                   return;
                }
                this.setState({viewType:enumSelector.viewType.SUCCESS});
                storeSelector.storeGroup = result.data;
            }
            result = storeSelector.storeGroup;
        }
        else if (type == 0){
            let {storeSelector} = this.state;
            if (storeSelector.storeType == null){
                this.setState({viewType:enumSelector.viewType.LOADING});
                let result = await getStoreDefine(0);
                if (result.errCode !== enumSelector.errorType.SUCCESS){
                    this.setState({viewType:enumSelector.viewType.FAILURE});
                    return;
                }
                this.setState({viewType:enumSelector.viewType.SUCCESS});
                storeSelector.storeType = result.data;
            }
            result = storeSelector.storeType;
        }

        let group = type == 1 ? I18n.t('Store group'):  I18n.t('Store type');
        let groupTemp = {group:group,data:[],select:false}
        result.forEach(p => {
            p.select = false;
            p.name = p.defineName;
            groupTemp.data.push(p);
        });
        storeData.push(groupTemp);
        params.storeData = storeData;
        this.setState({params});
    }

    async getUserData(){
        let userData = [];
        let {enumSelector,userSelector,params} = this.state;
        
        this.setState({viewType:enumSelector.viewType.LOADING});
        let result = await getUserList();
        if (result.errCode !== enumSelector.errorType.SUCCESS){
            this.setState({viewType:enumSelector.viewType.FAILURE});
            return;
        }
        this.setState({viewType:enumSelector.viewType.SUCCESS});

        let userList = result.data;
        let mysteryList = [];
        if (params.checkMysteryId != null){
            mysteryList = userList.filter(p => ((params.checkMysteryId.indexOf(p.userId) != -1) && (p.mystery == true)));
        }
        if (params.checkUserId != null){
            userList = userList.filter(p => params.checkUserId.indexOf(p.userId) != -1);
        }

        if (userSelector.userPosition == null){
            this.setState({viewType:enumSelector.viewType.LOADING});
            let result = await getUserDefine(1);
            if (result.errCode !== enumSelector.errorType.SUCCESS){
                this.setState({viewType:enumSelector.viewType.FAILURE});
                return;
            }
            this.setState({viewType:enumSelector.viewType.SUCCESS});
            userSelector.userPosition = result.data;
        }
        let positions = [I18n.t('All')];
        userSelector.userPosition.forEach(item => {
            let data = [];
            let check = false;
            item.contents.forEach(content => {
                let find = userList.find(p => p.userId == content);
                if (find != null && find.mystery == false){
                    check = true;
                    let flag = true;
                    if (params.searchTextUser != ''){
                        if (find.userName.indexOf(params.searchTextUser) == -1){
                            flag = false;
                        }
                    }
                    if (flag){
                        let t = {};
                        t.select = params.checkUserId == null ? false:true;
                        t.userId = find.userId;
                        t.name = find.userName;
                        data.push(t);
                    }
                }
            })
            if (check){
                positions.push(item.defineName);
                if (data.length > 0){
                    let group = {group:item.defineName,select:false,data:data};
                    userData.push(group);
                }
            }
        })
        if (params.position != I18n.t('All')){
            userData = userData.filter(p => p.group == params.position);
        }
        params.userData = userData;
        params.positions = positions;
        let tmpData = [];
        mysteryList.forEach(item=>{
            let flag = true;
            if (params.searchTextUser != ''){
                if (item.userName.indexOf(params.searchTextUser) == -1){
                    flag = false;
                }
            }
            if(flag) {
                tmpData.push({
                    select: params.checkUserId == null ? false : true,
                    userId: item.userId,
                    name: item.userName
                })
            }            
        });
        params.mysteryData = [{
            group: I18n.t('Mystery'),
            select: false,
            data: tmpData
        }];
        this.setState({params});
    }

    filterUserDepartment() {
        let {userSelector,params,departmentUserList} = this.state;
        if(userSelector.roleId == 1) {
            return;
        }
        let tempUserData = [];
        params.userData.forEach((item) => {
            let tempData = [];
            item.data.forEach((user) => {
                if(user.userId == userSelector.userId) {
                    tempData.push(user);
                } else if(departmentUserList.indexOf(user.userId) != -1) {
                    tempData.push(user);
                }
            })
            item.data = tempData;
            if(tempData.length > 0) {
                tempUserData.push(item);
            }
        })
        params.userData = tempUserData;
        this.setState({params});
    }

    async onSelectTab(tabIndex){
        EventBus.closeModalAll();
        let {params,enumSelector,mysteryViewMode} = this.state;
        params.tabIndex = tabIndex;
        let name = this.state.modeList[params.modeIndex];
        if (name == I18n.t('Single store') && tabIndex == 1){
            params.searchTextUser = '';

            let selectStoreId = [];
            if(this.props.type == 1) {
                if (params.selectStore){
                    selectStoreId.push(params.selectStore.storeId);
                }
            } else {
                params.storeData.forEach(item =>{
                    item.data.forEach(p =>{
                        if (p.select){
                            selectStoreId.push(p.storeId);
                        }
                    })
                });
            }

            if (params.lastCheckStoreId && params.lastCheckStoreId.length == selectStoreId.length){
                let flag = true;
                selectStoreId.forEach(item => {
                    if (params.lastCheckStoreId.findIndex(p => p == item) == -1){
                        flag = false;
                    }
                })
                if (flag){
                    this.setState({params});
                    return;
                }
            }

            let checkUserId = [], checkMysteryId = [];
            if (selectStoreId.length > 0){
                let request = {};
                request.type = 0;
                request.ids = selectStoreId;
                this.setState({viewType:enumSelector.viewType.LOADING});
                let result = await getStoreUser(request);
                if (result.errCode !== enumSelector.errorType.SUCCESS){
                    this.setState({viewType:enumSelector.viewType.FAILURE});
                    return;
                }
                checkUserId = result.data.userIds;

                // 取得有門店權限的神秘客
                request.isMysteryMode = true;
                result = await getStoreUser(request);
                if (result.errCode !== enumSelector.errorType.SUCCESS){
                    this.setState({viewType:enumSelector.viewType.FAILURE});
                    return;
                }
                checkMysteryId = result.data.userIds;
                this.setState({viewType:enumSelector.viewType.SUCCESS});
            }
            params.checkUserId = checkUserId;
            params.lastCheckStoreId = selectStoreId;
            params.checkMysteryId = checkMysteryId;
            await this.setState({params});
            this.getUserData();
        } else if (name == I18n.t('Single user') && tabIndex == 0){
            params.country = I18n.t('All');
            params.province = I18n.t('All');
            params.searchTextStore = '';
            let selectUserId = [];
            if(mysteryViewMode == true) {
                params.mysteryData.forEach(item =>{
                    item.data.forEach(p =>{
                        if (p.select){
                            selectUserId.push(p.userId);
                        }
                    })
                });
            } else {
                params.userData.forEach(item =>{
                    item.data.forEach(p =>{
                        if (p.select){
                            selectUserId.push(p.userId);
                        }
                    })
                });
            }            

            if (params.lastCheckUserId && params.lastCheckUserId.length == selectUserId.length && params.lastMyteryMode == mysteryViewMode){
                let flag = true;
                selectUserId.forEach(item => {
                    if (params.lastCheckUserId.findIndex(p => p == item) == -1){
                        flag = false;
                    }
                })
                if (flag){
                    this.setState({params});
                    return;
                }
            }

            let checkStoreId = [];
            if (selectUserId.length > 0){
                let request = {};
                request.type = 1;
                request.ids = selectUserId;
                request.isMysteryMode = mysteryViewMode;
                this.setState({viewType:enumSelector.viewType.LOADING});
                let result = await getStoreUser(request);
                if (result.errCode !== enumSelector.errorType.SUCCESS){
                    this.setState({viewType:enumSelector.viewType.FAILURE});
                    return;
                }
                this.setState({viewType:enumSelector.viewType.SUCCESS});
                checkStoreId = result.data.storeIds;
            }
            params.checkStoreId = checkStoreId;
            params.lastCheckUserId = selectUserId;
            params.lastMyteryMode = mysteryViewMode;
            await this.setState({params});
            this.getSingleStoreData();
        }
        this.setState({params})
    }

    async doMode(){
        let {params,enumSelector} = this.state;
        params.country = I18n.t('All');
        params.province = I18n.t('All');
        params.position = I18n.t('All');
        params.positions = [I18n.t('All')];
        params.searchTextStore = '';
        params.searchTextUser = '';
        params.checkUserId = null;
        params.checkStoreId = null;
        params.selectStore = null;
        let name = this.state.modeList[params.modeIndex];
        if (name == I18n.t('Single store')){
            params.tabIndex = 0;
            params.userData = [];
        }
        else if (name == I18n.t('Store region filter')){
            params.regionIndex = 0;
        }
        else if (name == I18n.t('Single user')){
            params.tabIndex = 1;
            params.storeData = [];
        }
        await this.setState({params,viewType:enumSelector.viewType.SUCCESS});

        if (name == I18n.t('Single store')){
            this.getSingleStoreData();
        }
        else if (name == I18n.t('Store region filter')){
            this.getStoreRegionData();
        }
        else if (name == I18n.t('Single user')){
            await this.getUserData();
            this.filterUserDepartment();
        }
        else if (name == I18n.t('Store group filter')){
            this.getStoreDefineData(1);
        }
        else if (name == I18n.t('Store type filter')){
            this.getStoreDefineData(0);
        }
    }

    async onConfirm(){
        let {filterSelector,params,storeSelector,enumSelector,mysteryViewMode} = this.state;
        if (this.state.showInspectTable && params.inspectId == 0){
            DeviceEventEmitter.emit('Toast', I18n.t('Select inspect'));
            return;
        }

        let storeId = [];
        let userId = [];
        let content = [];
        let text = '';
        let name = this.state.modeList[this.state.params.modeIndex];
        if (name == I18n.t('Single store') || name == I18n.t('Single user')){
            let storeName = [];
            let userName = [];
            if (this.props.type == 1){
                if (params.selectStore){
                    storeName.push(params.selectStore.name);
                    storeId.push(params.selectStore.storeId);
                }
            } else {
                this.state.params.storeData.forEach(item => {
                    item.data.forEach(p=>{
                        if (p.select){
                            storeName.push(p.name);
                            storeId.push(p.storeId);
                        }
                    })
                });
            }

            if(mysteryViewMode == true) {
                this.state.params.mysteryData.forEach(item => {
                    item.data.forEach(p=>{
                        if (p.select){
                            userName.push(p.name);
                            userId.push(p.userId);
                        }
                    })
                });
            } else {
                this.state.params.userData.forEach(item => {
                    item.data.forEach(p=>{
                        if (p.select){
                            userName.push(p.name);
                            userId.push(p.userId);
                        }
                    })
                });
            }
            
            if (name == I18n.t('Single store')) {
                if (storeName.length == 1){
                    text = storeName[0];
                } else {
                    text = I18n.t("Filter select", {number:storeName.length,type:I18n.t("Patrol")});
                }
            } else {
                if (userName.length == 1) {
                    text = userName[0];
                } else {
                    if (PhoneInfo.getLanguage() == 'en'){
                        text = userName.length + ' people';
                    }
                    else{
                        text = I18n.t("Filter select", {number:userName.length,type:I18n.t("People unit")});
                    }         
                }
            }
        } else if (name == I18n.t('Store region filter')) {
            let storelist = store.storeSelector.basicList;
            if (params.regionIndex == 0) {
                let province = [];
                this.state.params.storeData.forEach(item => {
                    item.data.forEach(p=>{
                        if (p.select){
                            province.push(p.name);
                        }
                    })
                });

                province.forEach(item =>{
                    let findStores = storelist.filter(p => p.province == item);
                    if (findStores.length > 0){
                        let c = {};
                        c.name = item;
                        let id = [];
                        findStores.forEach(s => {
                            storeId.push(s.storeId);
                            id.push(s.storeId);
                        })
                        c.id = id;
                        content.push(c);
                    }
                })

                if (province.length == 1) {
                    text = province[0];
                } else {
                    text = I18n.t("Filter select", {number:province.length,type:I18n.t("Region one")});
                }
            } else {
                let city = [];
                this.state.params.storeData.forEach(item => {
                    item.data.forEach(p=>{
                    if (p.select){
                        city.push(p.name);
                    }
                    })
                });

                city.forEach(item =>{
                    let findStores = storelist.filter(p => p.city == item);
                    if (findStores.length > 0){
                        let c = {};
                        c.name = item;
                        let id = [];
                        findStores.forEach(s => {
                            storeId.push(s.storeId);
                            id.push(s.storeId);
                        })
                        c.id = id;
                        content.push(c);
                    }
                })

                if (city.length == 1){
                    text = city[0];
                }
                else{
                    text = I18n.t("Filter select", {number:city.length,type:I18n.t("Region two")});
                }
            }
        } else if (name == I18n.t('Store type filter') || name == I18n.t('Store group filter')) {
            let group = [];
            this.state.params.storeData.forEach(item => {
                item.data.forEach(p=>{
                    if (p.select){
                        let temp = {};
                        temp.name = p.name;
                        group.push(p.name);
                        let id = [];
                        p.contents.forEach(c =>{
                            storeId.push(c);
                            id.push(c);
                        })
                        temp.id = id;
                        content.push(temp);
                    }
                })
            });
            if (group.length == 1) {
                text = group[0];
            } else {
                if (name == I18n.t('Store type filter')){
                    text = I18n.t("Filter select", {number:group.length,type:I18n.t("Store type")});
                }
                else{
                    text = I18n.t("Filter select", {number:group.length,type:I18n.t("Store group")});
                }
            }
        }

        if (name == I18n.t('Single user')){
            if (userId.length == 0){
                DeviceEventEmitter.emit('Toast', I18n.t('Filter none'));
                return;
            }
        } else {
            if (storeId.length == 0){
                DeviceEventEmitter.emit('Toast', I18n.t('Filter none'));
                return;
            }
        }

        let typeName = this.state.modeList[this.state.params.modeIndex];
        let type = -1;
        switch(typeName) {
            case I18n.t('Single store'):
                type = 0;
                break;
            case I18n.t('Store region filter'):
                type = this.state.params.regionIndex == 0 ? 1 : 2;
                break;
            case I18n.t('Store group filter'):
                type = 4;
                break;
            case I18n.t('Store type filter'):
                type = 3;
                break;
            case I18n.t('Single user'):
                type = 5;
                break;
            default :
                type = 0;
                break;
        }

        params.result.type = type;
        params.result.storeId = storeId.length > 0 ? storeId : [];
        params.result.userId = userId.length > 0 ? userId : [] ;
        params.result.content = content.length > 0 ? content : null;

        let inspects = [];
        if (this.state.showInspectTable){
            let insName  = params.inspectName;
            if (insName == I18n.t('All')){
                insName = I18n.t('All table');
            }
            text += ', ' + insName;
            if (params.inspectId == -1){
                if (storeSelector.inspectTable == null){
                    let result = await getInspectTagList(null);
                    if (result.errCode !== enumSelector.errorType.SUCCESS){
                        DeviceEventEmitter.emit('Toast', I18n.t('Load fail'));
                        return;
                    }
                    storeSelector.inspectTable = result.data;
                }
                storeSelector.inspectTable.forEach(item => {
                    let inspect = {};
                    inspect.id = item.id,
                    inspect.name = item.name;
                    inspects.push(inspect);
                })
            } else {
                let inspect = {};
                inspect.id = params.inspectId,
                inspect.name = params.inspectName;
                inspects.push(inspect);
            }
        } else {
            inspects = null;
        }
        params.result.inspect = inspects;
        params.result.text = text;
        params.mysteryMode = mysteryViewMode;

        let find = filterSelector.analysis.find(p => p.type == this.props.type);
        if (find != null){
            find.data = params;
        }
        await this.setState({filterSelector});
        DeviceEventEmitter.emit('OnAnalysisFilter');
        Actions.pop();
    }

    async clickMode(item,index){
        let {params} = this.state;
        setTimeout(() => {
            this.modalDownList && this.modalDownList.close();
        }, 200);
        params.modeIndex = index;
        this.setState({params,dropDownMode:false});
        this.doMode();
    }

    async onCountrySelect(item){
        let {params,storeSelector} = this.state;
        if ((item !== params.country)){
            params.country = item;
            params.province = I18n.t('All');
            params.searchTextStore = '';
            await this.setState({params});
        }
        let region = [];
        if (item != I18n.t('All')){
            region = storeSelector.basicList.filter(p => p.country === item);
        }
        else{
            region = storeSelector.basicList;
        }
        region = region.map(p => {return p.province});
        if (region.length > 0){
            region = Array.from(new Set(region));
            region.unshift(I18n.t('All'));
        }
        params.provinces = region;
        await this.setState({params});
        let name = this.state.modeList[this.state.params.modeIndex];
        if (name == I18n.t('Single store') || name == I18n.t('Single user')){
            this.getSingleStoreData();
        }
        else if (name == I18n.t('Store region filter')){
            this.getStoreRegionData();
        }
    }

    async onProvinceSelect(item){
        let {params} = this.state;
        params.province = item;
        params.searchTextStore = '';
        await this.setState({params});
        let name = this.state.modeList[this.state.params.modeIndex];
        if (name == I18n.t('Single store') || name == I18n.t('Single user')){
            this.getSingleStoreData();
        }
        else if (name == I18n.t('Store region filter')){
            this.getStoreRegionData();
        }
    }

    async onPositionSelect(item){
        let {params} = this.state;
        params.position = item;
        params.searchTextUser = '';
        this.setState({params}, async function() {
            await this.getUserData();
            let name = this.state.modeList[params.modeIndex];
            if (name == I18n.t('Single user')){
                this.filterUserDepartment();
            }
        });        
    }

    onClick(visible){
        this.modalDownList && this.modalDownList.close();
        this.regionDownList && this.regionDownList.close();
    }

    doSelectAll(){
        EventBus.closeModalAll();
        let flag = true;
        let name = this.state.modeList[this.state.params.modeIndex];
        if (name == I18n.t('Single store') || name == I18n.t('Single user')){
            if (this.state.params.tabIndex == 1){
                flag = false;
            }
        }
        if (flag){
            let {params} = this.state;
            let check = true;
            params.storeData.forEach(item => {
                item.data.forEach( p=>{
                    if (!p.select){
                        check = false;
                    }
                })
            });
            params.storeData.forEach(item => {
                item.data.forEach( p=>{
                    p.select = !check
                })
            });

            this.setState({params});
        } else {
            let {params, mysteryViewMode} = this.state;
            let check = true;
            if(mysteryViewMode == true) {
                params.mysteryData[0].data.forEach(item => {
                    if (!item.select){
                        check = false;
                    }
                });
                params.mysteryData[0].data.forEach(item => {
                    item.select = !check
                });
            } else {
                params.userData.forEach(item => {
                    item.data.forEach( p=>{
                        if (!p.select){
                            check = false;
                        }
                    })
                });
                params.userData.forEach(item => {
                    item.data.forEach( p=>{
                        p.select = !check
                    })
                });
            }
            
            this.setState({params});
        }
    }

    mysteryVisible() {
        this.setState({mysteryViewMode: !this.state.mysteryViewMode});
    }

    doSelectGroup(group){
        EventBus.closeModalAll();
        let {params} = this.state;
        let data = params.storeData;
        let name = this.state.modeList[this.state.params.modeIndex];
        if (name == I18n.t('Single store') || name == I18n.t('Single user')){
            if (this.state.params.tabIndex == 1){
                data = params.userData;
            }
        }
        let targetStore = data.find(p => p.group == group);
        if (targetStore != null){
            let selectCount = 0;
            targetStore.data.forEach(item => {
                if (item.select){
                    selectCount++;
                }
            });
            if (selectCount == targetStore.data.length){
                targetStore.data.forEach(item => {
                    item.select = false;
                });
            }
            else{
                targetStore.data.forEach(item => {
                    item.select = true;
                });
            }
        }
        this.setState({params});
    }

    renderMode(){
        let {params, dropDownMode} = this.state;
        let borderColor = dropDownMode ? '#2C90D9' : '#fff';
        let name = this.state.modeList[params.modeIndex];
        let inspectTable = null;
        if (this.state.showInspectTable){ 
            inspectTable = (
                <TouchableOpacity onPress={() => {
                    if (this.modalPatrol){
                        this.modalDownList && this.modalDownList.close();
                        this.regionDownList && this.regionDownList.close();
                        EventBus.closeModalAll();
                        if (this.state.inspectTableWithAll){
                            this.modalPatrol.openEx(params.inspectName);
                        }
                        else{
                            this.modalPatrol.openExWithoutAll(params.inspectName);
                        }
                    }
                }}>
                <View style={{flexDirection:'row',alignItems:'center'}}>
                    <Image source={require('../assets/images/inspect_table.png')} style={{width:13,height:15,marginTop:16}}/>
                    <Text numberOfLines={1} style={{color:'#006ab7',fontSize:14,marginTop:16,marginLeft:5,textDecorationLine:'underline',maxWidth:220}}>
                        {params.inspectName}
                    </Text>
                </View>
            </TouchableOpacity>
            )
        }

        let modeTable = null;
        if (this.state.modeList.length > 1) { 
            modeTable = (
                <TouchableOpacity activeOpacity={0.5} style={styles.btnCard} onPress={() => {
                    this.setState({dropDownMode:true,dropDownRegion:false});
                    EventBus.closeModalAll();
                    this.regionDownList && this.regionDownList.close();
                    this.modalDownList.open();
                }}>
                    <Text style={styles.tableName}>{name}</Text>
                    <Image source={require('../assets/images/drop_down.png')} style={styles.arrow}/>
                </TouchableOpacity>
            )
        } else{ 
            modeTable = (
                <View style={styles.btnCard} >
                    <Text style={styles.tableName}>{name}</Text>
                </View>
            )
        }

        return (
            <View>
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',width:width-35}}>
                    <Text style={styles.label}>{I18n.t('Analysis mode')}</Text>
                    {inspectTable}
                </View>

                <BoxShadow setting={{width:width-48, height:46, color:"#000000",
                    border:1, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:8,marginLeft:14}}}>
                    <View style={[styles.tablePanel,{borderColor, borderWidth:1}]}>
                     {modeTable}
                    </View>
                </BoxShadow>
            </View>
        )
    }

    renderSingleStore(){
        let {params, mysteryViewMode} = this.state;
        let width = (PhoneInfo.getLanguage() == 'zh-CN' || PhoneInfo.getLanguage() == 'zh-TW') ? 70:120;
        (PhoneInfo.isTHLanguage() || PhoneInfo.isVNLanguage()) && (width = 140);
        PhoneInfo.isIDLanguage() && (width = 160);

        if (params.tabIndex == 0){
            let selectAllStore = null;

            let text =  I18n.t('None select');
            params.storeData.forEach(item => {
                item.data.forEach(p=>{
                    if (!p.select){
                        text = I18n.t('All select')
                    }
                })
            });

            if (this.state.storeMultiSelect == true && params.storeData.length > 1) { 
                selectAllStore = (
                    <TouchableOpacity activeOpacity={0.6} onPress={() => this.doSelectAll()}>
                            <View style={[styles.viewStyle,{backgroundColor:'white'}]}>
                                <Text style={[styles.textStyle,{color:'#006AB7',width:width}]}>{text}</Text>
                            </View>
                    </TouchableOpacity>
                )
            }

            return (
                <View>
                    <Text style={styles.label}>{I18n.t('Region select')}</Text>
                    <View style={styles.containerOption}>
                        <View style={{flexDirection: 'row',alignItems:'center'}}>
                        <OptionSelector options={params.countries} majorKey={'country'}
                                    defaultValue={params.country}
                                    selectTextStyle={styles.selectCountry}
                                    containerStyle={styles.country}
                                    optionContainerStyle={{width:140}}
                                    marginLeft={-9}
                                    onClick={(visible)=>{this.onClick(visible)}}
                                    onSelect={async (item) => {await this.onCountrySelect(item)}}/>
                        <OptionSelector options={params.provinces} majorKey={'province'}
                                    defaultValue={params.province}
                                    selectTextStyle={styles.selectProvince}
                                    containerStyle={styles.province}
                                    optionContainerStyle={{width:140}}
                                    marginLeft={-9}
                                    optionEnable={params.provinces.length >0}
                                    onClick={(visible)=>{this.onClick(visible)}}
                                    onSelect={(item) => {this.onProvinceSelect(item)}}/>
                        </View>
                        {selectAllStore}
                    </View>
                </View>
            )
        } else if (params.tabIndex == 1) {
            let selectAllUser = null, mysterySelect = null;
            if(mysteryViewMode == true) {
                if (params.mysteryData && params.mysteryData[0].data && params.mysteryData[0].data.length > 1) {
                    let text = I18n.t('None select');
                    params.mysteryData[0].data.forEach(item => {
                        if (!item.select) {
                            text = I18n.t('All select')
                        }
                    });
                    selectAllUser = (
                        <TouchableOpacity activeOpacity={0.6} onPress={() => this.doSelectAll()}>
                            <View style={[styles.viewStyle,{backgroundColor:'white'}]}>
                                <Text style={[styles.textStyle,{color:'#006AB7',width:width}]}>{text}</Text>
                            </View>
                        </TouchableOpacity>
                    )
                }
            } else {
                if (params.userData.length > 1) {
                    let text = I18n.t('None select');
                    params.userData.forEach(item => {
                        item.data.forEach( p=> {
                            if (!p.select) {
                                text = I18n.t('All select')
                            } 
                        })
                    });
                    selectAllUser = (
                        <TouchableOpacity activeOpacity={0.6} onPress={() => this.doSelectAll()}>
                            <View style={[styles.viewStyle,{backgroundColor:'white'}]}>
                                <Text style={[styles.textStyle,{color:'#006AB7',width:width}]}>{text}</Text>
                            </View>
                        </TouchableOpacity>
                    )
                }
            }
            
            if (params.mysteryData && params.mysteryData[0].data && params.mysteryData[0].data.length > 0) {
                let text = mysteryViewMode ? I18n.t('General') : I18n.t('Mystery');
                mysterySelect = (
                    <TouchableOpacity activeOpacity={0.6} onPress={() => this.mysteryVisible()} style={{marginRight: 10}}>
                        <View style={[styles.viewStyle,{backgroundColor:'white'}]}>
                            <Text style={[styles.textStyle,{color:'#006AB7',width:width}]}>{text}</Text>
                        </View>
                    </TouchableOpacity>
                )
            }
            return (
                <View>
                    <Text style={styles.label}>{mysteryViewMode == false ? I18n.t('Positon select') : ""}</Text>
                    <View style={styles.containerOption}>
                        <View style={{flexDirection: 'row',alignItems:'center'}}>
                        {mysteryViewMode == false && <OptionSelector options={params.positions} majorKey={'country'}
                                    defaultValue={params.position}
                                    selectTextStyle={styles.selectCountry}
                                    containerStyle={styles.country}
                                    marginLeft={-9}
                                    optionContainerStyle={{width:140}}
                                    onClick={(visible)=>{this.onClick(visible)}}
                                    onSelect={async (item) => {await this.onPositionSelect(item)}}/>}
                        </View>
                        <View style={{flexDirection: 'row',alignItems:'center'}}>
                            {mysterySelect}
                            {selectAllUser}
                        </View>
                </View>
                </View>
            )
        }
    }

    renderStoreRegion(){
        let {params, dropDownRegion} = this.state;
        let borderColor = dropDownRegion ? '#2C90D9' : '#fff';
        let name = [I18n.t('Region one filter'),I18n.t('Region two filter')][params.regionIndex];
        let provinSelect = null;
        if (params.regionIndex == 1){ provinSelect = (
           <OptionSelector options={params.provinces} majorKey={'province'}
                                defaultValue={params.province}
                                selectTextStyle={styles.selectProvince}
                                containerStyle={styles.province}
                                optionContainerStyle={{width:140}}
                                marginLeft={-9}
                                optionEnable={params.provinces.length >0}
                                onClick={(visible)=>{this.onClick(visible)}}
                                onSelect={(item) => {this.onProvinceSelect(item)}}/>
        )
        }
        return (
            <View>
                <Text style={styles.label}>{I18n.t('Region analysis')}</Text>
                <BoxShadow setting={{width:width-48, height:46, color:"#000000",
                    border:1, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:8,marginLeft:14}}}>
                    <View style={[styles.tablePanel,{borderColor, borderWidth:1}]}>
                        <TouchableOpacity activeOpacity={0.5} style={styles.btnCard} onPress={() => {
                            this.setState({dropDownRegion: true,dropDownMode: false});
                            EventBus.closeModalAll();
                            this.modalDownList && this.modalDownList.close();
                            this.regionDownList.open();
                        }}>
                            <Text style={styles.tableName}>{name}</Text>
                            <Image source={require('../assets/images/drop_down.png')} style={styles.arrow}/>
                        </TouchableOpacity>
                    </View>
                </BoxShadow>
                <Text style={styles.label}>{I18n.t('Region select')}</Text>
                <View style={styles.containerOption}>
                    <View style={{flexDirection: 'row',alignContent:'center'}}>
                    <OptionSelector options={params.countries} majorKey={'country'}
                                defaultValue={params.country}
                                selectTextStyle={styles.selectCountry}
                                containerStyle={styles.country}
                                optionContainerStyle={{width:140}}
                                marginLeft={-9}
                                onClick={(visible)=>{this.onClick(visible)}}
                                onSelect={async (item) => {await this.onCountrySelect(item)}}/>
                    {provinSelect}
                    </View>
            </View>
            </View>
        )
    }

    renderContent(){
        let content = null;
        let {params} = this.state;
        let name = this.state.modeList[params.modeIndex]
        switch(name) {
            case I18n.t('Single store'):
               content = this.renderSingleStore();
               break;
            case I18n.t('Store region filter'):
               content = this.renderStoreRegion();
               break;
            case I18n.t('Store group filter'):
               break;
            case I18n.t('Store type filter'):
               break;
            case I18n.t('Single user'):
               content = this.renderSingleStore();
               break;
            default :
               content = this.renderSingleStore();
               break;
       }
        return (
            <View>
                {content}
            </View>
        )
    }

    onSelect(item){
        EventBus.closeModalAll();
        let flag = true;
        let {params} = this.state;
        let name = this.state.modeList[this.state.params.modeIndex];
        if (name == I18n.t('Single store') || name == I18n.t('Single user')){
            if (this.state.params.tabIndex == 1){
                flag = false;
            }
        }
        if(flag) {
            item.select = !item.select;
            params.selectStore = item
            this.setState({params});
        } else {
            item.select = !item.select;
            this.setState({params});
        }
    }

    renderColumns = ({item,index}) => {
        const {selectStore} = this.state.params;
        let name = this.state.modeList[this.state.params.modeIndex];
        let checkImg = null;
        let cellSelect = false;
        if(this.props.type == 1 && this.state.params.tabIndex == 0){
            if (selectStore && selectStore.storeId === item.storeId){ 
                checkImg = (
                    <Image source={require('../assets/images/btn_check_blue.png')} style={styles.check}/>
                )
            }
            cellSelect = checkImg != null;
        } else {
            if (item.select) { 
                checkImg = (
                    <Image source={require('../assets/images/btn_check_blue.png')} style={styles.check}/>
                )
            } else {  
                checkImg = (
                    <View style={styles.unCheck}/>
                )
            }
            cellSelect = item.select;
        }

        let storeImg = null;
        if (name == I18n.t('Single store') || name == I18n.t('Single user')) {
            if (this.state.params.tabIndex == 0){
                storeImg = (
                    <Image source={require('../assets/images/no_task.png')} style={styles.noTask}/>
                )
            }
        }

        return (
            <View style={styles.group}>
                <TouchableWithoutFeedback onPress={()=>{this.onSelect(item)}}>
                    <View style={[styles.blobContainer, {marginLeft: (index%3 !== 0) ? 10 : 1,marginTop:12}, BorderShadow.div,
                        cellSelect && BorderShadow.focus]}>
                        <View style={styles.statusImg}>
                            <Text style={styles.blobName} numberOfLines={2}>{item.name}</Text>
                        </View>
                        {storeImg}
                        {checkImg}
                    </View>
                </TouchableWithoutFeedback>
            </View>
        )
    }

    renderDetail = ({item,index}) => {
        let name = this.state.modeList[this.state.params.modeIndex];
        let selectAll = null;
        let selectCount = 0;
        item.data.forEach(element => {
            if (element.select){
                selectCount++;
            }   
        });
        let text = I18n.t('All select');
        if (selectCount == item.data.length){
            text = I18n.t('None select');
        }
        let width = (PhoneInfo.getLanguage() == 'zh-CN' || PhoneInfo.getLanguage() == 'zh-TW') ? 70:120;        
        (PhoneInfo.isTHLanguage() || PhoneInfo.isVNLanguage()) && (width = 140);
        PhoneInfo.isIDLanguage() && (width = 160);

        if ((this.state.storeMultiSelect == false && this.state.params.tabIndex == 0 && name == I18n.t('Single store'))|| item.data.length == 0){}
        else{ selectAll = (
                <TouchableOpacity activeOpacity={0.6} onPress={() => this.doSelectGroup(item.group)}>
                        <View style={[styles.viewStyle,{backgroundColor:'white',marginTop:12,marginRight:5}]}>
                             <Text style={[styles.textStyle,{color:'#006AB7',width:width}]}>{text}</Text>
                        </View>
                </TouchableOpacity>
            )
        }

        if(this.state.mysteryViewMode) {
            selectAll = null;
        }

        return (
            <TouchableOpacity activeOpacity={1} onPress={()=>{
                EventBus.closeModalAll();
            }}>
                <View style={styles.cityGroup}>
                    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                         <Text style={styles.cityText}>{item.group}</Text>
                         {selectAll}
                    </View>
                    <FlatList
                        numColumns={3}
                        data={item.data}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderColumns}
                        showsVerticalScrollIndicator={false}/>
                </View>
            </TouchableOpacity>
        )
    };

    renderData(){
        let seachBarT = null;
        let {viewType,enumSelector,mysteryViewMode} = this.state;
        let name = this.state.modeList[this.state.params.modeIndex];
        let data = this.state.params.storeData;
        if (name == I18n.t('Single store') || name == I18n.t('Single user')){
            if (this.state.params.tabIndex == 1){
                if(mysteryViewMode == true) {
                    data = this.state.params.mysteryData;
                } else {
                    data = this.state.params.userData;
                }                
            }
        }

        let value = this.state.params.tabIndex == 0 ? this.state.params.searchTextStore: this.state.params.searchTextUser;
        if ( (name == I18n.t('Single store') || name == I18n.t('Single user')) ){ 
            seachBarT = (
                <View style={{flexDirection: 'row',height:40,marginLeft:2,marginRight:2, backgroundColor:'white',width:width-45,borderRadius:20,marginTop:15,marginBottom:8}}>
                <TextInput style={{width:width-100,height:40,marginLeft:10,color:'#404554'}} value={value}
                    placeholder={I18n.t('Enter search content')} returnKeyType='search'
                    placeholderTextColor={'#c2c6cc'}
                    onChangeText={(text) =>{
                            let {params} = this.state;
                            if (this.state.params.tabIndex == 0){
                                params.searchTextStore = text;
                            }
                            else{
                                params.searchTextUser = text;
                            }
                            this.setState({params});
                    }}
                    onEndEditing={() =>{
                        if (this.state.params.tabIndex == 0){
                            this.getSingleStoreData();
                        }
                        else{
                            this.getUserData();
                        }
                    }}/>
                <Image source={require('../assets/images/search_icon.png')} style={{height:20,width:20,marginLeft:10,marginTop:10}}/>
            </View>
        )}

        let dataShow = null;
        if (viewType == enumSelector.viewType.SUCCESS && (data && data.length) == 0){
            viewType = enumSelector.viewType.EMPTY;
        }
        if (viewType == enumSelector.viewType.SUCCESS){ 
            dataShow = (
                <FlatList
                        data={data}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderDetail}
                        ItemSeparatorComponent={() => <Divider style={styles.divider}/>}
                        showsVerticalScrollIndicator={false}/>
            )
        } else { 
            dataShow = (
                <StoreIndicator viewType={viewType} emptyIcon = {require('../assets/images/icon_no_data.png')}
                            containerStyle={{paddingBottom:30,marginTop:50}} prompt={I18n.t('No data')}
                            refresh={() => {}}
                />
            )
        }

        return (
            <View style={styles.dataList}>
               {seachBarT}
               <ScrollView showsVerticalScrollIndicator={false}>
                   {dataShow}
                  <SlotStore />
               </ScrollView>
            </View>
        )
    }

    clickRegion(item,index){
        let {params} = this.state;
        setTimeout(() => {
            this.regionDownList.close();
        }, 200);

        params.regionIndex = index;
        this.setState({params, dropDownRegion:false});
        this.getStoreRegionData();
    }

    renderRow = ({ item,index}) => {
        let {params} = this.state;
        let selected = (index == params.modeIndex);
        let backgroundColor = selected ? '#ECF7FF' : '#fff';
        let color = selected ? '#404554': '#707070';
        let borderColor = selected ? '#2C90D9' : null;
        let borderWidth = selected ? 1 : 0;

        return (
            <TouchableOpacity activeOpacity={1} onPress={this.clickMode.bind(this,item,index)} >
                <View style={[styles.outBox,{backgroundColor, width: width-48, borderColor,borderWidth}]}>
                    <Text style={[styles.brandName,{backgroundColor,color}]} numberOfLines={1}>{item}</Text>
                </View>
            </TouchableOpacity>
        )
    };

    renderRegionList = ({ item,index}) =>{
        let {params} = this.state;
        let selected = (index == params.regionIndex);
        let backgroundColor = selected ? '#ECF7FF' : '#fff';
        let color = selected ? '#404554': '#707070';
        let borderColor = selected ? '#2C90D9' : null;
        let borderWidth = selected ? 1 : 0;

        return (
            <TouchableOpacity activeOpacity={1} onPress={this.clickRegion.bind(this,item,index)} >
                <View style={[styles.outBox,{backgroundColor, width: width-48, borderColor,borderWidth}]}>
                    <Text style={[styles.brandName,{backgroundColor,color}]} numberOfLines={1}>{item}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    render() {
        let {params,modeList} = this.state;
        let offsetY = Platform.select({
            android: 150,
            ios: 140
        });
        offsetY = offsetY + lib.statusBarHeight();
        let offsetY2 = Platform.select({
            android: 230,
            ios: 220
        });
        offsetY2 = offsetY2 + lib.statusBarHeight();

        let selectTab = null;
        let name = this.state.modeList[params.modeIndex];
        if (name == I18n.t('Single store') || name == I18n.t('Single user')){ 
            selectTab = (
                <BoxShadow setting={{width:width-48, height:32, color:"#000000",
                        border:2, radius:10, opacity:0.1, x:0, y:1,style:{marginLeft:16,marginTop:15}}}>
                        <View style={styles.segment}>
                            <SegmentedControlTab
                                values={[I18n.t('Store select'), I18n.t('User select')]}
                                selectedIndex={params.tabIndex}
                                onTabPress={(tabIndex)=>{this.onSelectTab(tabIndex)}}
                                borderRadius={10}
                                firstTabStyle={{borderRightWidth:1}}
                                tabsContainerStyle={{height:32}}
                                tabStyle={styles.tabInactive}
                                tabTextStyle={styles.textInactive}
                                activeTabBadgeStyle={{width:100}}
                                activeTabStyle={[styles.tabActive]}/>
                        </View>
                </BoxShadow>

            )
        }

        return (
            <View style={styles.container}>
                <Navigation
                    onLeftButtonPress={()=>{
                        this.modalDownList && this.modalDownList.close();
                        this.regionDownList && this.regionDownList.close();
                        EventBus.closeModalAll();
                        Actions.pop();
                    }}
                    title={I18n.t('Analysis filter')}
                    rightButtonTitle={I18n.t('Confirm')}
                    onRightButtonPress={()=> {this.onConfirm()}}
                />
                <NetInfoIndicator/>
                <View style={styles.panel}>                  
                    <TouchableActive>
                       {this.renderMode()}
                       {selectTab}
                       {this.renderContent()}
                       {this.renderData()}
                    </TouchableActive>                       
                </View>

                <SlideModalEx ref={(c) => { this.modalDownList = c; }} offsetY={offsetY} opacity={0} width={width-10}
                              onClosed={() => {this.setState({dropDown:false})}}>
                    <FlatList ref={c => this.mode = c}
                              showsVerticalScrollIndicator={false}
                              style={styles.list}
                              data={modeList}
                              extraData={this.state}
                              keyExtractor={(item, index) => index.toString()}
                              renderItem={this.renderRow}
                    />
                </SlideModalEx>
                <SlideModalEx ref={(c) => { this.regionDownList = c; }} offsetY={offsetY2} opacity={0} width={width-10}
                              onClosed={() => {this.setState({dropDownRegion:false})}}>
                    <FlatList ref={c => this.region = c}
                              showsVerticalScrollIndicator={false}
                              style={styles.list}
                              data={[I18n.t('Region one filter'),I18n.t('Region two filter')]}
                              extraData={this.state}
                              keyExtractor={(item, index) => index.toString()}
                              renderItem={this.renderRegionList}
                    />
                </SlideModalEx>

                <ModalPatrol  mode={null} ref={c => this.modalPatrol = c} report={true} onSelect={data => {
                     let {params} = this.state;
                     params.inspectId = data.id ? data.id: -1;
                     params.inspectName = data.name;
                     this.setState({params});
                }}/>

                <AndroidBacker onPress={() => {
                    this.modalDownList && this.modalDownList.close();
                    this.regionDownList && this.regionDownList.close();
                    EventBus.closeModalAll();
                    Actions.pop();
                    return true;
                }}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:'#f7f9fa'
    },
    brandName:{
        fontSize: 14,
        textAlignVertical: 'center',
        height:44,
        lineHeight:44
    },
    outBox:{
        alignItems:'center',
        borderRadius:8,
        height:46
    },
    panel:{
        paddingLeft:10,
        paddingRight:10,
        flex:1
    },
    calendar:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingLeft:14,
        paddingRight:14
    },
    label:{
        color:'#666666',
        fontSize:12,
        marginTop:16,
        marginLeft:14
    },
    labelEx:{
        color:'#666666',
        fontSize:12,
    },
    range:{
        fontSize: 16,
        color:'#9D9D9D',
        alignSelf:'center'
    },
    modePanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 8,
        marginLeft:14
    },
    mode:{
        height:36,
        borderRadius: 10,
        marginRight:10,
        backgroundColor: '#ffffff',
        alignItems:'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingLeft:6,
        paddingRight:6
    },
    type:{
        fontSize:14,
        height:40,
        lineHeight: 40,
        marginLeft:3,
        textAlign: 'center',
        textAlignVertical:'center'
    },
    tablePanel:{
        height:46,
        width:width-48,
        borderRadius: 10,
        backgroundColor:'#fff'
    },
    btnCard:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems: 'center',
        paddingLeft: 12,
        paddingRight: 12
    },
    tableName: {
        fontSize: 14,
        color:'#9D9D9D',
        height: 46,
        lineHeight:46,
        textAlignVertical: 'center',
    },
    tips:{
        fontSize:12,
        marginTop:3,
        marginLeft:14
    },
    list:{
        marginLeft:24,
        width:width-48,
        maxHeight:280,
        marginTop:10,
        marginBottom:10,
        borderRadius:10,
        paddingTop:12,
        paddingBottom:12,
        backgroundColor:'white'
    },
    borderShadow:{
        position:'absolute',
        top:0,
        left:0,
        zIndex:-99,
        width:width-46,
        marginLeft:23,
        borderRadius:10,
        backgroundColor:'#fff'
    },
    containerOption:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        marginLeft:14,
        marginTop:16,
        paddingTop:5,
        width:width-48,
        ...Platform.select({
            ios:{
                zIndex:10
            }
        })
    },
    country:{
        maxWidth:100
    },
    province:{
        maxWidth:100,
        marginLeft:20
    },
    sortCity:{
        fontSize:12,
        marginTop:-3,
        color:'#3B3737'
    },
    selectCountry:{
        fontSize:16,
        color:'#3B3737'
    },
    selectProvince:{
        fontSize:16,
        color:'#3B3737',
    },
    viewStyle:{
        borderWidth: 1,
        borderColor: '#006AB7',
        borderRadius: 10,
        //paddingLeft:12,
        //paddingRight:12,
        height:30,
        marginTop:-12,
        minWidth:65
    },
    textStyle:{
        fontSize:14,
        color:'#02528B',
        height:30,
        lineHeight: 30,
        textAlign: 'center',
        textAlignVertical: 'center',
        marginTop:-2
    },
    dataList:{
        marginTop:17,
        backgroundColor:'#edf0f2',
        borderRadius:10,
        paddingLeft:10,
        paddingRight:10,
        marginBottom:20,
        flex:1,
        zIndex:-1
    },
    divider:{
        marginLeft:3,
        marginRight:3,
        height:2,
        backgroundColor:'#F7F9FA',
        borderBottomWidth:0
    },
    cityGroup:{
        paddingBottom:30,
        borderBottomColor:'#fff'
    },
    cityText:{
        fontSize:14,
        color:'#85898E',
        marginTop:14,
        marginLeft:5,
        marginBottom:5
    },
    group:{
        flexDirection:'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems:'center'
    },
    blobContainer: {
        width: (width-62)/3,
        height: 124,
        borderRadius: 10,
        padding:5,
        backgroundColor:'#ffffff',
        alignItems:'flex-start',
        borderColor:'#2C90D9',
    },
    noTask:{
        position: 'absolute',
        right: 5,
        bottom: 0,
        borderRadius:10,
        width:42,
        height:38
    },
    blobName:{
        color:'#556679',
        padding:5,
        fontSize:16
    },
    check:{
        position: 'absolute',
        left:8,
        bottom:8,
        width:20,
        height:20
    },
    unCheck:{
        position: 'absolute',
        left:8,
        bottom:8,
        width:20,
        height:20,
        backgroundColor:'#dcdfe5',
        borderRadius:20
    },
    statusImg:{
        height:54,
        borderRadius:5,
        position:'relative',
        width:(width-62)/3-10,
        backgroundColor:'#ECF7FF'
    },
    segment:{
        width:width-48,
        height: 32,
        borderRadius:10,
        backgroundColor:'#fff'
    },
    tabInactive:{
        backgroundColor:'#fff',
        borderColor: '#fff',
        borderRadius:10,
        width:(width-48)/2,
    },
    textInactive:{
        color:'#85898E'
    },
    tabActive:{
        backgroundColor:'#006AB7',
        borderRadius: 10,
        borderWidth:0,
        height:33,
        width:(width-48)/2,
    }
});
