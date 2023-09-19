import { observable, action } from 'mobx'
import store from "./Store";

class PatrolSelector {
    @observable uuid = null;
    @observable store = null;
    @observable inspect = null;

    @observable categoryType = null;
    @observable dataType = store.enumSelector.dataType.INT;
    @observable inspectSettings = [];
    @observable signature = null;

    @observable categories = [];
    @observable data = [];
    @observable groups = [];
    @observable feedback = [];

    @observable visible = false;
    @observable collection = null;
    @observable sequence = 0;
    @observable interactive = false;

    @observable signatures = [];
    @observable attachments = [];
    @observable comment = '';
    @observable workflowDescription = '';
    @observable reportList = [];
    @observable isWorkflowReport = false;
    @observable inspectReportId = '';
    @observable workflowInfo = [];

    @observable unfinished = [];
    @observable search = [];

    @observable screen = store.screenSelector.patrolType.NORMAL;
    @observable router = store.screenSelector.patrolType.PATROL;
    @observable keyIndex = -1;

    @observable signTime = 0;
    @observable checkinId = 0;
    @observable longitude = 0;
    @observable latitude = 0;
    @observable distance = null;
    @observable mapDownloadPath = null;
    @observable checkinIgnore = false;

    @observable weatherId = null;
    @observable deviceId = null;
    @observable scheduleId = null;
}

export default new PatrolSelector()
