import React from 'react'
import { PieChart } from 'react-native-svg-charts'
import { Text } from 'react-native-svg'

class PieChartWithCenteredLabels extends React.PureComponent {

    render() {


        const Labels = ({ slices, height, width }) => {
            return slices.map((slice, index) => {
                const { labelCentroid, pieCentroid, data } = slice;
                if(this.props.renderLabel){
                  return (
                      <Text
                          key={index}
                          x={pieCentroid[ 0 ]}
                          y={pieCentroid[ 1 ]}
                          fill={'white'}
                          textAnchor={'middle'}
                          alignmentBaseline={'middle'}
                          fontSize={16}
                          stroke={'black'}
                          strokeWidth={0.2}
                      >
                          {data.value+'%'}
                      </Text>
                  )
                }

            })
        }

        return (
            <PieChart
                style={this.props.style}
                valueAccessor={({ item }) => item.value}
                data={this.props.data}
                spacing={0}
            >
                <Labels/>
            </PieChart>
        )
    }

}

export default PieChartWithCenteredLabels