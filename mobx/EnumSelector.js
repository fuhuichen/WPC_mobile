import { observable, action } from 'mobx'
import ParamSelector from "./ParamSelector";

class EnumSelector {
    @observable serviceIndex = {
        VIUBI: 0,
        VIUMO: 1,
        VISITORS: 2,
        CASHCHECK: 3
    };

    // Enum Attachment
    @observable mediaTypes = {
        AUDIO: 0,
        VIDEO: 1,
        IMAGE: 2,
        TEXT: 3,
        PDF: 4
    };

    // Enum Pages
    @observable viewType = {
        LOADING: 0,
        FAILURE: 1,
        EMPTY: 2,
        SUCCESS: 3,
    };

    // Enum http request result
    @observable errorType = {
        SUCCESS: 0,
        ERROR: 1,
        NONETITLE: 6001,
        SUBMITFAIL_NOPERMISSION: 7001,
        SUBMITFAIL: 8001
    };

    // Enum grade and point
    @observable scoreType = {
        SCORELESS: 0,
        UNQUALIFIED: 1,
        QUALIFIED: 2,
        FAIL: 3,
        PASS: 4,
        IGNORE: 5
    };

    // Enum categories
    @observable categoryType = {
        RATE: 0,
        SCORE: 1,
        APPEND: 2,
        FEEDBACK: 3
    };

    // Enum operators
    @observable operatorType = {
        NONE: 0,
        GRADE: 1,
        IGNORE: 2,
        COMMENT: 3,
        DETAIL: 4
    };

    // Enum data type
    @observable dataType = {
        INT: 0,
        FLOAT: 1
    };

    // Store module
    @observable storeType = {
        ALL: 0,
        LOCATE: 1,
        OVERDUE: 2
    };

    // Enum load
    @observable loadType = {
        STORE: 0,
        LOCATE: 1,
        REPORT: 2
    };

    @observable switchType = {
        ALL: 0,
        FOCAL: 1,
        QUALIFIED: 2,
        IGNORED: 3,
        REMARK: 4,
        FEEDBACK: 5
    };

    // Event
    @observable eventType = {
        ALL: 0,
        DONE: 1,
        RECENT: 2,
        CLOSED: 3,
        PENDING: 4
    };

    @observable statusType = {
        PENDING: 0,
        DONE: 1,
        CLOSED: 2,
        REJECT: 3,
        OVERDUE: 4
    };

    @observable actionType = {
        ADD: 0,
        HANDLE: 1,
        CLOSE: 2,
        REJECT: 3,
        RELATE: 4,
    };

    // Notifications
    @observable notifyType = {
        SYSTEM: 0,
        PATROL: 3,
        EVENT: 5,
        REPORT: 8,
        APPROVE: 9,
        SCHEDULE: 11
    };

    @observable patrolType = {
        REMOTE: 0,
        ONSITE: 1
    };

    @observable analysisType = {
        STORE: 0,
        PATROL: 1,
        EVENT: 2,
        RECORD:3
    };

    @observable rangeType = {
        WEEK: 0,
        MONTH: 1,
        QUARTERLY: 2,
        YEAR: 3
    };

    @observable unitType = {
        NUMBER: 0,
        TIMES: 1,
        POINT: 2,
        PERCENT: 3
    };

    @observable sortType = {
        ASC: 0,
        DESC: 1
    };

    @observable columnType = {
        COLUMN1: 0,
        COLUMN2: 1
    };

    @observable groupType = {
        STORE: 0,
        REGION_1: 1,
        REGION_2:  2,
        BRANCH_TYPE: 3,
        STORE_REGION: 4,
        PERSON: 5
    };

    @observable signType = {
        LOCATING: 0,
        LOCATE_SUCCESS: 1,
        LOCATE_FAILURE: 2,
        SIGNING: 3,
        SIGN_SUCCESS: 4,
        SIGN_FAILURE: 5
    };

    @observable sourceType = {
        VIDEO: 0,
        REMOTE: 1,
        ONSITE: 2
    }

    @observable approveType = {
        PENDING: 0,
        SUBMITTED: 1,
        CC_MINE: 2
    };

    @observable workflowTaskType = {
        ICREATE: 0,
        MYTASK: 1,  // 待我簽核
        MYAUDITEDTASK: 2,   // 我已簽核
        CC_MINE: 3
    };

    @observable processType = {
        NOT_CONFIGURED: 0,
        NOT_APPROVED: 1,
        APPROVING: 2,
        REJECT: 3,
        PASS: 4
    };

    @observable workflowType = {
        CREATED: 0,
        APPROVED: 1,
        APPROVING: 2,
        PENDING: 3,
        REJECT: 4,
        CANCEL: 5,
        DRAWBACK: 6,
        SYSTEMREJECT: 7,
        SYSTEMINGORE: 8
    };

    @observable auditTargetType = {
        USER: 0,
        GROUP: 1
    };

    @observable auditState = {
        PROCESSING: 2,  //處理中
        REJECT: 3,      //駁回
        SUCCESS: 4,     //簽核通過
        CANCEL: 5,      //取消
        WITHDRAW: 6,    //撤回
        SYSTEMWITHDRAW: 7     // 系統撤回
    };

    @observable workflowInfoType = {
        INSPECTREPORT: 0
    };

    @observable approveFeedbackType = {
        AGREE: 0,
        REJECT: 1
    };

    @observable memoRequiredType = {
        UNREQUIRED: 0,
        REQUIRED: 1,
        REQUIRED_UNQUALIFIED: 2
    };

    @observable scheduleType = {
        TODAY: 0,
        ALL: 1
    }

    @observable scheduleState = {
        PENDING: 0,
        DONE: 1
    }

    @observable cashcheckStatus = {
        NORMAL: 1,
        ABNORMAL: 2
    }

    @observable cashcheckInputType = {
        NUMBER: 1,
        STRING: 2,
        SYSTEMCALC: 3
    }

    @observable cashcheckOperatorType = {
        PLUS: 1,
        SUBTRACT: 2
    }

    @observable cashcheckConditionType = {
        MORE: 1,
        EQUAL: 2,
        LESS: 3
    }

    @observable dateUnit = {
        DAY: 1,
        MONTH: 2,
        YEAR: 3
    }
}

export default new EnumSelector()
