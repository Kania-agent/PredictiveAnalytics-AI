// PredictiveAnalytics-AI — Full Forecasting Tool
// ============================================================

let dataPoints = [];
let lastForecast = null;

// ---- Initialization ----
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('inputDate').valueAsDate = new Date();
  document.getElementById('methodSelect').addEventListener('change', updateMethodOptions);
});

function updateMethodOptions() {
  const method = document.getElementById('methodSelect').value;
  document.getElementById('movingOptions').style.display = method === 'moving' ? 'block' : 'none';
  document.getElementById('expOptions').style.display = method === 'exponential' ? 'block' : 'none';
}

// ---- Data Management ----
function addDataPoint() {
  const dateStr = document.getElementById('inputDate').value;
  const value = parseFloat(document.getElementById('inputValue').value);
  if (!dateStr || isNaN(value)) { alert('Enter valid date and value'); return; }
  dataPoints.push({ date: new Date(dateStr), value });
  dataPoints.sort((a, b) => a.date - b.date);
  document.getElementById('inputValue').value = '';
  renderDataList();
}

function removeDataPoint(idx) {
  dataPoints.splice(idx, 1);
  renderDataList();
}

function clearData() {
  dataPoints = [];
  lastForecast = null;
  document.getElementById('metricsSection').style.display = 'none';
  document.getElementById('forecastTablePanel').style.display = 'none';
  renderDataList();
  clearChart();
}

function renderDataList() {
  const container = document.getElementById('dataList');
  if (dataPoints.length === 0) {
    container.innerHTML = '<p class="placeholder">No data points yet. Add some or load sample data.</p>';
    return;
  }
  container.innerHTML = dataPoints.map((p, i) => `
    <div class="data-entry">
      <span class="idx">${i + 1}</span>
      <span class="date">${p.date.toISOString().slice(0, 10)}</span>
      <span class="value">${p.value.toFixed(2)}</span>
      <button class="del-btn" onclick="removeDataPoint(${i})">✕</button>
    </div>
  `).join('');
}

function loadSampleData() {
  dataPoints = [];
  const now = new Date();
  // Generate 60 days of trending data with seasonality and noise
  for (let i = 0; i < 60; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (60 - i));
    const trend = 100 + i * 1.5;
    const seasonal = 20 * Math.sin(i * Math.PI / 7);
    const noise = (Math.random() - 0.5) * 15;
    dataPoints.push({ date, value: Math.max(0, trend + seasonal + noise) });
  }
  renderDataList();
}

// ---- Forecasting Methods ----
function linearRegression(values) {
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += values[i];
    sumXY += i * values[i]; sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  // Standard error for confidence intervals
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * i + intercept;
    sse += (values[i] - predicted) ** 2;
  }
  const se = Math.sqrt(sse / (n - 2));
  return { slope, intercept, se, predict: (x) => slope * x + intercept };
}

function movingAverage(values, windowSize) {
  const result = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = values.slice(start, i + 1);
    result.push(window.reduce((a, b) => a + b, 0) / window.length);
  }
  // Forecast = average of last windowSize values
  const lastWindow = values.slice(-windowSize);
  const forecastVal = lastWindow.reduce((a, b) => a + b, 0) / lastWindow.length;
  // Std of recent values for confidence
  const mean = forecastVal;
  const variance = lastWindow.reduce((s, v) => s + (v - mean) ** 2, 0) / lastWindow.length;
  const se = Math.sqrt(variance);
  return {
    fitted: result,
    forecastVal,
    se,
    predict: (offset) => forecastVal + (Math.random() - 0.5) * se * 0.3 // slight random walk for multi-step
  };
}

function exponentialSmoothing(values, alpha) {
  const fitted = [values[0]];
  let lastFitted = values[0];
  for (let i = 1; i < values.length; i++) {
    lastFitted = alpha * values[i] + (1 - alpha) * lastFitted;
    fitted.push(lastFitted);
  }
  // Forecast = last smoothed value (flat forecast for simple exponential)
  const forecastVal = lastFitted;
  // Estimate error variance
  let sse = 0;
  for (let i = 1; i < values.length; i++) {
    sse += (values[i] - fitted[i - 1]) ** 2;
  }
  const se = Math.sqrt(sse / (values.length - 1));
  return { fitted, forecastVal, se, predict: (offset) => forecastVal };
}

