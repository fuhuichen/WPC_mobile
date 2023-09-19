import { observable, action } from 'mobx'
import moment from "moment";
import I18n from 'react-native-i18n';
import store from "./Store";

class FilterSelector {
    @observable report = {
        beginTs: 0,
        endTs: 0,
        modes: [],
        tableName: I18n.t('All'),
        tableMode:-1,
        tableId:-1,
        order: 1,
        keyword: false
    };

    @observable event = {
        beginTs: 0,
        endTs: 0,
        storeId: [],
        status : [],
        source: [],
        order: 1,
        keyword: false,
        selectInspects: [],
        selectInspectsName: ''
    };

    @observable analysisData = {
        modeIndex:0,
        regionIndex:0,
        tabIndex:0,

        countries:[I18n.t('All')],
        provinces:[I18n.t('All')],
        positions:[I18n.t('All')],

        country:I18n.t('All'),
        province:I18n.t('All'),
        position:I18n.t('All'),

        searchTextStore:'',
        searchTextUser:'',
        selectStore:null,
        checkUserId:null,
        checkStoreId:null,
        lastCheckStoreId:null,
        lastCheckUserId:null,

        userData:[],
        storeData:[],
        inspectName:I18n.t('Select inspect'),
        inspectId:0,

        result:{
            type:1,
            inspect:[],
            userId:[],
            storeId:[],
            content:[],
            text:'',
        }
    };

    @observable analysis =  [
        {
            type:1,
            data:store.filterSelector.analysisData
        },
        {
            type:2,
            data:store.filterSelector.analysisData
        },
        {
            type:3,
            data:store.filterSelector.analysisData
        },
        {
            type:4,
            data:store.filterSelector.analysisData
        }
    ];

    @observable schedule = {
        beginTs: 1,
        endTs: moment().add(90, 'days').endOf('day').unix()*1000,
        isExecute: null,
        tagMode	: null,
        order: 'asc'
    };

    @observable cashcheckRecord = {
        beginTs: moment().subtract(1, 'months').startOf('day').unix()*1000,
        endTs: moment().endOf('day').unix()*1000,
        status: null,
        order: 'desc'
    };

    @observable getBeginTs(){
        return moment().subtract(89, 'days').startOf('day').unix()*1000;
    }

    @observable getEndTs(){
        return moment().endOf('day').unix()*1000;
    }

    @observable initAnalysis() {
        this.analysis.forEach(item =>{
            item.data = this.analysisData;
        })
    }

    @observable initSchedule() {
        this.schedule = {
            beginTs: moment().subtract(30, 'days').startOf('day').unix()*1000,
            endTs: moment().add(60, 'days').endOf('day').unix()*1000,
            isExecute: null,
            tagMode	: null,
            order: 'asc'
        };
    }
}

export default new FilterSelector()
