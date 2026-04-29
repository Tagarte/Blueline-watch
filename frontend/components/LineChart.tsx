import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Path, Circle, G, Text as SvgText } from 'react-native-svg';

interface LineChartProps {
    data: number[];
    labels: string[];
    height?: number;
    color?: string;
    title?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
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
    const minValue = Math.min(...data, 0);
    const valueRange = maxValue - minValue;

    const getX = (index: number): number => {
        return padding + (index / (data.length - 1)) * chartWidth;
    };

    const getY = (value: number): number => {
        return padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
    };

    const generatePath = (): string => {
        let path = `M ${getX(0)} ${getY(data[0])}`;
        for (let i = 1; i < data.length; i++) {
            path += ` L ${getX(i)} ${getY(data[i])}`;
        }
        return path;
    };

    const generateAreaPath = (): string => {
        let path = `M ${getX(0)} ${getY(data[0])}`;
        for (let i = 1; i < data.length; i++) {
            path += ` L ${getX(i)} ${getY(data[i])}`;
        }
        path += ` L ${getX(data.length - 1)} ${getY(minValue)} L ${getX(0)} ${getY(minValue)} Z`;
        return path;
    };

    const yAxisLabels = [maxValue, (maxValue + minValue) / 2, minValue];

    return (
        <View style={styles.container}>
            {title && <Text style={styles.title}>{title}</Text>}
            <Svg width={width} height={height}>
                <Path
                    d={generateAreaPath()}
                    fill={`${color}20`}
                    stroke="none"
                />

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

                <Path
                    d={generatePath()}
                    stroke={color}
                    strokeWidth="2"
                    fill="none"
                />

                {data.map((value, index) => (
                    <Circle
                        key={`point-${index}`}
                        cx={getX(index)}
                        cy={getY(value)}
                        r="4"
                        fill={color}
                        stroke="#fff"
                        strokeWidth="2"
                    />
                ))}

                {labels.map((label, index) => (
                    <SvgText
                        key={`label-${index}`}
                        x={getX(index)}
                        y={height - padding / 2}
                        fontSize="10"
                        fill="#666"
                        textAnchor="middle"
                    >
                        {label}
                    </SvgText>
                ))}
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