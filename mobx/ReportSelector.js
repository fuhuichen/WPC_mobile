import { observable} from 'mobx'

class ReportSelector {
    @observable inspectSettings = [];
    @observable temporaries = []
}

export default new ReportSelector()
