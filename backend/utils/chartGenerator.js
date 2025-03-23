// utils/chartGenerator.js
const generateChartData = (data, chartType) => {
    switch (chartType) {
      case 'bar':
        return {
          type: 'bar',
          data: {
            labels: data.map(item => item.label),
            datasets: [{
              label: data.title || 'Data',
              data: data.map(item => item.value),
              backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }]
          }
        };
      case 'line':
        return {
          type: 'line',
          data: {
            labels: data.map(item => item.label),
            datasets: [{
              label: data.title || 'Trend',
              data: data.map(item => item.value),
              borderColor: 'rgba(255, 99, 132, 1)'
            }]
          }
        };
      case 'pie':
        return {
          type: 'pie',
          data: {
            labels: data.map(item => item.label),
            datasets: [{
              data: data.map(item => item.value),
              backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)'
              ]
            }]
          }
        };
      default:
        return null;
    }
  };