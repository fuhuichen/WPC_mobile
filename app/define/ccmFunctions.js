import PAGERS from './pages'
import {LangUtil} from "../../framework"
const CCMFUNCTIONS=[
  { id:PAGERS.EVENT_MANAGE,
    type:"nav-event-mgt",
    name:"function_event_manage"},
  { id:PAGERS.DATA_ANALYSIS,
    type:"nav-data-analysis",
    name:"function_data_analysis"},
  { id:PAGERS.DEVICE_MANAGE,
    type:"nav-device-mgt",
    name:"function_device_manage"},
  { id:PAGERS.MORE,
    type:"nav-more",
    name:"function_more"},
]
export default CCMFUNCTIONS;

/*
type="nav-device-mgt"
height={theme.colors.bottom.height}/>
<Tab selected={false} text={"ABC"}
noborder
iconSize={36}
type="nav-data-analysis"
height={theme.colors.bottom.height}/>
<Tab selected={false} text={"ABC"}
noborder
iconSize={36}
type="nav-event-mgt"
height={theme.colors.bottom.height}/>
<Tab selected={false} text={"ABC"}
noborder
iconSize={36}
type="nav-more"
*/
