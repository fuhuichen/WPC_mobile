import { observable, action } from 'mobx'
import I18n from 'react-native-i18n';
import store from "./Store";

class ParamSelector {

    @observable summary2Text = I18n.t('Good');
    @observable summary1Text = I18n.t('Improve');
    @observable summary0Text = I18n.t('Dangerous');

    @observable cashCheckSummary1Text = I18n.t('Normal');
    @observable cashCheckSummary2Text = I18n.t('Abnormal');

    @observable getSummaries(){
        return [
            {
                id: 2,
                name: this.summary2Text,
                color: '#59AB22',
                backgroundColor:'#EDF6E8'
            },
            {
                id: 1,
                name: this.summary1Text,
                color: '#F57848',
                backgroundColor:'#FFF2EF'
            },
            {
                id: 0,
                name: this.summary0Text,
                color: '#E22472',
                backgroundColor:'#FFEFF5'
            }
        ];
    }

    @observable resetSummaries(index){
        switch(index) {
            case 0: this.summary0Text = I18n.t('Dangerous'); break;
            case 1: this.summary1Text = I18n.t('Improve'); break;
            case 2: this.summary2Text = I18n.t('Good'); break;
        }
    }

    @observable getCashCheckSummaries(){
        let cashcheckStatus = store.enumSelector.cashcheckStatus;
        return [
            {
                id: cashcheckStatus.NORMAL,
                name: this.cashCheckSummary1Text,
                color: '#59AB22',
                backgroundColor:'#EDF6E8'
            },
            {
                id: cashcheckStatus.ABNORMAL,
                name: this.cashCheckSummary2Text,
                color: '#E22472',
                backgroundColor:'#FFEFF5'
            }
        ];
    }

    @observable getCashCheckSummary(status){
        let cashcheckStatus = store.enumSelector.cashcheckStatus;
        if(status == cashcheckStatus.NORMAL) {
            return [
                {
                    id: cashcheckStatus.NORMAL,
                    name: this.cashCheckSummary1Text,
                    color: '#59AB22',
                    backgroundColor:'#EDF6E8'
                }
            ];
        } else {
            return [
                {
                    id: cashcheckStatus.ABNORMAL,
                    name: this.cashCheckSummary2Text,
                    color: '#E22472',
                    backgroundColor:'#FFEFF5'
                }
            ];
        }        
    }

    @observable resetCashChecSummaries(index){
        let cashcheckStatus = store.enumSelector.cashcheckStatus;
        switch(index) {
            case cashcheckStatus.NORMAL: this.cashCheckSummary1Text = I18n.t('Normal'); break;
            case cashcheckStatus.ABNORMAL: this.cashCheckSummary2Text = I18n.t('Abnormal'); break;
        }
    }

    @observable fontSizes = [
        {
            type: store.enumSelector.dataType.INT,
            bigger: 18,
            smaller: 14
        },
        {
            type: store.enumSelector.dataType.FLOAT,
            bigger: 11,
            smaller: 6
        }
    ];

    @observable getBadgeMap(){
        return [
            {
                type: store.enumSelector.scoreType.SCORELESS,
                backgroundColor: '#EDF8F9',
                color:'#006AB7',
                point: '- -'
            },
            {
                type: store.enumSelector.scoreType.QUALIFIED,
                backgroundColor: '#E8F6DE',
                color:'#59AB22',
                point: I18n.t('Pass')
            },
            {
                type: store.enumSelector.scoreType.UNQUALIFIED,
                backgroundColor: '#FFF5F3',
                color:'#F57848',
                point: I18n.t('Failed')
            },
            {
                type: store.enumSelector.scoreType.PASS,
                backgroundColor: '#E8F6DE',
                color:'#59AB22',
                point: null
            },
            {
                type: store.enumSelector.scoreType.FAIL,
                backgroundColor: '#FFF5F3',
                color:'#F57848',
                label: null
            },
            {
                type: store.enumSelector.scoreType.IGNORE,
                backgroundColor: '#F2F2F2',
                color:'#6E6E6E',
                point: I18n.t('Ignored')
            }
        ];
    }

