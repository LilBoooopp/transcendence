export interface ChartData {
	[key: string]: string | number;
}

export interface BaseChartProps {
	data: ChartData[];
	xAxisKey: string;
	series: {
		dataKey: string;
		color?: string;
		name?: string;
	}[];
	height?: number | string;
	title?: string;
}