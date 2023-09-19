import React from "react";

export const Context = React.createContext();
import {colors} from './styles/colors'
import {typography} from './styles/typography'
import {dims} from './styles/dims'
const theme = {
  colors,typography,dims
}

export function getTypographyColor(theme,value,defaultValue){
  if(value &&  theme.typography.color[value]){
    //  console.log(value+ " to " + theme.typography.color[value])
      return theme.typography.color[value]
  }
  else{
    return defaultValue
    // console.log("Default="+theme.typography.color[defaultValue])
     //return theme.typography.color[defaultValue]
  }

}
export function getTypographySize(theme,value,defaultValue){
  if(value &&  theme.typography[value]){
    //  console.log("getTypographySize",theme.typography[value])
      return theme.typography[value]
  }
  else if(defaultValue &&  theme.typography[defaultValue]){
  //  console.log("getTypographySize",theme.typography[defaultValue])
      return theme.typography[defaultValue]
  }


}
export class FrameworkProvider extends React.Component {
  state = {
    theme:theme,
    updateTheme: (theme) => {
      this.setState({ theme: theme })
    }
  }

  render() {
    const { theme } = this.state
    //console.log(theme)
    return (
      <Context.Provider value={this.state} theme={theme}  >
        { this.props.children }
      </Context.Provider>
    )
  }
}

export default FrameworkProvider;