    @observable backgroundColors = [
        {
            type: store.enumSelector.scoreType.SCORELESS,
            color: '#F1F1F1'
        },
        {
            type: store.enumSelector.scoreType.PASS,
            color: '#8FD92E'
        },
        {
            type: store.enumSelector.scoreType.FAIL,
            color: '#D23636'
        },
        {
            type: store.enumSelector.scoreType.IGNORE,
            color: '#D23636'
        }
    ];

    @observable mediaMaps = [
        {
            type: store.enumSelector.mediaTypes.AUDIO,
            name: 'audio',
            suffix: '.aac'
        },
        {
            type: store.enumSelector.mediaTypes.IMAGE,
            name: 'image',
            suffix: '.jpg'
        },
        {
            type: store.enumSelector.mediaTypes.VIDEO,
            name: 'video',
            suffix: '.mp4'
        },
        {
            type: store.enumSelector.mediaTypes.PDF,
            name: 'pdf',
            suffix: '.pdf'
        }
    ];

    @observable getStatusMap(){
        return [
            {
                id: store.enumSelector.statusType.PENDING,
                name: I18n.t('Pending'),
                backgroundColor: '#FFF2EF',
                color: '#F57848'
            },
            {
                id: store.enumSelector.statusType.DONE,
                name: I18n.t('Done'),
                backgroundColor: '#EDF6E8',
                color: '#59AB22'
            },
            {
                id: store.enumSelector.statusType.REJECT,
                name: I18n.t('Reject'),
                backgroundColor: '#FFEFF5',
                color: '#E22472'
            },
            {
                id: store.enumSelector.statusType.CLOSED,
                name: I18n.t('Closed'),
                backgroundColor: '#EFEFEF',
                color: '#6E6E6E'
            },
            {
                id: store.enumSelector.statusType.OVERDUE,
                name: I18n.t('Closed'),
                backgroundColor: '#EFEFEF',
                color: '#6E6E6E'
            }
        ]
    }

    @observable getApproveMap() {
        return [
            {
                type: store.enumSelector.auditState.PROCESSING,
                name: I18n.t('Approve Processing'),
                color: 'rgb(0,106,183)'
            },
            {
                type: store.enumSelector.auditState.REJECT,
                name: I18n.t('Approve Reject'),
                color: 'rgb(245,120,72)'
            },
            {
                type: store.enumSelector.auditState.SUCCESS,
                name: I18n.t('Approve Success'),
                color: 'rgb(89,171,34)'
            },
            {
                type: store.enumSelector.auditState.CANCEL,
                name: I18n.t('Cancel'),
                color: 'rgb(245,120,72)'
            },
            {
                type: store.enumSelector.auditState.WITHDRAW,
                name: I18n.t('Approve Withdraw'),
                color: 'rgb(245,120,72)'
            },
            {
                type: store.enumSelector.auditState.SYSTEMWITHDRAW,
                name: I18n.t('System Approve Withdraw'),
                color: 'rgb(245,120,72)'
            }
        ]
    }

    @observable getScheduleStateMap() {
        return [
            {
                type: store.enumSelector.scheduleState.PENDING,
                name: I18n.t('Pending'),
                color: 'rgb(245,120,72)'
            },
            {
                type: store.enumSelector.scheduleState.DONE,
                name: I18n.t('Done'),
                color: 'rgb(89,171,34)'
            }
        ]
    }

    @observable unValued = -(2**31);
    @observable unSelect = -1;

    
    @observable waterPrintParam = {
        waterPrintText: "",
        waterPrintType: 0, // 浮水印顯示類型 0-自定義文字，1-使用人員名稱
        waterPrintSize: "44px", // 文字大小
        waterPrintPosition: "center", // 位置，預設 中
        waterPrintColor: "rgba(255, 255, 255, 1)", // 文字顏色，預設 rgba(255, 255, 255, 1)
    };

    @observable setWaterPrintParam(param){
        this.waterPrintParam.waterPrintText = param.waterPrintText;
        this.waterPrintParam.waterPrintType = param.waterPrintType;
        this.waterPrintParam.waterPrintSize = param.waterPrintSize;
        this.waterPrintParam.waterPrintPosition = param.waterPrintPosition;
        this.waterPrintParam.waterPrintColor = param.waterPrintColor;
    }
}

export default new ParamSelector()