// ---- Run Forecast ----
function runForecast() {
  if (dataPoints.length < 3) { alert('Need at least 3 data points'); return; }
  const values = dataPoints.map(p => p.value);
  const n = values.length;
  const periodsAhead = parseInt(document.getElementById('forecastPeriods').value) || 10;
  const confidence = parseFloat(document.getElementById('confidenceLevel').value);
  const zScore = { 0.80: 1.28, 0.90: 1.645, 0.95: 1.96, 0.99: 2.576 }[confidence] || 1.96;
  const method = document.getElementById('methodSelect').value;

  let fitted, forecasts = [], lower = [], upper = [];

  if (method === 'linear') {
    const lr = linearRegression(values);
    fitted = Array.from({ length: n }, (_, i) => lr.predict(i));
    for (let i = 0; i < periodsAhead; i++) {
      const pred = lr.predict(n + i);
      forecasts.push(pred);
      const margin = zScore * lr.se * Math.sqrt(1 + 1 / n + (n + i - (n - 1) / 2) ** 2 / ((n - 1) * n * (n - 1) / 12 + 1));
      lower.push(pred - margin);
      upper.push(pred + margin);
    }
    computeMetrics(values, fitted, 'linear', lr);
  } else if (method === 'moving') {
    const ws = parseInt(document.getElementById('windowSize').value) || 5;
    const ma = movingAverage(values, ws);
    fitted = ma.fitted;
    let lastForecast = ma.forecastVal;
    for (let i = 0; i < periodsAhead; i++) {
      forecasts.push(lastForecast);
      const spread = ma.se * Math.sqrt(i + 1);
      lower.push(lastForecast - zScore * spread);
      upper.push(lastForecast + zScore * spread);
    }
    computeMetrics(values, fitted, 'moving');
  } else if (method === 'exponential') {
    const alpha = parseFloat(document.getElementById('alphaSlider').value) || 0.3;
    const es = exponentialSmoothing(values, alpha);
    fitted = es.fitted;
    let lastForecast = es.forecastVal;
    for (let i = 0; i < periodsAhead; i++) {
      forecasts.push(lastForecast);
      const spread = es.se * Math.sqrt(i + 1);
      lower.push(lastForecast - zScore * spread);
      upper.push(lastForecast + zScore * spread);
    }
    computeMetrics(values, fitted, 'exponential');
  }

  // Build forecast dates
  const lastDate = dataPoints[dataPoints.length - 1].date;
  const forecastDates = [];
  for (let i = 1; i <= periodsAhead; i++) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + i);
    forecastDates.push(d);
  }

  lastForecast = {
    historicalDates: dataPoints.map(p => p.date),
    historicalValues: values,
    fitted,
    forecastDates,
    forecasts,
    lower,
    upper,
    method,
    confidence
  };

  drawChart(lastForecast);
  renderForecastTable(lastForecast);
  document.getElementById('forecastTablePanel').style.display = 'block';
}

// ---- Accuracy Metrics ----
function computeMetrics(actual, fitted, method, lr) {
  const n = actual.length;
  let mae = 0, mape = 0, sse = 0, sst = 0;
  const mean = actual.reduce((a, b) => a + b, 0) / n;
  for (let i = 0; i < n; i++) {
    const err = actual[i] - fitted[i];
    mae += Math.abs(err);
    if (actual[i] !== 0) mape += Math.abs(err / actual[i]) * 100;
    sse += err * err;
    sst += (actual[i] - mean) ** 2;
  }
  const r2 = sst > 0 ? 1 - sse / sst : 1;
  const rmse = Math.sqrt(sse / n);

  document.getElementById('metricMAE').textContent = (mae / n).toFixed(3);
  document.getElementById('metricMAPE').textContent = (mape / n).toFixed(2);
  document.getElementById('metricR2').textContent = r2.toFixed(4);
  document.getElementById('metricRMSE').textContent = rmse.toFixed(3);
  document.getElementById('metricsSection').style.display = 'block';
}

