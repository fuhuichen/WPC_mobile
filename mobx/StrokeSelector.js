import { observable, action } from 'mobx'

class StrokeSelector {
    @observable StrokeColor = 0;
    @observable StrokeWidth = 2;

    @action
    setStrokeWidth (value) {
        this.StrokeWidth = value;
    }

    @action
    setStrokeColor(value) {
        this.StrokeColor = value;
    }
}

export default new StrokeSelector()