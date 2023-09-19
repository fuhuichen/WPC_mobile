import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    TouchableOpacity,
    DeviceEventEmitter,
    BackHandler,
    Platform
} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from "react-native-router-flux";
import PropTypes from 'prop-types';
import uuid from 'react-native-uuid';
import Navigation from "../../element/Navigation";
import store from "../../../mobx/Store";
import TouchableActive from "../../touchables/TouchableActive";
import EventBus from "../../common/EventBus";
import {getCashCheckFormTemplate, getCashCheckReportInfo} from "../FetchRequest";
import {UPDATE_PATROL_DATA} from "../../common/Constant";
import BaseCashCheck from "../../customization/BaseCashCheck";
import NetInfoIndicator from "../../components/NetInfoIndicator";
import ModalCenter from "../../components/ModalCenter";
import CashCheckStorage from "./CashCheckStorage";
import AndroidBacker from "../../components/AndroidBacker";
import {ColorStyles} from "../../common/ColorStyles";
import ViewIndicator from "../../customization/ViewIndicator";
import PhoneInfo from "../../entities/PhoneInfo";
import CashCheckCategory from "./CashCheckCategory";
import CashCheckCore from "./CashCheckCore";
import CashCheckGroup from "./CashCheckGroup";
import CashCheckAttachment from "./CashCheckAttachment";

const {width} = Dimensions.get('screen');
export default class CashChecking extends BaseCashCheck{
    state = {
        cashcheckSelector: store.cashcheckSelector,
        paramSelector: store.paramSelector,
        enumSelector: store.enumSelector,
        screenSelector: store.screenSelector,
        storeSelector: store.storeSelector,
        approveSelector: store.approveSelector,
        viewType: store.enumSelector.viewType.LOADING,
        isModify: false
    };

    static propTypes = {
        uuid: PropTypes.string,
        reportId: PropTypes.number,
        version: PropTypes.number,
        formId: PropTypes.string
    };

    static defaultProps = {
        uuid: null,
        reportId: null,
        version: null,
        formId: null
    };

    componentDidMount(){
        (async ()=>{
            (this.props.reportId != null) ? (await this.modifyReport()) : ((this.props.uuid != null) ? (await this.keepData()) : (await this.fetchData()));
        })();
    }

    componentWillUnmount() {
    }

    async modifyReport() {
        let {cashcheckSelector, enumSelector} = this.state;
        let {reportId, version} = this.props;
    
        let body = {
            reportId: reportId,
            version: version
        }
        let result = await getCashCheckReportInfo(body);
        if (result.errCode !== enumSelector.errorType.SUCCESS) {
            this.setState({viewType: enumSelector.viewType.FAILURE});
            return;
        }

        cashcheckSelector.uuid = uuid.v4();
        cashcheckSelector.formId = result.data.formId;
        cashcheckSelector.store = {
            name: result.data.storeName,
            storeId: result.data.storeId
        };
        CashCheckCore.initModify(cashcheckSelector, result.data);

        this.setState({viewType: enumSelector.viewType.SUCCESS, cashcheckSelector, isModify: true},
            () => {
                EventBus.updateBaseCashCheck();
        });
    }

    async keepData(){
        let {uuid} = this.props;
        let {cashcheckSelector, enumSelector} = this.state;

        let data = CashCheckStorage.get(uuid);
        store.cashcheckSelector = CashCheckStorage.parseState(data);
        cashcheckSelector = store.cashcheckSelector;

        this.setState({
            cashcheckSelector, viewType: enumSelector.viewType.SUCCESS
        });
    }

    onBack(){        
        let {cashcheckSelector} = this.state;
        CashCheckStorage.abandon(cashcheckSelector.uuid);

        EventBus.refreshTemporary();
        EventBus.refreshStoreDetail();
        EventBus.refreshStoreInfo();
        EventBus.refreshEventInfo();

        Actions.pop();
    }

    async fetchData(){
        let {store, formId} = this.props;
        let {enumSelector, cashcheckSelector, storeSelector} = this.state;

        this.setState({viewType: enumSelector.viewType.LOADING});

        let body = {
            formId: formId
        };
        let result = await getCashCheckFormTemplate(body);

        if (result.errCode !== enumSelector.errorType.SUCCESS){
            this.setState({viewType: enumSelector.viewType.FAILURE});
            return;
        }

        cashcheckSelector.uuid = uuid.v4();
        cashcheckSelector.formId = formId;
        cashcheckSelector.store = storeSelector.collection;
        CashCheckCore.init(cashcheckSelector, result.data);

        this.setState({viewType: enumSelector.viewType.SUCCESS, cashcheckSelector},
            () => {
                EventBus.updateBaseCashCheck();
        });
    }

