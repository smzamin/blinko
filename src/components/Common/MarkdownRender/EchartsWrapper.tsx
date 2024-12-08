import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface EchartsWrapperProps {
  options: string;
}

const EchartsWrapper: React.FC<EchartsWrapperProps> = ({ options }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    try {
      const parsedOptions = JSON.parse(options);
      
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }
      
      chartInstance.current.setOption(parsedOptions);
    } catch (error) {
      console.error('Failed to parse Echarts options:', error);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [options]);

  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="echarts-wrapper">
      <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
    </div>
  );
};

export default EchartsWrapper; 