// ---- Chart Drawing ----
function drawChart(fc) {
  const canvas = document.getElementById('forecastCanvas');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const container = canvas.parentElement;
  const rect = container.getBoundingClientRect();
  const W = rect.width - 20;
  const H = 340;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const pad = { top: 20, right: 30, bottom: 40, left: 60 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  // Compute bounds
  const allValues = [...fc.historicalValues, ...fc.fitted, ...fc.forecasts, ...fc.upper, ...fc.lower].filter(v => v != null);
  const minV = Math.min(...allValues) * 0.95;
  const maxV = Math.max(...allValues) * 1.05;
  const totalPoints = fc.historicalValues.length + fc.forecasts.length;

  function xToPixel(i) { return pad.left + (i / (totalPoints - 1)) * chartW; }
  function vToPixel(v) { return pad.top + (1 - (v - minV) / (maxV - minV)) * chartH; }

  // Grid
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (chartH / 5) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    const val = maxV - (maxV - minV) * i / 5;
    ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(1), pad.left - 6, y + 3);
  }

  // Confidence interval (filled area)
  if (fc.forecasts.length > 0) {
    ctx.beginPath();
    const startIdx = fc.historicalValues.length;
    for (let i = 0; i < fc.forecasts.length; i++) {
      ctx.lineTo(xToPixel(startIdx + i), vToPixel(fc.upper[i]));
    }
    for (let i = fc.forecasts.length - 1; i >= 0; i--) {
      ctx.lineTo(xToPixel(startIdx + i), vToPixel(fc.lower[i]));
    }
    ctx.closePath();
    ctx.fillStyle = '#22c55e22';
    ctx.fill();
  }

  // Upper/lower bounds lines
  if (fc.forecasts.length > 0) {
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    const startIdx = fc.historicalValues.length;
    ['upper', 'lower'].forEach(key => {
      ctx.beginPath();
      ctx.strokeStyle = '#22c55e55';
      for (let i = 0; i < fc.forecasts.length; i++) {
        const x = xToPixel(startIdx + i);
        const y = vToPixel(fc[key][i]);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  // Historical data line
  ctx.beginPath();
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 2;
  fc.historicalValues.forEach((v, i) => {
    const x = xToPixel(i);
    const y = vToPixel(v);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Historical data points
  ctx.fillStyle = '#60a5fa';
  fc.historicalValues.forEach((v, i) => {
    ctx.beginPath();
    ctx.arc(xToPixel(i), vToPixel(v), 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Fitted line
  if (fc.fitted && fc.fitted.length > 0) {
    ctx.beginPath();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 3]);
    fc.fitted.forEach((v, i) => {
      const x = xToPixel(i);
      const y = vToPixel(v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Forecast line
  if (fc.forecasts.length > 0) {
    ctx.beginPath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    const startIdx = fc.historicalValues.length;
    // Connect from last historical point
    ctx.moveTo(xToPixel(startIdx - 1), vToPixel(fc.historicalValues[fc.historicalValues.length - 1]));
    fc.forecasts.forEach((v, i) => {
      ctx.lineTo(xToPixel(startIdx + i), vToPixel(v));
    });
    ctx.stroke();

    // Forecast points
    ctx.fillStyle = '#22c55e';
    fc.forecasts.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(xToPixel(startIdx + i), vToPixel(v), 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Divider line
  const divX = xToPixel(fc.historicalValues.length - 0.5);
  ctx.beginPath();
  ctx.strokeStyle = '#64748b55';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.moveTo(divX, pad.top);
  ctx.lineTo(divX, pad.top + chartH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Labels on X axis
  ctx.fillStyle = '#64748b';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'center';
  const allDates = [...fc.historicalDates, ...fc.forecastDates];
  const step = Math.max(1, Math.floor(allDates.length / 10));
  allDates.forEach((d, i) => {
    if (i % step === 0 || i === allDates.length - 1) {
      const x = xToPixel(i);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      ctx.fillText(label, x, H - 10);
    }
  });
}

function clearChart() {
  const canvas = document.getElementById('forecastCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ---- Forecast Table ----
function renderForecastTable(fc) {
  const wrap = document.getElementById('forecastTableWrap');
  let html = '<table><thead><tr><th>#</th><th>Date</th><th>Forecast</th><th>Lower</th><th>Upper</th></tr></thead><tbody>';
  fc.forecastDates.forEach((d, i) => {
    html += `<tr>
      <td>${i + 1}</td>
      <td>${d.toISOString().slice(0, 10)}</td>
      <td style="color:#22c55e">${fc.forecasts[i].toFixed(3)}</td>
      <td style="color:#94a3b8">${fc.lower[i].toFixed(3)}</td>
      <td style="color:#94a3b8">${fc.upper[i].toFixed(3)}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

// ---- Export ----
function exportForecast() {
  if (!lastForecast) { alert('Run a forecast first'); return; }
  const lines = ['Date,Type,Value,Lower,Upper'];
  lastForecast.historicalDates.forEach((d, i) => {
    lines.push(`${d.toISOString().slice(0, 10)},historical,${lastForecast.historicalValues[i].toFixed(4)},,`);
  });
  lastForecast.forecastDates.forEach((d, i) => {
    lines.push(`${d.toISOString().slice(0, 10)},forecast,${lastForecast.forecasts[i].toFixed(4)},${lastForecast.lower[i].toFixed(4)},${lastForecast.upper[i].toFixed(4)}`);
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `forecast_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