    onRouter(){
        Actions.push('cashcheckSummary', {reportId: this.props.reportId});
    }

    onSummary(){
        let {cashcheckSelector} = this.state;
        this.category && this.category.onClose();

        if(CashCheckCore.checkItemRequiredUnfinish(cashcheckSelector) == true) {
            this.modalRequired && this.modalRequired.open();
        } else if(CashCheckCore.checkItemTypeNumberCorrect(cashcheckSelector) == false) {
            this.modalNumberInputIncorrect && this.modalNumberInputIncorrect.open();
        } else {
            this.onRouter();
        }        
    }

    enableRightButton(){
        let {cashcheckSelector} = this.state;
        let itemList = CashCheckCore.getItems(cashcheckSelector);
        let result = false;
        itemList.forEach(item => {
            if(item.value || item.value == 0) {                
                result = true;
            }
        })
        return result;
    }

    render() {
        let {viewType, enumSelector, cashcheckSelector, isModify} = this.state;
        let storeName = cashcheckSelector.store ? cashcheckSelector.store.name : '';

        let padding = PhoneInfo.isSimpleLanguage() ? 11 : 8;
        let selectRootGroup = [];
        if(cashcheckSelector.categoryType != null) {
            selectRootGroup = cashcheckSelector.rootGroups.find(p => p.id === cashcheckSelector.categoryType);
        }

        return (
            <TouchableActive style={styles.container}>
                <Navigation
                    onLeftButtonPress={()=>{
                        this.category && this.category.onClose();
                        if (cashcheckSelector.categories.length !== 0){
                            this.modalBack && this.modalBack.open()
                        }else{
                            Actions.pop();
                        }
                    }}
                    title={storeName}
                    rightButtonTitle={I18n.t('CashCheck Finish')}
                    rightButtonEnable={this.enableRightButton()}
                    rightButtonStyle={{activeColor:'#C60957', inactiveColor:'#CCCED1',
                        textColor:'#ffffff', padding: padding, fontSize:14}}
                    onRightButtonPress={() => this.onSummary()}
                />
                <NetInfoIndicator/>

                {(viewType !== enumSelector.viewType.SUCCESS) && <ViewIndicator viewType={viewType} containerStyle={{marginTop:242}}
                    refresh={() => {
                        (async ()=> this.fetchData())()
                    }}/>}
                {(viewType === enumSelector.viewType.SUCCESS) && <View style={{flex:1}}>
                    <CashCheckCategory ref={c => this.category = c} isModify={isModify} onClick={() => {
                        setTimeout(() => {
                            this.group && this.group.onScroll();
                        }, 100)
                    }}/>
                    {(cashcheckSelector.categoryType != null) && <CashCheckGroup ref={c => this.group = c} data={selectRootGroup}/>}
                    {(cashcheckSelector.categoryType == null) && <CashCheckAttachment onBacker={() => this.modalBack && this.modalBack.open()}/>}
                </View>}

                <ModalCenter ref={c => this.modalBack = c} title={I18n.t('Exit CashCheck')} description={I18n.t('CashCheck Quitting confirm')}
                             confirm={() => this.onBack()}/>
                <ModalCenter ref={c => this.modalRequired = c} title={I18n.t('CashCheck Finish')} description={I18n.t('Required Unfinished prompt')}
                             showCancel={false}/>
                <ModalCenter ref={c => this.modalNumberInputIncorrect = c} title={I18n.t('CashCheck Finish')} description={I18n.t('Cashcheck Number Input incorrect')}
                            showCancel={false}/>
                <AndroidBacker onPress={() => {
                    //if (patrolSelector.categories.length !== 0){
                        this.modalBack && this.modalBack.open();
                        return true;
                    //}
                }}/>
            </TouchableActive>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ColorStyles.STATUS_BACKGROUND_COLOR
    },
    header:{
        backgroundColor:'#E4E4E4'
    },
    view:{
        flexDirection:'row',
        justifyContent:'space-between'
    },
    searchPanel:{
        position:'absolute',
        left: 56,
        top: 0,
        width:54,
        ...Platform.select({
            android: {
                height:56
            },
            ios: {
                height:78
            }
        })
    },
    search:{
        width:20,
        height:20,
        ...Platform.select({
            android:{
                marginTop:13
            },
            ios:{
                marginTop:25
            }
        })
    }
});
