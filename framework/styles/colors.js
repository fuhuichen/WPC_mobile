import {COLORS} from '../enums'

export const colors  = {
   BACKGROUND: COLORS.BG,
   TEXT: COLORS.MIDNIGHT_BLUE,
   TEXT_SECONDARY: COLORS.ASBESTOS,
   header:{
     backgroundColor:COLORS.PRIMARY_BLUE,
   },
   bottom:{
     height:64,
     width:'100%',
     borderColor:COLORS.GRAY,
     borderTopWidth:1,
     backgroundColor:COLORS.WHITE,
   },
   button:{
     backgroundColor:COLORS.PRIMARY_BLUE,
     active:{
       backgroundColor:COLORS.PRIMARY_DARK_BLUE,
     },
     disable:{
       backgroundColor:COLORS.DISABLE_BG,
     }
   },
   input:{
     focusColor:COLORS.TEXT,
     alertColor:COLORS.ERROR,
     backgroundColor:COLORS.WHITE,
     color:COLORS.TEXT,
     borderColor:COLORS.GRAY,
     disable:{
       color:COLORS.TEXT,
     }
   },
   tabContainer:{
     backgroundColor:COLORS.WHITE,
     borderColor:COLORS.GRAY,
     borderTopWidth:0,
   },
   tab:{
     normal:{
       borderRadius:4,
     },
     selected:{
       backgroundColor:COLORS.FOCUS_BG,
       borderColor:COLORS.PRIMARY_BLUE,
       borderWidth:1,
       borderRadius:4,
     }
   },
   selection:{
     backgroundColor:COLORS.WHITE,
     color:COLORS.PRIMARY_BLUE,
     hintColor:COLORS.HINT_GRAY,
     borderColor:COLORS.GRAY,
   },

};
