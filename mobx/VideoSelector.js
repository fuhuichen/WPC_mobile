import { observable, action } from 'mobx'

class VideoSelector {
    @observable content = [];

    @observable storeId = '';
    @observable deviceId = 0;

    @observable getData(){
        return this.content.find(p => p.storeId === this.storeId);
    }

    @observable getDeviceName(id){
        let data = this.getData(), name = '';

        if ((data != null) && (data.device.length > 0)){
            let info = data.device.find(p => p.id === id);
            (info != null) && (name = info.name);
        }

        return name;
    }
}

export default new VideoSelector()
