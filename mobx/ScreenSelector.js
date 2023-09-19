import { observable, action } from 'mobx'

class ScreenSelector {
    @observable patrolType = {
        NORMAL: 0,
        VIDEO: 1,
        PATROL: 2,
        UNFINISHED: 3,
        FEEDBACK: 4,
        SUMMARY: 5,
        SEARCH: 6,
        MONITOR:7
    }
}

export default new ScreenSelector()
