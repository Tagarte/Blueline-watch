import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';

interface BarChartProps {
    data: number[];
    labels: string[];
    height?: number;
    color?: string;
    title?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
                                                      data,
                                                      labels,
                                                      height = 200,
                                                      color = '#007BFF',
                                                      title,
                                                  }) => {
    const width = Dimensions.get('window').width - 40;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding;

    const maxValue = Math.max(...data, 1);
    const barWidth = chartWidth / data.length - 8;

    const getY = (value: number): number => {
        return padding + chartHeight - (value / maxValue) * chartHeight;
    };

    const getHeight = (value: number): number => {
        return (value / maxValue) * chartHeight;
    };

    const yAxisLabels = [maxValue, maxValue / 2, 0];

    return (
        <View style={styles.container}>
            {title && <Text style={styles.title}>{title}</Text>}
            <Svg width={width} height={height}>
                {yAxisLabels.map((label, i) => {
                    const y = getY(label);
                    return (
                        <G key={`grid-${i}`}>
                            <Line
                                x1={padding}
                                y1={y}
                                x2={width - padding}
                                y2={y}
                                stroke="#e0e0e0"
                                strokeWidth="1"
                                strokeDasharray="5,5"
                            />
                            <SvgText
                                x={padding - 5}
                                y={y + 4}
                                fontSize="10"
                                fill="#666"
                                textAnchor="end"
                            >
                                {Math.round(label)}
                            </SvgText>
                        </G>
                    );
                })}

                {data.map((value, index) => {
                    const x = padding + index * (barWidth + 8) + 4;
                    const y = getY(value);
                    const barHeight = getHeight(value);
                    return (
                        <Rect
                            key={`bar-${index}`}
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            fill={color}
                            rx={4}
                        />
                    );
                })}

                {labels.map((label, index) => {
                    const x = padding + index * (barWidth + 8) + 4 + barWidth / 2;
                    return (
                        <SvgText
                            key={`label-${index}`}
                            x={x}
                            y={height - padding / 2}
                            fontSize="10"
                            fill="#666"
                            textAnchor="middle"
                        >
                            {label}
                        </SvgText>
                    );
                })}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
});